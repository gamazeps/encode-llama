
package import

import Importer
import mu.KotlinLogging
import util.*
import util.executeSqlResource
import java.io.Closeable
import javax.sql.DataSource

private const val GWAS_SNPASSOCIATIONS_TABLE_DEF = "gwas_snp_associations(disease, snpid, chrom,start, stop, riskallele, associated_gene, analyses_identifying_snp, association_p_val)"
private val log = KotlinLogging.logger {}

class GwasSnpAssociationsImporter(private val sources: List<GwasSnpAssociationsSource>): Importer {

    override fun import(dataSource: DataSource) {
        executeSqlResource(dataSource, "schemas/gwas_snp_associations.sql")
        GwasSnpAssociationsSink(dataSource).use { sink ->
            for (source in sources) {
                source.import(sink)
            }
        }
        log.info { "Running post import schema commands on gwas snp associations..." }
        executeSqlResource(dataSource,"schemas/gwas_snp_associations_post.sql")
        log.info { "Gwas snp associations index creation done!" }
    }

}

interface GwasSnpAssociationsSource {
    fun import(sink: GwasSnpAssociationsSink)
}

class GwasSnpAssociationsSink(dataSource: DataSource) : Closeable {

    private val writer = CopyValueWriter(dataSource, GWAS_SNPASSOCIATIONS_TABLE_DEF)

    fun write(disease: String, snpid: String, chrom: String, start: Int, stop: Int,riskallele: String, associated_gene: String,  analyses_identifying_snp: Int, association_p_val: List<Double> ) {   
            writer.write(disease,snpid,chrom, start.toString(), stop.toString(), riskallele, associated_gene, analyses_identifying_snp.toString(), association_p_val.toDbString())
    }

    override fun close()  {
        writer.close()
    }

}
