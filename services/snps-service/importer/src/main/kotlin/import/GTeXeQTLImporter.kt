package import

import Importer
import mu.KotlinLogging
import util.*
import java.io.*
import javax.sql.DataSource
import java.io.BufferedReader
import java.io.InputStreamReader
import java.util.zip.GZIPInputStream
import org.apache.commons.compress.archivers.tar.TarArchiveInputStream

private val log = KotlinLogging.logger {}

private fun GTEX_EQTLS_TABLE_DEF(assembly: String) = """
    ${assembly}_gtex_eqtls(
        chromosome, position, gene_id, tss_distance, ma_samples, ma_count, maf, pval_nominal, slope, slope_se, pval_nominal_threshold,
        min_pval_nominal, pval_beta, tissue
    )
"""

class GTeXeQTLImporter(
    private val sources: List<GTeXeQTLSource>, private val assembly: String, private val postProcessingPar: Int
): Importer {

    override fun import(dataSource: DataSource) {
        val asm = assembly.toLowerCase()
        val tbl = "${asm}_gtex_eqtls"
        executeSqlResource(dataSource, "schemas/$tbl.sql")
        GTeXeQTLSink(dataSource, assembly).use { sink ->
            for (source in sources) {
                source.import(sink)
            }
        }
        
        log.info("started inserting GTEx 4QTLs")
        executeSqlResourceParallel("$assembly GTEx eQTLs post-import update", dataSource,
                "schemas/${assembly}_gtex_eqtls_post.sql", postProcessingPar)
        log.info("finished inserting GTEx eQTLs")

    }
}

abstract class GTeXeQTLSource {

    abstract fun import(sink: GTeXeQTLSink)

    fun import(sink: GTeXeQTLSink, stream: InputStream) {
        TarArchiveInputStream(stream).use {
            while (true) {

                val entry = it.getNextTarEntry()
                if (entry == null) break;
                if (entry.isDirectory()) continue;

                val name = entry.getName()
                if (!name.endsWith("signif_variant_gene_pairs.txt.gz")) continue
                val tissue = entry.getName().split("/").last().split(".").first()

                val reader = if (entry.getName().endsWith(".gz")) (
                    BufferedReader(InputStreamReader(GZIPInputStream(it, entry.size.toInt())))
                ) else it.bufferedReader()
                reader.readLine()

                while (true) {

                    val line = reader.readLine()
                    if (line == null) break;

                    val p = line.split('\t')
                    val id = p[0].split('_')
                    sink.write(
                        id[0], id[1].toInt(), p[1], p[2].toInt(), p[3].toInt(), p[4].toInt(), p[5].toFloat(),
                        p[6].toFloat(), p[7].toFloat(), p[8].toFloat(), p[9].toFloat(), p[10].toFloat(), p[11].toFloat(), tissue
                    )

                }

            }
        }
    }

}

class GTeXeQTLSink(dataSource: DataSource, private val assembly: String) : Closeable {

    private val writer = CopyValueWriter(dataSource, GTEX_EQTLS_TABLE_DEF(assembly))

    fun write(
        chromosome: String, position: Int, gene: String, tss_distance: Int, ma_samples: Int, ma_count: Int, maf: Float,
        pval_nominal: Float, slope: Float, slope_se: Float, pval_nominal_threshold: Float, min_pval_nominal: Float,
        pval_beta: Float, tissue: String
    ) {
        writer.write(
            chromosome, position.toString(), gene, tss_distance.toString(), ma_samples.toString(), ma_count.toString(), maf.toString(),
            pval_nominal.toString(), slope.toString(), slope_se.toString(), pval_nominal_threshold.toString(),
            min_pval_nominal.toString(), pval_beta.toString(), tissue
        )
    }

    override fun close()  {
        writer.close()
    }
}
