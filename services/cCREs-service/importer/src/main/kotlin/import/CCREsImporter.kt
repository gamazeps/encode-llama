package import
import source.*
import Importer
import mu.KotlinLogging
import util.*
import java.io.*
import javax.sql.DataSource

private val log = KotlinLogging.logger {}

private fun tableDef(assembly: String): String
    = """${assembly}_cCREs(
        accession,
        rDHS,
        chromosome,
        start,
        stop,
        ccre_group,
        ctcf_bound
    )"""

class cCREImporter(private val sources: List<cCRESource>): Importer {

    override fun import(dataSource: DataSource) {
        
        val assemblies = sources.groupBy { it.assembly }.map { it.key }
        assemblies.forEach {
            executeSqlResource(dataSource, "schemas/ccres.sql", mapOf("\$ASSEMBLY" to it))
        }

        for (source in sources) {
            log.info { "importing cCREs for ${source.assembly}" }
            cCRESink(dataSource, source.assembly).use { sink ->
                source.import(sink)
            }
        }

        log.info { "indexing cCRE datasets" }
        assemblies.forEach {
            executeSqlResource(dataSource, "schemas/ccres_post.sql", mapOf("\$ASSEMBLY" to it))
        }

    }

}

class cCRESink(dataSource: DataSource, assembly: String) : Closeable {

    private val writer = CopyValueWriter(dataSource, tableDef(assembly))
    
    fun write(accession: String, rDHS: String, chromosome: String, start: String, stop: String, group: String, ctcf_bound: String) {
        writer.write(accession, rDHS, chromosome, start, stop, group, ctcf_bound)
    }

    override fun close()  {
        writer.close()
    }

}
