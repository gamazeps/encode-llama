package import

import Importer
import util.*
import mu.KotlinLogging
import java.io.Closeable
import javax.sql.DataSource

private val log = KotlinLogging.logger {}

class LinkedGenesImporter(private val sources: List<LinkedGenesSource>) : Importer {

    override fun import(dataSource: DataSource) {
        log.info { "Running metadata schema..." }
        executeSqlResource(dataSource, "schemas/linkedgenes.sql")
        LinkedGenesSink(dataSource).use {sink ->
            for (source in sources) {
                source.import(sink)
            }
        }
        log.info { "Linked Genes import complete!" }
        log.info { "Linked Genes import running post script!" }
        executeSqlResource(dataSource, "schemas/linkedgenes-post.sql")
        log.info { "Linked genes import completed running post script!" }
    }
}

interface LinkedGenesSource {
    fun import(sink: LinkedGenesSink)
}

private const val LINKE_GENES_FILES_TABLE_DEF = "linked_genes(accession,gene,assembly,assay,experiment_accession,celltype)"

class LinkedGenesSink(dataSource: DataSource): Closeable {

    private val linkedgenesFilesOut = CopyValueWriter(dataSource, LINKE_GENES_FILES_TABLE_DEF)

    fun linkedgenesFile(accession: String,gene: String,assembly: String,assay: String,experiment_accession: String,celltype: String) =
            linkedgenesFilesOut.write(accession,gene,assembly,assay,experiment_accession,celltype)

    override fun close() {
        linkedgenesFilesOut.close()
    }
}