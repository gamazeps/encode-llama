package import

import Importer
import mu.KotlinLogging
import util.*
import java.io.Closeable
import javax.sql.DataSource

private val log = KotlinLogging.logger {}

/**
 * Importer for peaks data.
 *
 * Steps:
 * - Runs initial schema creation for peaks table.
 * - Dumps data from given sources in peaks table.
 * - Runs post-processing to create indexes.
 *
 * @param postProcessingPar - Parallelism for tasks in the post-processing step.
 * You can find these tasks in the ${searchTerm}-peaks-post.sql resource file separated by "----"
 */
class PeaksImporter(private val sources: List<PeaksSource>,private val searchTerm: String, private val postProcessingPar: Int) : Importer {

    override fun import(dataSource: DataSource) {
        // Create a map of assemblies from all sources to their sources
        val allAssemblies: Map<String, List<PeaksSource>> = sources
                .flatMap { source -> source.assemblies().map { it to source } }
                .groupBy({ it.first }, { it.second })

        for (assembly in allAssemblies.keys) {

                var replacements = mapOf("\$ASSEMBLY" to assembly)

                val searchTerm: String = searchTerm.toLowerCase()
                log.info { "Running ${searchTerm} peaks schema for assembly $assembly..." }
                executeSqlResource(dataSource, "schemas/${searchTerm}-peaks.sql", replacements)
                log.info { "Starting data imports on ${searchTerm} peaks..." }
                PeaksSink(dataSource, searchTerm, assembly).use { sink ->
                    for (source in sources) {
                        source.import(assembly, sink)
                    }
                }
                log.info { "Running post import schema (index on peaks table) commands on ${searchTerm} peaks for assembly $assembly..." }
                executeSqlResourceParallel("${searchTerm} Peaks post-import update", dataSource,
                         "schemas/${searchTerm}-peaks-post.sql",postProcessingPar, replacements)
                log.info { "${searchTerm} Peaks import (index on peaks table) for assembly $assembly complete!" }
                if (searchTerm.toLowerCase() == "chip-seq") {
                    log.info { "Running post import schema (partitions on peaks table) commands on ${searchTerm} peaks for assembly $assembly..." }
                    executeSqlResourceParallel("${searchTerm} Peaks post-import update", dataSource,
                            "schemas/${searchTerm}-peaks-partitions-post.sql",postProcessingPar, replacements)
                    executeSqlResourceParallel("${searchTerm} Peaks post-import update", dataSource,
                            "schemas/${searchTerm}-peaks-with-metadata-post.sql",postProcessingPar, replacements)
                    log.info { "${searchTerm} Peaks import (partitions on peaks table) for assembly $assembly complete!" }
                }
            executeSql(dataSource, """
                INSERT INTO ${searchTerm.toLowerCase().replace("-", "_")}_peak_counts (assembly, count) VALUES (
                    '$assembly', (SELECT COUNT(*) FROM ${searchTerm.toLowerCase().replace("-", "_")}_peaks_${assembly})
                )
            """.trimIndent())

        }

        log.info { "${searchTerm} Peaks import for complete!" }
    }
}

interface PeaksSource {
    fun assemblies(): List<String>
    fun import(assembly: String, sink: PeaksSink)
}

private fun peaksTableDef(searchTerm: String,assembly: String) = "${searchTerm}_peaks_$assembly(experiment_accession, file_accession, chrom, chrom_start, " +
        "chrom_end, name, score, strand, signal_value, p_value, q_value, peak)"

class PeaksSink(dataSource: DataSource,searchTerm: String, assembly: String): Closeable {

    private val writer = CopyValueWriter(dataSource, peaksTableDef(searchTerm.replace("-","_"),assembly))

    /**
     *  Write peaks values to peaks database.
     *
     *  @param fileValues The unparsed already tab-delimited values coming straight out of peaks bed files.
     *  Should represent all values in the peaks table from "chrom" to "peak"
     */
    fun write(experimentAccession: String, fileAccession: String, fileValues: String) {
        writer.write(experimentAccession, fileAccession, fileValues)
    }

    override fun close() = writer.close()
}