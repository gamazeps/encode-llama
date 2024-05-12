package import

import Importer
import util.*
import mu.KotlinLogging
import java.io.Closeable
import javax.sql.DataSource

private val log = KotlinLogging.logger {}

class SingleCellDiseaseBoxPlotImporter(private val sources: List<SingleCellDiseaseBoxPlotSource>) : Importer {

    override fun import(dataSource: DataSource) {
        log.info { "Running single cell disease box plot schema..." }
        executeSqlResource(dataSource, "schemas/singlecelldiseaseboxplot.sql")
        SingleCellDiseaseBoxPlotSink(dataSource).use {sink ->
            for (source in sources) {
                source.import(sink)
            }
        }
        log.info { "Single cell disease box plot  import complete!" }
        log.info { "Running post import schema commands on single cell disease box plot..." }
        executeSqlResource(dataSource,"schemas/singlecelldiseaseboxplot_post.sql")
        log.info { "Single cell disease box plot index creation done!" }
    }
}

interface SingleCellDiseaseBoxPlotSource {
    fun import(sink: SingleCellDiseaseBoxPlotSink)
}
private const val SINGLECELL_DISEASE_BOXPLOT_TABLE_DEF = "singlecelldiseaseboxplot(disease,gene,celltype,min,firstquartile,median,thirdquartile, max,expr_frac,mean_count)"

class SingleCellDiseaseBoxPlotSink(dataSource: DataSource): Closeable {

    private val singleCellDiseaseBoxPlotOut = CopyValueWriter(dataSource, SINGLECELL_DISEASE_BOXPLOT_TABLE_DEF)

    fun write(disease: String, gene: String, celltype: String, min: String, firstquartile: String, median: String, thirdquartile: String,max: String, expr_frac: String, mean_count: String) =
            singleCellDiseaseBoxPlotOut.write(disease,gene,celltype,min,firstquartile,median,thirdquartile, max,expr_frac,mean_count)

    override fun close() {
        singleCellDiseaseBoxPlotOut.close()
    }
}