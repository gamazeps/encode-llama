package import

import Importer
import util.*
import mu.KotlinLogging
import java.io.Closeable
import javax.sql.DataSource

private val log = KotlinLogging.logger {}

class PsychEncodePctExpByScImporter(private val sources: List<PsychEncodePctExpByScSource>) : Importer {

    override fun import(dataSource: DataSource) {
        log.info { "Running Single cell pct exp by celltype schema..." }
        executeSqlResource(dataSource, "schemas/psychencode_pctexp_bysubclass.sql")
        PsychEncodePctExpByScSink(dataSource).use {sink ->
            for (source in sources) {
                source.import(sink)
            }
        }
        log.info { "Single Single cell pct exp by sc  import complete!" }
        log.info { "Running post import schema commands on Single cell pct exp by sub class..." }
        executeSqlResource(dataSource,"schemas/psychencode_pctexp_bysubclass_post.sql")
        log.info { "Single cell pct exp by class creation done!" }
    }
}

interface PsychEncodePctExpByScSource {
    fun import(sink: PsychEncodePctExpByScSink)
}
private const val PSYCHENCODE_AVGEXP_BySc_TABLE_DEF = "pctexp_bysubclass(dataset,featurekey,celltype,pctexp)"

class PsychEncodePctExpByScSink(dataSource: DataSource): Closeable {

    private val psychencodePctExpByScOut = CopyValueWriter(dataSource, PSYCHENCODE_AVGEXP_BySc_TABLE_DEF)

    fun write(dataset: String, featurekey: String, celltype: String, pctexp: String) =
        psychencodePctExpByScOut.write(dataset, featurekey, celltype, pctexp)

    override fun close() {
        psychencodePctExpByScOut.close()
    }
}