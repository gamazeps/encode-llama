package import

import Importer
import mu.KotlinLogging
import util.*
import util.executeSqlResource
import java.io.Closeable
import javax.sql.DataSource

private val log = KotlinLogging.logger {}

class FeatureImporter(private val sources: List<FeatureSource>) : Importer {

    override fun import(dataSource: DataSource) {

        // Create a map of assemblies from all sources to their sources
        val allAssemblies: Map<String, List<FeatureSource>> = sources
                .flatMap { source -> source.assemblies().map { it to source } }
                .groupBy({ it.first }, { it.second })

        for (assembly in allAssemblies.keys) {
            
            // Common replacements for sql template resources
            val replacements = mapOf("\$ASSEMBLY" to assembly)

            log.info { "Running feature schemas for assembly $assembly" }
            executeSqlResource(dataSource, "schemas/features.sql", replacements)

            FeatureSink(dataSource, assembly).use {sink ->
                for (source in allAssemblies.getValue(assembly)) {
                    source.import(assembly, sink)
                }
            }

            log.info { "Running feature post import commands for assembly $assembly..." }
            executeSqlResource(dataSource, "schemas/features-post.sql", replacements)
            log.info { "Feature import for assembly $assembly complete!" }
        }

    }

}

interface FeatureSource {
    fun assemblies(): Set<String>
    fun import(assembly: String, sink: FeatureSink)
}

private const val COMMON_FIELDS = "id, idPrefix, chromosome, start, stop, project, score, strand, phase"

private fun geneTableDef(assembly: String) = "gene_$assembly($COMMON_FIELDS, name, gene_type, havana_id)"
private fun transcriptTableDef(assembly: String) = "transcript_$assembly($COMMON_FIELDS, name, transcript_type, havana_id, " +
        "support_level, tag, parent_gene)"
private fun exonTableDef(assembly: String) = "exon_$assembly($COMMON_FIELDS, name, exon_number, parent_transcript)"
private fun cdsTableDef(assembly: String) = "cds_$assembly($COMMON_FIELDS, parent_exon, parent_protein, tag)"
private fun utrTableDef(assembly: String) = "utr_$assembly($COMMON_FIELDS, direction, parent_exon, parent_protein, tag)"

class FeatureSink(dataSource: DataSource, assembly: String) : Closeable {

    private val geneWriter = CopyValueWriter(dataSource, geneTableDef(assembly))
    private val transcriptWriter = CopyValueWriter(dataSource, transcriptTableDef(assembly))
    private val exonWriter = CopyValueWriter(dataSource, exonTableDef(assembly))
    private val cdsWriter = CopyValueWriter(dataSource, cdsTableDef(assembly))
    private val utrWriter = CopyValueWriter(dataSource, utrTableDef(assembly))

    fun writeGene(common: FeatureCommon, name: String?, geneType: String?, havanaId: String?) =
            geneWriter.write(*common.toStringArray(), name, geneType, havanaId)

    fun writeTranscript(common: FeatureCommon, name: String?, transcriptType: String?, havanaId: String?, supportLevel: Int?,
                        tag: String?, parentGene: String?) =
            transcriptWriter.write(*common.toStringArray(), name, transcriptType, havanaId, supportLevel?.toString(),
                    tag, parentGene)

    fun writeExon(common: FeatureCommon, name: String?, exonNumber: Int?, parentTranscript: String?) =
            exonWriter.write(*common.toStringArray(), name, exonNumber?.toString(), parentTranscript)

    fun writeCds(common: FeatureCommon, parentExon: String?, parentProtein: String?, tag: String?) =
            cdsWriter.write(*common.toStringArray(), parentExon, parentProtein, tag)

    fun writeUtr(common: FeatureCommon, direction: Int, parentExon: String?, parentProtein: String?, tag: String?) =
            utrWriter.write(*common.toStringArray(), direction.toString(), parentExon, parentProtein, tag)

    private fun FeatureCommon.toStringArray() = arrayOf(id, idPrefix, chromosome, start.toString(), stop.toString(), project,
            score.toString(), strand.toString(), phase.toString())

    override fun close() {
        geneWriter.close()
        transcriptWriter.close()
        exonWriter.close()
        cdsWriter.close()
        utrWriter.close()
    }

}

/**
 * The common attributes for all features
 */
data class FeatureCommon(
        val id: String,
        val idPrefix: String,
        val chromosome: String,
        val start: Int,
        val stop: Int,
        val project: String,
        val score: Double,
        val strand: Char,
        val phase: Int
)