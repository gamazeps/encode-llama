package import

import Importer
import mu.KotlinLogging
import util.*
import java.io.Closeable
import java.util.*
import javax.sql.DataSource

private val log = KotlinLogging.logger {}


/**
 * Importer for experiment and processed file metadata.
 *
 * Steps:
 * - Runs initial schema creation for metadata tables
 * - Dumps data from given sources into metadata tables.
 */
class CellTypeDescImporter(private val sources: List<CellTypeSource>): Importer {

    override fun import(dataSource: DataSource) {
        log.info { "Running celltype schema..." }
        val allAssemblies: Map<String, List<CellTypeSource>> = sources
                .flatMap { source -> source.assemblies().map { it to source } }
                .groupBy({ it.first }, { it.second })
        for (assembly in allAssemblies.keys) {
            // Common replacements for sql template resources
            val replacements = mapOf("\$ASSEMBLY" to assembly)
            executeSqlResource(dataSource, "schemas/celltype-desc.sql",replacements)
            CellTypeSink(dataSource,assembly).use { sink ->
                for (source in sources) {
                    source.import(assembly,sink)
                }
            }
            log.info { "Celltype desc import complete!" }
        }
    }
}

interface CellTypeSource {
    fun assemblies(): Set<String>
    fun import(assembly: String,sink: CellTypeSink)
}
private fun celltypeTableDef(assembly: String) =  "celltype_descriptions_${assembly} (celltype,wiki_desc,ct_image_url)";

class CellTypeSink(dataSource: DataSource,assembly: String): Closeable {

    private val datasetsOut = CopyValueWriter(dataSource, celltypeTableDef(assembly))

    fun dataset(celltype: String?,wiki_desc:String?,ct_image_url:String?) =
            datasetsOut.write(celltype,wiki_desc,ct_image_url)

    override fun close() {
        datasetsOut.close()
    }

}
