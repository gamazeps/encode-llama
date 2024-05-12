package import

import Importer
import mu.KotlinLogging
import util.*
import java.io.*
import source.*
import javax.sql.DataSource
import java.time.Instant

private val log = KotlinLogging.logger {}
private fun tableDef(assembly: String, assays: List<String>)
    = """
        ${assembly}_biosamples(
            biosample_name,
            ${assays.map { it + "_experiment,\n" + it + "_file" }.joinToString(",\n") }
        )
    """

private fun experimentTableDef(assembly: String)
    = """
        ${assembly}_experiments(
            accession,
            ontology,
            sample_type,
            life_stage
        )
    """

class BiosampleImporter(private val sources: List<BiosampleSource>): Importer {

    override fun import(dataSource: DataSource) {
        
        val groupedSources = sources.groupBy { it.assembly }
        val assemblies = groupedSources.map { it.key }
        assemblies.forEach {
            val assays = groupedSources[it]!!.map { it.assay }.sorted()
            val assayIDs = assays.mapIndexed { i, _ -> i }.associateBy { assays[it] }
            val rdhsIDs = mutableMapOf<String, Int>()
            executeSqlResource(dataSource, "schemas/biosamples.sql", mapOf(
                "\$ASSEMBLY" to it,
                "\$ASSAY_EXPERIMENTS" to assays.joinToString(",\n") { it + "_experiment TEXT" },
                "\$ASSAY_FILES" to assays.joinToString(",\n") { it + "_file TEXT" }
            ))
            executeQuery(dataSource, "SELECT * FROM ${it}_rdhss") { result ->
                while (result.next()) {
                    rdhsIDs.put(result.getString("accession"), rdhsIDs.size)
                }
            }
            ExperimentSink(dataSource, it).use { esink ->
                BiosampleSink(dataSource, it, assays).use { sink ->
                    groupedSources[it]!!.forEach { it.import(sink, esink) }
                }
            }
            executeSqlResource(dataSource, "schemas/biosamples-post.sql", mapOf("\$ASSEMBLY" to it))
        }

    }
}

class BiosampleSink(dataSource: DataSource, assembly: String, private val assays: List<String>): Closeable {

    private val writer = CopyValueWriter(dataSource, tableDef(assembly, assays))
    val valueMap = mutableMapOf<String, MutableMap<String, Pair<String, String>>>()
    val assayMap = mutableMapOf<String, String>()

    fun write(experiment: String, file_accession: String, biosample_name: String, assay: String) {
        if (!valueMap.containsKey(biosample_name)) valueMap.set(biosample_name, mutableMapOf())
        valueMap[biosample_name]!!.set(assay, Pair(experiment, file_accession))
        assayMap.set(experiment, assay)
    }

    override fun close() {
        valueMap.forEach { k, v ->
            writer.write(k, *assays.flatMap {
                listOf(v.get(it)?.first, v.get(it)?.second)
            }.toTypedArray())
        }
        writer.close()
    }

}

class ExperimentSink(dataSource: DataSource, assembly: String): Closeable {

    private val writer = CopyValueWriter(dataSource, experimentTableDef(assembly))

    fun write(accession: String, ontology: String, sampleType: String, lifeStage: String) {
        writer.write(accession, ontology, sampleType, lifeStage)
    }

    override fun close()  {
        writer.close()
    }

}
