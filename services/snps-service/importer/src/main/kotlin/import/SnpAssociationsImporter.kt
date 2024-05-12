
//SnpAssociationsSource

package import

import Importer
import mu.KotlinLogging
import util.*
import util.executeSqlResource
import java.io.Closeable
import javax.sql.DataSource

private const val SNPASSOCIATIONS_TABLE_DEF = "snp_associations(disease, snpid, a1, a2, n, z, chisq)"
private val log = KotlinLogging.logger {}

class SnpAssociationsImporter(private val sources: List<SnpAssociationsSource>): Importer {

    override fun import(dataSource: DataSource) {
        executeSqlResource(dataSource, "schemas/snp_associations.sql")
        SnpAssociationsSink(dataSource).use { sink ->
            for (source in sources) {
                source.import(sink)
            }
        }
        log.info { "Running post import schema commands on snp associations..." }
        executeSqlResource(dataSource,"schemas/snp_associations_post.sql")
        log.info { "snp associations index creation done!" }
    }

}

interface SnpAssociationsSource {
    fun import(sink: SnpAssociationsSink)
}

class SnpAssociationsSink(dataSource: DataSource) : Closeable {

    private val writer = CopyValueWriter(dataSource, SNPASSOCIATIONS_TABLE_DEF)

    fun write(disease: String,snpId: String,A1: String,A2: String,N: String,Z:String, CHISQ: String?) {
        try {
            writer.write(disease, snpId, A1, A2, N, Z, CHISQ)

        } catch (e: Throwable) {

            log.info("snp associations error is: $e")
        }
    }

    override fun close()  {
        writer.close()
    }

}
