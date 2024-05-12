package import

import Importer
import util.*
import java.io.*
import javax.sql.DataSource

private fun studyTableDef(assembly: String): String = "${assembly}_studies_temp(PM_ID, Author, Name, RefName)"

class StudyImporter(private val sources: List<StudySource>): Importer {

    override fun import(dataSource: DataSource) {

        val assemblies = (sources.groupBy { it.assembly })

        assemblies.forEach { (assembly, sources) ->
            val replacements = mapOf("\$ASSEMBLY" to assembly)
            executeSqlResource(dataSource, "schemas/study.sql", replacements)
            StudySink(dataSource, assembly).use { sink ->
                sources.forEach {
                    it.import(sink)
                }
            }
            executeSqlResourceParallel("studies post-import update", dataSource,
                    "schemas/studies-post.sql", 1, replacements)
        }

    }

}

interface StudySource {
    val assembly: String
    fun import(sink: StudySink)
}

class StudySink(dataSource: DataSource, private val assembly: String) : Closeable {

    private val writer = CopyValueWriter(dataSource, studyTableDef(assembly))

    fun write(line: String) {
        val lineValues = line.split("\t")
        var pid = lineValues[8]
        var author = lineValues[9]
        val hv = lineValues[10].split("-")
        var name = hv[2]
        val pmId = hv[1]
        if (hv.size > 3) {
            for(j in 3 until hv.size) {
                name = name + "-" + hv[j]
            }
        }
        if (pmId.toIntOrNull() == null) {
            name = hv[3]
            if(hv.size > 4) {
                for(j in 4 until hv.size) {
                    name = name + "-" + hv[j]
                }
            }
        }
        if (assembly == "hg19") {
            pid = lineValues[9]
            author = lineValues[8]
        }
        writer.write(pid, author, lineValues[7], lineValues[10])
    }

    override fun close()  {
        writer.close()
    }

}


