package import

import Importer
import util.*
import javax.sql.DataSource

val chromosomeSizes = mapOf(
    "hg38" to mapOf(
        "chr1" to 248956422, "chr2" to 242193529, "chr3" to 198295559, "chr4" to 190214555, "chr5" to 181538259,
        "chr6" to 170805979, "chr7" to 159345973, "chr8" to 145138636, "chr9" to 138394717, "chr10" to 133797422,
        "chr11" to 135086622, "chr12" to 133275309, "chr13" to 114364328, "chr14" to 107043718, "chr15" to 101991189,
        "chr16" to 90338345, "chr17" to 83257441, "chr18" to 80373285, "chr19" to 58617616, "chr20" to 64444167,
        "chr21" to 46709983, "chr22" to 50818468, "chrX" to 156040895, "chrY" to 57227415
    ),
    "hg19" to mapOf(
        "chr1" to 249250621, "chr2" to 243199373, "chr3" to 198022430, "chr4" to 191154276, "chr5" to 180915260,
        "chr6" to 171115067, "chr7" to 159138663, "chr8" to 146364022, "chr9" to 141213431, "chr10" to 135534747,
        "chr11" to 135006516, "chr12" to 133851895, "chr13" to 115169878, "chr14" to 107349540, "chr15" to 102531392,
        "chr16" to 90354753, "chr17" to 81195210, "chr18" to 78077248, "chr19" to 59128983, "chr20" to 63025520,
        "chr21" to 48129895, "chr22" to 51304566, "chrX" to 155270560, "chrY" to 59373566
    )
)

class DensityImporter(private val snpSources: List<SnpsSource>, private val resolution: Int): Importer {

    override fun import(dataSource: DataSource) {

        val assemblies = (snpSources.groupBy { it.assembly })

        assemblies.forEach { (assembly, sources) ->

            val replacements = mapOf("\$ASSEMBLY" to assembly, "\$RESOLUTION" to resolution.toString())
            executeSqlResource(dataSource, "schemas/snp-density.sql", replacements)

            for (chromosome in chromosomeSizes[assembly] ?: mapOf()) {
                for (i in 0..chromosome.value step resolution) {
                    executeSql(dataSource, """
                        INSERT INTO ${assembly}_snp_density_${resolution} (chrom, start, stop, total_snps, common_snps)
                            SELECT '${chromosome.key}' AS chrom, $i AS start, ${i + resolution} AS stop,
                                   COUNT(*) AS total_snps, SUM(CASE WHEN af < 0.99 THEN 1 ELSE 0 END) AS common_snps
                              FROM ${assembly}_snp_coords_${chromosome.key}
                             WHERE start > $i AND start < ${i + resolution} AND stop > $i AND stop < ${i + resolution}
                    """.trimIndent())
                }
            }

            executeSqlResource(dataSource, "schemas/snp-density-index.sql", replacements)

        }
    }
}
