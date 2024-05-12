
package import

import Importer
import mu.KotlinLogging
import util.*
import util.executeSqlResource
import java.io.Closeable
import javax.sql.DataSource


private const val GWAS_INTERSECTINGSNPWITHCCRE_TABLE_DEF = "gwas_intersectingsnp_withccres(disease, snpid, snp_chrom,snp_start, snp_stop, riskallele, associated_gene, association_p_val,ccre_chrom,ccre_start,ccre_stop,rdhsid,ccreid,ccre_class)"
private val log = KotlinLogging.logger {}

class GwasIntersectingSnpsWithCcreImporter(private val sources: List<GwasIntersectingSnpsWithCcreSource>): Importer {

    override fun import(dataSource: DataSource) {
        executeSqlResource(dataSource, "schemas/gwas_intersectingsnps_withccre.sql")
        GwasIntersectingSnpsWithCcreSink(dataSource).use { sink ->
            for (source in sources) {
                source.import(sink)
            }
        }
        log.info { "Running post import schema commands on gwas intersecting snp with ccres..." }
        executeSqlResource(dataSource,"schemas/gwas_intersectingsnps_withccre_post.sql")
        log.info { "Gwas gwas intersecting snp with ccres index creation done!" }
    }

}

interface GwasIntersectingSnpsWithCcreSource {
    fun import(sink: GwasIntersectingSnpsWithCcreSink)
}

class GwasIntersectingSnpsWithCcreSink(dataSource: DataSource) : Closeable {

    private val writer = CopyValueWriter(dataSource, GWAS_INTERSECTINGSNPWITHCCRE_TABLE_DEF)

    fun write(disease: String, snpid: String, snp_chrom: String, snp_start: Int, snp_stop: Int,riskallele: String, associated_gene: String,   association_p_val: List<Double>, ccre_chrom: String, ccre_start: Int, ccre_stop: Int, rdhsid: String, ccreid: String, ccre_class: String ) {   
            writer.write(disease,snpid,snp_chrom, snp_start.toString(), snp_stop.toString(), riskallele, associated_gene, association_p_val.toDbString(), ccre_chrom, ccre_start.toString(), ccre_stop.toString(), rdhsid, ccreid, ccre_class)
    }

    override fun close()  {
        writer.close()
    }

}
