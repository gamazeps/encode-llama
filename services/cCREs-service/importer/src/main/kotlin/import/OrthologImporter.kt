package import

import Importer
import util.*
import mu.KotlinLogging
import java.io.Closeable
import javax.sql.DataSource

private val log = KotlinLogging.logger {}

private const val ORTHOLOG_FILES_TABLE_DEF = "grch38_mm10_ortholog(grch38, mm10)"

interface OrthologSource {
    fun import(sink: OrthologSink)
}

class OrthologImporter(private val sources: List<OrthologSource>) : Importer {
    override fun import(dataSource: DataSource) {
        log.info { "Running metadata schema..." }
        executeSqlResource(dataSource, "schemas/ortholog.sql")
        OrthologSink(dataSource).use {sink ->
            for (source in sources) {
                source.import(sink)
            }
        }
        log.info { "Orthology import complete!" }
        log.info { "Orthology import running post script!" }
        executeSqlResource(dataSource, "schemas/ortholog-post.sql")
        log.info { "Orthology import completed running post script!" }
    }
}

class OrthologSink(dataSource: DataSource): Closeable {
    private val orthologFilesOut = CopyValueWriter(dataSource, ORTHOLOG_FILES_TABLE_DEF)
    fun orthologFile(grch38: String, mm10: String) = orthologFilesOut.write(grch38, mm10)
    override fun close() {
        orthologFilesOut.close()
    }
}