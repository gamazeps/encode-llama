package import

import Importer
import util.*
import util.executeSqlResource
import java.io.Closeable
import java.io.InputStream
import javax.sql.DataSource

private const val LDBlocks_TABLE_DEF = "(snp1, ldLinks)"

class LdBlocksImporter(private val sources: List<LdBlocksSource>): Importer {

    override fun import(dataSource: DataSource) {

        val populations = (sources.groupBy { it.population })

        populations.forEach { (population, sources) ->
            val replacements = mapOf("\$POPULATION" to population)
            executeSqlResource(dataSource, "schemas/ld.sql", replacements)
            LdBlocksSink(dataSource, population).use { sink ->
                sources.forEach {
                    it.import(sink)
                }
            }
            executeSqlResource(dataSource,"schemas/ld-post.sql", replacements)
        }

    }

}

interface LdBlocksSource {
    val population: String
    fun import(sink: LdBlocksSink)
}

class LdBlocksSink(dataSource: DataSource, population: String) : Closeable {

    private val tbl = "ld_$population$LDBlocks_TABLE_DEF"

    private val writer = CopyStreamWriter(dataSource,tbl)

    fun write(inputStream: InputStream) {
        writer.write(inputStream)
    }

    override fun close()  {
        writer.close()
    }

}
