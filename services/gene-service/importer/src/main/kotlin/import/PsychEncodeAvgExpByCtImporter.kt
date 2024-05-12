package import

import Importer
import util.*
import mu.KotlinLogging
import java.io.Closeable
import javax.sql.DataSource

private val log = KotlinLogging.logger {}

class PsychEncodeAvgExpByCtImporter(private val sources: List<PsychEncodeAvgExpByCtSource>) : Importer {

    override fun import(dataSource: DataSource) {
        log.info { "Running Single cell avg exp by celltype schema..." }
        executeSqlResource(dataSource, "schemas/psychencode_avgexp_bycelltype.sql")
       PsychEncodeAvgExpByCtSink(dataSource).use {sink ->
            for (source in sources) {
                source.import(sink)
            }
        }
        log.info { "Single Single cell avg exp by ct  import complete!" }
        log.info { "Running post import schema commands on Single cell avg exp by celltype..." }
        executeSqlResource(dataSource,"schemas/psychencode_avgexp_bycelltype_post.sql")
        log.info { "Single cell avg exp by celltype creation done!" }
    }
}

interface PsychEncodeAvgExpByCtSource {
    fun import(sink: PsychEncodeAvgExpByCtSink)
}
private const val PSYCHENCODE_AVGEXP_BYCT_TABLE_DEF = "avgexp_bycelltype(dataset,featurekey,celltype,avgexp)"

class PsychEncodeAvgExpByCtSink(dataSource: DataSource): Closeable {

    private val psychencodeAvgExpByCtOut = CopyValueWriter(dataSource, PSYCHENCODE_AVGEXP_BYCT_TABLE_DEF)

    fun write(dataset: String, featurekey: String, celltype: String, avgexp: String) =
            psychencodeAvgExpByCtOut.write(dataset, featurekey, celltype, avgexp)

    override fun close() {
        psychencodeAvgExpByCtOut.close()
    }
}