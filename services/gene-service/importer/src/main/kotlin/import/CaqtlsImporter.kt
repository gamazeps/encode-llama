package import

import Importer
import util.*
import mu.KotlinLogging
import java.io.Closeable
import javax.sql.DataSource

private val log = KotlinLogging.logger {}

class CaqtlsImporter(private val sources: List<CaqtlsSource>) : Importer {

    override fun import(dataSource: DataSource) {
        log.info { "Running ca qtls schema..." }
        executeSqlResource(dataSource, "schemas/caqtls.sql")
       CaqtlsSink(dataSource).use {sink ->
            for (source in sources) {
                source.import(sink)
            }
        }
        log.info { "caqtls  import complete!" }
        log.info { "Running post import schema commands on caqtls..." }
        executeSqlResource(dataSource,"schemas/caqtls-post.sql")
        log.info { "caqtls creation done!" }
    }
}

interface CaqtlsSource {
    fun import(sink: CaqtlsSink)
}
private const val CAQTLS_TABLE_DEF = "caqtls(snpid,type)"

class CaqtlsSink(dataSource: DataSource): Closeable {

    private val caqtlsOut = CopyValueWriter(dataSource, CAQTLS_TABLE_DEF)

    fun write(snpid: String, type: String) =
            caqtlsOut.write(snpid,type)

    override fun close() {
       caqtlsOut.close()
    }
}