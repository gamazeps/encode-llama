package import

import Importer
import util.*
import mu.KotlinLogging
import java.io.Closeable
import javax.sql.DataSource

private val log = KotlinLogging.logger {}

class DegImporter(private val sources: List<DegSource>) : Importer {

    override fun import(dataSource: DataSource) {
        log.info { "Running deg schema..." }
        executeSqlResource(dataSource, "schemas/deg.sql")
       DegSink(dataSource).use {sink ->
            for (source in sources) {
                source.import(sink)
            }
        }
        log.info { "deg  import complete!" }
        log.info { "Running post import schema commands on deg..." }
        executeSqlResource(dataSource,"schemas/deg-post.sql")
        log.info { "deg creation done!" }
    }
}

interface DegSource {
    fun import(sink: DegSink)
}
private const val DEG_TABLE_DEF = "deg(gene,base_mean,log2_fc,lfc_se,stat,pvalue,padj,disease,celltype)"

class DegSink(dataSource: DataSource): Closeable {

    private val degOut = CopyValueWriter(dataSource, DEG_TABLE_DEF)

    fun write(gene: String,base_mean: String,log2_fc: String,lfc_se: String,stat: String,pvalue: String,padj: String,disease: String,celltype: String) =
            degOut.write(gene,base_mean,log2_fc,lfc_se,stat,pvalue,padj,disease,celltype)

    override fun close() {
       degOut.close()
    }
}