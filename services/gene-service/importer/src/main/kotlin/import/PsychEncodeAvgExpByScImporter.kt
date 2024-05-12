package import

import Importer
import util.*
import mu.KotlinLogging
import java.io.Closeable
import javax.sql.DataSource

private val log = KotlinLogging.logger {}

class PsychEncodeAvgExpByScImporter(private val sources: List<PsychEncodeAvgExpByScSource>) : Importer {

    override fun import(dataSource: DataSource) {
        log.info { "Running Single cell avg exp by celltype schema..." }
        executeSqlResource(dataSource, "schemas/psychencode_avgexp_bysubclass.sql")
        PsychEncodeAvgExpByScSink(dataSource).use {sink ->
            for (source in sources) {
                source.import(sink)
            }
        }
        log.info { "Single Single cell avg exp by sc  import complete!" }
        log.info { "Running post import schema commands on Single cell avg exp by sub class..." }
        executeSqlResource(dataSource,"schemas/psychencode_avgexp_bysubclass_post.sql")
        log.info { "Single cell avg exp by class creation done!" }
    }
}

interface PsychEncodeAvgExpByScSource {
    fun import(sink: PsychEncodeAvgExpByScSink)
}
private const val PSYCHENCODE_AVGEXP_BySc_TABLE_DEF = "avgexp_bysubclass(dataset,featurekey,celltype,avgexp)"

class PsychEncodeAvgExpByScSink(dataSource: DataSource): Closeable {

    private val psychencodeAvgExpByScOut = CopyValueWriter(dataSource, PSYCHENCODE_AVGEXP_BySc_TABLE_DEF)

    fun write(dataset: String, featurekey: String, celltype: String, avgexp: String) =
        psychencodeAvgExpByScOut.write(dataset, featurekey, celltype, avgexp)

    override fun close() {
        psychencodeAvgExpByScOut.close()
    }
}