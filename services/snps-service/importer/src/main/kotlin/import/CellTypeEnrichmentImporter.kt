package import

import Importer
import util.*
import java.io.*
import javax.sql.DataSource

private const val FDR_CTE_TABLE_DEF = "cellTypeEnrichment_fdr(encodeId, PM_ID, name, refName, FDR)"
private const val FE_CTE_TABLE_DEF = "cellTypeEnrichment_fe(encodeId, PM_ID, name, refName, FE)"
private const val P_VALUE_CTE_TABLE_DEF = "cellTypeEnrichment_pValue(encodeId, PM_ID, name, refName, pValue)"
private val VAL_TYPE_TO_TABLE_DEF = mapOf(
    "fdr" to FDR_CTE_TABLE_DEF,
    "fe" to FE_CTE_TABLE_DEF,
    "pValue" to P_VALUE_CTE_TABLE_DEF
)

class CellTypeEnrichmentImporter(private val sources: List<CellTypeEnrichmentSource>,
                                 private val valType: String,
                                 private val isFirst: Boolean): Importer {

    override fun import(dataSource: DataSource) {

        val assemblies = (sources.groupBy { it.assembly })

        assemblies.forEach { (assembly, sources) ->

            val replacements = mapOf("\$ASSEMBLY" to assembly, "\$VAL_TYPE" to valType)
            executeSqlResource(dataSource, "schemas/cellTypeEnrichment.sql", replacements)
            CellTypeEnrichmentSink(dataSource, valType, assembly).use { sink ->
                sources.forEach {
                    it.import(sink)
                }
            }

            // the first iteration creates the distinct studies list and populates one value field
            // the subsequent iterations update the relevant value fields in the existing study table
            if (isFirst)
                executeSqlResourceParallel("cell type enrichment $valType post-import update", dataSource,
                        "schemas/cellTypeEnrichment_post_first.sql", 1, replacements)
            else
                executeSqlResourceParallel("cell type enrichment $valType post-import update", dataSource,
                        "schemas/cellTypeEnrichment_post_second.sql", 1, replacements)

        }

    }
}

interface CellTypeEnrichmentSource {
    val assembly: String
    fun import(sink: CellTypeEnrichmentSink)
}

class CellTypeEnrichmentSink(dataSource: DataSource, valType: String, assembly: String) : Closeable {

    private val tbl = checkNotNull(VAL_TYPE_TO_TABLE_DEF[valType]) { "Invalid cell type enrichment value $valType" }
    private val writer = CopyValueWriter(dataSource, assembly + "_" + tbl)

    fun write(line: String, headerValues: List<String>) {
        val lineValues = line.split("\t")
        for (i in 2 until headerValues.size) {
            val value: String? = if (lineValues[i] == "") null else lineValues[i]
            val hv = headerValues[i].split("-")
            var pmId = hv[1]
            var name = hv[2]
            if (hv.size > 3) {
                for(j in 3 until hv.size) {
                    name = name + "-" + hv[j]
                }
            }
            if (pmId.toIntOrNull() == null) {
                pmId = hv[2]
                name = hv[3]
                if (hv.size > 4) {
                    for(j in 4 until hv.size) {
                        name = name + "-" + hv[j]
                    }
                }
            }
            writer.write(lineValues[0], pmId, name.replace("_"," "), headerValues[i], value)
        }
    }

    override fun close()  {
        writer.close()
    }

}
