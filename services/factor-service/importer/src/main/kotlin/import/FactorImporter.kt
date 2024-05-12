package import

import Importer
import mu.KotlinLogging
import util.*
import java.io.Closeable
import javax.sql.DataSource

private val log = KotlinLogging.logger {}

class FactorImporter(private val sources: List<FactorSource>): Importer {

    override fun import(dataSource: DataSource) {
        log.info { "Running factor schema..." }
        val allAssemblies: Map<String, List<FactorSource>> = sources
                .flatMap { source -> source.assemblies().map { it to source } }
                .groupBy({ it.first }, { it.second })
        for (assembly in allAssemblies.keys) {
            // Common replacements for sql template resources
            val replacements = mapOf("\$ASSEMBLY" to assembly)
            executeSqlResource(dataSource, "schemas/factor-desc.sql",replacements)
            FactorSink(dataSource,assembly).use { sink ->
                for (source in sources) {
                    source.import(assembly,sink)
                }
            }
            log.info { "Factor desc import complete!" }
        }
    }
}

interface FactorSource {
    fun assemblies(): Set<String>
    fun import(assembly: String,sink: FactorSink)
}

private fun factordescTableDef(assembly: String) =  "factor_descriptions_$assembly (\n" +
        "    gene_id ,\n" +
        "    chromosome,start,stop,\n" +
        "    name ,uniprot_data,ncbi_data,hgnc_data,ensemble_data,modifications,pdbids,factor_wiki, ensembl_id,\n" +
        "    dbd ,\n" +
        "    isTF ,\n" +
        "    color "+
        ")";

class FactorSink(dataSource: DataSource, assembly: String): Closeable {

    private val factorOut = CopyValueWriter(dataSource, factordescTableDef(assembly))

    fun factordesc(gene_id: String?,chromosome: String?, start: Int?, stop: Int?, name: String?,
                   uniprot_data: String?,
                   ncbi_data: String?,
                   hgnc_data: String?,
                   ensemble_data: String?,
                   modifications_data: String?,
                   pdbids:String?,
                   factor_wiki:String?,ensembl_id:String?,dbd :List<String>?, isTF: Boolean?,
                   color: String?
    ) =

            factorOut.write(gene_id, chromosome,start?.toString(),stop?.toString(),name,uniprot_data, ncbi_data,hgnc_data.toString(),ensemble_data.toString(),modifications_data.toString(),pdbids,factor_wiki,ensembl_id,dbd?.toDbString(), isTF.toString(),
    color)

    override fun close() {
        factorOut.close()
    }

}
