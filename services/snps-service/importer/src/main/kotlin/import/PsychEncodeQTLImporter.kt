package import

import Importer
import mu.KotlinLogging
import util.*
import java.io.*
import javax.sql.DataSource
private val log = KotlinLogging.logger {}

private const val HG38_PEQTLS_TABLE_DEF = """
    hg38_psychencode_eQTLs(
        gene_id, strand, n_tested_snps, distance_to_tss, snp_id, chromosome, start, stop, pval, regression_slope,
        is_top_snp, fdr
    )
"""

private const val HG38_PCQTLS_TABLE_DEF = """
    hg38_psychencode_cQTLs(
        peak_id, strand, n_tested_snps, distance, snp_id, chromosome, start, stop, pval, regression_slope, is_top_snp,
        fdr
    )
"""

private val ASSEMBLY_TO_TABLE_DEF = mapOf(
    "hg38" to mapOf(
        "e" to HG38_PEQTLS_TABLE_DEF,
        "c" to HG38_PCQTLS_TABLE_DEF
    )
)

class PsychEncodeQTLImporter(private val sources: List<PsychEncodeQTLSource>,
                             private val assembly: String,
                             private val postProcessingPar: Int,
                             private val type: String): Importer {

    override fun import(dataSource: DataSource) {
        val asm = assembly.toLowerCase()
        val tbl = "${asm}_psychencode_${type}qtls"
        executeSqlResource(dataSource, "schemas/$tbl.sql")
        PsychEncodeQTLSink(dataSource, assembly, type).use { sink ->
            for (source in sources) {
                source.import(sink)
            }
        }
        
        log.info("started inserting PsychENCODE ${type}QTLs")
        executeSqlResourceParallel("$assembly PsychENCODE ${type}QTLs post-import update", dataSource,
                "schemas/${assembly}_psychencode_${type}qtls-post.sql", postProcessingPar)
        log.info("finished inserting PsychENCODE eQTLs")

    }
}

interface PsychEncodeQTLSource {
    fun import(sink: PsychEncodeQTLSink)
}

class PsychEncodeQTLSink(dataSource: DataSource, assembly: String, type: String) : Closeable {

    private val tblMap = checkNotNull(ASSEMBLY_TO_TABLE_DEF[assembly]) { "Invalid assembly $assembly" }
    private val tbl = checkNotNull(tblMap[type]) { "Invalid type $type" }
    private val writer = CopyValueWriter(dataSource, tbl)
    fun write(gene_id: String, strand: String, tested: Int, distance: Int, snp_id: String, chromosome: String,
              start: Int, end: Int, pval: Float, slope: Float, top: Int, fdr: Float) {
        writer.write(gene_id, strand, tested.toString(), distance.toString(), snp_id, chromosome, start.toString(),
	             end.toString(), pval.toString(), slope.toString(), top.toString(), fdr.toString())
    }

    override fun close()  {
        writer.close()
    }
}
