package import

import Importer
import util.*
import mu.KotlinLogging
import java.io.Closeable
import javax.sql.DataSource

private val log = KotlinLogging.logger {}

class GeneAssociationImporter(private val sources: List<GeneAssociationSource>) : Importer {

    override fun import(dataSource: DataSource) {
        log.info { "Running metadata schema..." }
        executeSqlResource(dataSource, "schemas/geneassociations.sql")
        GeneAssociationSink(dataSource).use {sink ->
            for (source in sources) {
                source.import(sink)
            }
        }
        log.info { "Genes Associations import complete!" }
        log.info { "Running post import schema commands on genes associations..." }
        executeSqlResource(dataSource,"schemas/geneassociations_post.sql")
        log.info { "genes associations index creation done!" }
    }
}

interface GeneAssociationSource {
    fun import(sink: GeneAssociationSink)
}

private const val GENE_ASSOCIATIONS_FILES_TABLE_DEF = "gene_associations(disease, gene_name, gene_id, twas_p, twas_bonferroni, hsq, dge_fdr, dge_log2fc)"

class GeneAssociationSink(dataSource: DataSource): Closeable {

    private val geneAssociationsFilesOut = CopyValueWriter(dataSource, GENE_ASSOCIATIONS_FILES_TABLE_DEF)

    fun geneAssociationsFile(disease: String, gene_name: String, gene_id: String, twas_p: String, twas_bonferroni: String, hsq: String,dge_fdr: String, dge_log2fc: String) =
            geneAssociationsFilesOut.write(disease,gene_name, gene_id, twas_p, twas_bonferroni, hsq, dge_fdr, dge_log2fc)

    override fun close() {
        geneAssociationsFilesOut.close()
    }
}