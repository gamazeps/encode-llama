package import

import Importer
import mu.KotlinLogging
import util.*
import java.io.Closeable
import javax.sql.DataSource

private val log = KotlinLogging.logger {}

class QuantificationImporter(private val sources: List<QuantificationSource>, private val postProcessingPar: Int) : Importer {

    override fun import(dataSource: DataSource) {

        // Create a map of assemblies from all sources to their sources
        val allAssemblies: Map<String, List<QuantificationSource>> = sources
                .flatMap { source -> source.assemblies().map { it to source } }
                .groupBy({ it.first }, { it.second })

        for (assembly in allAssemblies.keys) {
            val replacements = mapOf("\$ASSEMBLY" to assembly)

            log.info { "Running quantification schemas for assembly $assembly" }
            executeSqlResource(dataSource, "schemas/quantification.sql", replacements)
            log.info { "Starting data imports on peaks for assembly $assembly..." }
            QuantificationSink(dataSource, assembly).use { sink ->
                for (source in sources) {
                    source.import(assembly, sink)
                }
            }
            log.info { "Running post import schema commands on peaks for assembly $assembly..." }
            executeSqlResourceParallel("Quantification post-import update", dataSource,
                    "schemas/quantification-post.sql", postProcessingPar, replacements)
            log.info { "Quantification import for assembly $assembly complete!" }
        }
        log.info { "Quantification import complete!" }
    }
}

interface QuantificationSource {
    fun assemblies(): List<String>
    fun import(assembly: String, sink: QuantificationSink)
}

private fun geneQuantTableDef(assembly: String) = "gene_quantification_$assembly(experiment_accession, file_accession, " +
        "gene_id, gene_id_prefix, transcript_ids, len, effective_len, expected_count, tpm, fpkm, posterior_mean_count, " +
        "posterior_standard_deviation_of_count, pme_tpm, pme_fpkm, tpm_ci_lower_bound, tpm_ci_upper_bound, " +
        "tpm_coefficient_of_quartile_variation, fpkm_ci_lower_bound, fpkm_ci_upper_bound, fpkm_coefficient_of_quartile_variation)"

private fun geneQuantNormalizedTableDef(assembly: String) = "gene_quantification_normalized_$assembly(experiment_accession, " +
        "gene_id, expression_value)"

private fun transcriptQuantTableDef(assembly: String) = "transcript_quantification_$assembly(experiment_accession, file_accession, " +
        "transcript_id, transcript_id_prefix, gene_id, gene_id_prefix, len, effective_len, expected_count, tpm, fpkm, iso_pct, posterior_mean_count, " +
        "posterior_standard_deviation_of_count, pme_tpm, pme_fpkm, iso_pct_from_pme_tpm, tpm_ci_lower_bound, tpm_ci_upper_bound, " +
        "tpm_coefficient_of_quartile_variation, fpkm_ci_lower_bound, fpkm_ci_upper_bound, fpkm_coefficient_of_quartile_variation)"

class QuantificationSink(dataSource: DataSource, assembly: String): Closeable {

    private val geneQuantOut = CopyValueWriter(dataSource, geneQuantTableDef(assembly))
    private val transcriptQuantOut = CopyValueWriter(dataSource, transcriptQuantTableDef(assembly))
    private val geneQuantNormOut = CopyValueWriter(dataSource, geneQuantNormalizedTableDef(assembly))

    /**
     *  Write gene quantification values to database.
     */
    fun writeGeneQuant(experimentAccession: String, fileAccession: String,
                       geneId: String, geneIdPrefix: String?, transcriptIds: List<String>, len: Float, effectiveLen: Float, expectedCount: Float,
                       tpm: Float, fpkm: Float, posteriorMeanCount: Float, posteriorStandardDeviationOfCount: Float,
                       pmeTpm: Float, pmeFpkm: Float, tpmCiLowerBound: Float, tpmCiUpperBound: Float, tpmCoefficientOfQuartileVariation: Float?,
                       fpkmCiLowerBound: Float, fpkmCiUpperBound: Float, fpkmCoefficientOfQuartileVariation: Float?) =
            geneQuantOut.write(experimentAccession, fileAccession,
                    geneId, geneIdPrefix, transcriptIds.toDbString(), len.toString(), effectiveLen.toString(), expectedCount.toString(),
                    tpm.toString(), fpkm.toString(), posteriorMeanCount.toString(), posteriorStandardDeviationOfCount.toString(),
                    pmeTpm.toString(), pmeFpkm.toString(), tpmCiLowerBound.toString(), tpmCiUpperBound.toString(), tpmCoefficientOfQuartileVariation?.toString(),
                    fpkmCiLowerBound.toString(), fpkmCiUpperBound.toString(), fpkmCoefficientOfQuartileVariation?.toString())

    /**
     *  Write normalized gene quantification values to database.
     */
    fun writeGeneQuantNormalized(experiment_accession: String, gene_id: String, expression_value: Float)
            = geneQuantNormOut.write(experiment_accession, gene_id, expression_value.toString())

    /**
     *  Write transcript quantification values to database.
     */
    fun writeTranscriptQuant(experimentAccession: String, fileAccession: String,
                             transcriptId: String, transcriptIdPrefix: String?, geneId: String, geneIdPrefix: String?, len: Int, effectiveLen: Float, expectedCount: Float,
                             tpm: Float, fpkm: Float, isoPct: Float, posteriorMeanCount: Float, posteriorStandardDeviationOfCount: Float,
                             pmeTpm: Float, pmeFpkm: Float, isoPctFromPmeTpm: Float, tpmCiLowerBound: Float, tpmCiUpperBound: Float, tpmCoefficientOfQuartileVariation: Float?,
                             fpkmCiLowerBound: Float, fpkmCiUpperBound: Float, fpkmCoefficientOfQuartileVariation: Float?) =
            transcriptQuantOut.write(experimentAccession, fileAccession,
                    transcriptId, transcriptIdPrefix, geneId, geneIdPrefix, len.toString(), effectiveLen.toString(), expectedCount.toString(),
                    tpm.toString(), fpkm.toString(), isoPct.toString(), posteriorMeanCount.toString(), posteriorStandardDeviationOfCount.toString(),
                    pmeTpm.toString(), pmeFpkm.toString(), isoPctFromPmeTpm.toString(), tpmCiLowerBound.toString(), tpmCiUpperBound.toString(),
                    tpmCoefficientOfQuartileVariation?.toString(), fpkmCiLowerBound.toString(), fpkmCiUpperBound.toString(), fpkmCoefficientOfQuartileVariation?.toString())

    override fun close() {
        geneQuantOut.close()
        transcriptQuantOut.close()
    }

}