package import

import Importer
import util.*
import java.io.*
import javax.sql.DataSource

private fun snpStudyTableDef(assembly: String): String = "${assembly}_snpStudies(snpId, leadId, PM_ID, Name, RefName)"

class SnpStudyImporter(private val sources: List<SnpStudySource>): Importer {

    override fun import(dataSource: DataSource) {

        val assemblies = (sources.groupBy { it.assembly })

        assemblies.forEach { (assembly, sources) ->
            val replacements = mapOf("\$ASSEMBLY" to assembly)
            executeSqlResource(dataSource, "schemas/snpstudies.sql", replacements)
            SnpStudySink(dataSource, assembly).use { sink ->
                sources.forEach {
                    it.import(sink)
                }
            }
            executeSqlResourceParallel("studies post-import update", dataSource,
                    "schemas/snpstudies-post.sql", 1, replacements)
        }

    }
}

interface SnpStudySource {
    val assembly: String
    fun import(sink: SnpStudySink)
}

class SnpStudySink(dataSource: DataSource, private val assembly: String) : Closeable {

    private val writer = CopyValueWriter(dataSource, snpStudyTableDef(assembly))

    fun write(line: String) {
        val lineValues = line.split("\t")
        var leadId = lineValues[4]
        var pmId = lineValues[8]
        if(leadId.contains("Lead",true))
            leadId = lineValues[3]
        if (assembly == "hg19")
            pmId = lineValues[9]
        writer.write(lineValues[3], leadId, pmId, lineValues[7], lineValues[10])
    }

    override fun close()  {
        writer.close()
    }

}


