package import

import Importer
import util.*
import mu.KotlinLogging
import java.io.Closeable
import javax.sql.DataSource

private val log = KotlinLogging.logger {}

class QtlSigAssocImporter(private val sources: List<QtlSigAssocSource>) : Importer {

    override fun import(dataSource: DataSource) {
        log.info { "Running qtl sig assoc schema..." }
        executeSqlResource(dataSource, "schemas/qtlsigassoc.sql")
       QtlSigAssocSink(dataSource).use {sink ->
            for (source in sources) {
                source.import(sink)
            }
        }
        log.info { "qtl sig assoc  import complete!" }
        log.info { "Running post import schema commands on qtl sig assoc..." }
        executeSqlResource(dataSource,"schemas/qtlsigassoc-post.sql")
        log.info { "qtl sig assoc creation done!" }
    }
}

interface QtlSigAssocSource {
    fun import(sink: QtlSigAssocSink)
}
private const val QTL_SIG_ASSOC_TABLE_DEF = "qtlsigassoc(geneid,snpid,dist,npval,slope,fdr,qtltype)"

class QtlSigAssocSink(dataSource: DataSource): Closeable {

    private val qtlsigassocOut = CopyValueWriter(dataSource, QTL_SIG_ASSOC_TABLE_DEF)

    fun write(geneid: String,snpid: String,dist: String,npval: String,slope: String,fdr: String,qtltype: String) =
            qtlsigassocOut.write(geneid,snpid,dist,npval,slope,fdr,qtltype)

    override fun close() {
       qtlsigassocOut.close()
    }
}