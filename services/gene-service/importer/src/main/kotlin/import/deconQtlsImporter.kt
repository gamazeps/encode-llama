package import

import Importer
import util.*
import mu.KotlinLogging
import java.io.Closeable
import javax.sql.DataSource

private val log = KotlinLogging.logger {}

class DeconqtlsImporter(private val sources: List<DeconqtlsSource>) : Importer {

    override fun import(dataSource: DataSource) {
        log.info { "Running decon qtls schema..." }
        executeSqlResource(dataSource, "schemas/deconqtls.sql")
       DeconqtlsSink(dataSource).use {sink ->
            for (source in sources) {
                source.import(sink)
            }
        }
        log.info { "deconqtls  import complete!" }
        log.info { "Running post import schema commands on deconqtls..." }
        executeSqlResource(dataSource,"schemas/deconqtls-post.sql")
        log.info { "deconqtls creation done!" }
    }
}

interface DeconqtlsSource {
    fun import(sink: DeconqtlsSink)
}
private const val DECONQTLS_TABLE_DEF = "deconqtls(geneid,snpid,snp_chrom,snp_start,nom_val,slope,adj_beta_pval,r_squared,celltype)"

class DeconqtlsSink(dataSource: DataSource): Closeable {

    private val deconqtlsOut = CopyValueWriter(dataSource, DECONQTLS_TABLE_DEF)

    fun write(geneid: String,snpid: String,snp_chrom: String,snp_start: String,nom_val: String,slope: String,adj_beta_pval: String,r_squared: String,celltype: String) =
            deconqtlsOut.write(geneid,snpid,snp_chrom,snp_start,nom_val,slope,adj_beta_pval,r_squared,celltype)

    override fun close() {
       deconqtlsOut.close()
    }
}