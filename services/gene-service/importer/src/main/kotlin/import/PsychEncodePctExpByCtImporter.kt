package import

import Importer
import util.*
import mu.KotlinLogging
import java.io.Closeable
import javax.sql.DataSource

private val log = KotlinLogging.logger {}

class PsychEncodePctExpByCtImporter(private val sources: List<PsychEncodePctExpByCtSource>) : Importer {

    override fun import(dataSource: DataSource) {
        log.info { "Running Single cell Pct exp by celltype schema..." }
        executeSqlResource(dataSource, "schemas/psychencode_pctexp_bycelltype.sql")
       PsychEncodePctExpByCtSink(dataSource).use {sink ->
            for (source in sources) {
                source.import(sink)
            }
        }
        log.info { "Single Single cell Pct exp by ct  import complete!" }
        log.info { "Running post import schema commands on Single cell Pct exp by celltype..." }
        executeSqlResource(dataSource,"schemas/psychencode_pctexp_bycelltype_post.sql")
        log.info { "Single cell Pct exp by celltype creation done!" }
    }
}

interface PsychEncodePctExpByCtSource {
    fun import(sink: PsychEncodePctExpByCtSink)
}
private const val PSYCHENCODE_PctEXP_BYCT_TABLE_DEF = "pctexp_bycelltype(dataset,featurekey,celltype,pctexp)"

class PsychEncodePctExpByCtSink(dataSource: DataSource): Closeable {

    private val psychencodePctExpByCtOut = CopyValueWriter(dataSource, PSYCHENCODE_PctEXP_BYCT_TABLE_DEF)

    fun write(dataset: String, featurekey: String, celltype: String, pctexp: String) =
            psychencodePctExpByCtOut.write(dataset, featurekey, celltype, pctexp)

    override fun close() {
        psychencodePctExpByCtOut.close()
    }
}