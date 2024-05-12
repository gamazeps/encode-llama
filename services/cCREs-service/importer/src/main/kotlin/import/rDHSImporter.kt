package import
import source.*
import Importer
import mu.KotlinLogging
import util.*
import java.io.*
import javax.sql.DataSource

private val log = KotlinLogging.logger {}

private fun tableDef(assembly: String): String
    = """${assembly}_rDHSs(
        accession,
        chromosome,
        start,
        stop
    )"""

class rDHSImporter(private val sources: List<rDHSSource>): Importer {

    override fun import(dataSource: DataSource) {
        
        val assemblies = sources.groupBy { it.assembly }.map { it.key }
        assemblies.forEach {
            executeSqlResource(dataSource, "schemas/rdhss.sql", mapOf("\$ASSEMBLY" to it))
        }

        for (source in sources) {
            rDHSSink(dataSource, source.assembly).use { sink ->
                log.info { "importing rDHSs for ${source.assembly}" }
                source.import(sink)
            }
        }

        log.info { "indexing cCRE datasets" }
        assemblies.forEach {
            executeSqlResource(dataSource, "schemas/rdhss_post.sql", mapOf("\$ASSEMBLY" to it))
        }        

    }

}

class rDHSSink(dataSource: DataSource, assembly: String) : Closeable {

    private val writer = CopyValueWriter(dataSource, tableDef(assembly))
    fun write(accession: String, chromosome: String, start: String, stop: String) {
        writer.write(accession, chromosome, start, stop)
    }

    override fun close()  {
        writer.close()
    }

}
