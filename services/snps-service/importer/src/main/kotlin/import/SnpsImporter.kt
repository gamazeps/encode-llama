package import

import Importer
import util.*
import java.io.*
import javax.sql.DataSource

val chromosomes = mapOf(
    "hg38" to listOf(
        "chr1", "chr2", "chr3", "chr4", "chr5", "chr6", "chr7" ,"chr8", "chr9", "chr10", "chr11", "chr12", "chr13",
        "chr14", "chr15", "chr16", "chr17", "chr18", "chr19", "chr20", "chr21", "chr22", "chrX", "chrY"
    ),
    "hg19" to listOf(
        "chr1", "chr2", "chr3", "chr4", "chr5", "chr6", "chr7" ,"chr8", "chr9", "chr10", "chr11", "chr12", "chr13",
        "chr14", "chr15", "chr16", "chr17", "chr18", "chr19", "chr20", "chr21", "chr22", "chrX", "chrY"
    ),
    "mm10" to listOf(
        "chr1", "chr2", "chr3", "chr4", "chr5", "chr6", "chr7" ,"chr8", "chr9", "chr10", "chr11", "chr12", "chr13",
        "chr14", "chr15", "chr16", "chr17", "chr18", "chr19", "chrX", "chrY"
    )
)

private fun snpTableDef(assembly: String): String = "${assembly}_snp_coords(chrom, start, stop, snp)"

class SnpsImporter(private val sources: List<SnpsSource>, private val postProcessingPar: Int): Importer {

    override fun import(dataSource: DataSource) {

        val assemblies = (sources.groupBy { it.assembly })

        assemblies.forEach { (assembly, sources) ->

            val replacements = mapOf("\$ASSEMBLY" to assembly)
            executeSqlResource(dataSource, "schemas/snp_coords.sql", replacements)
            SnpsSink(dataSource, assembly).use { sink ->
                sources.forEach {
                    it.import(sink)
                }
            }

            executeSqlResourceParallel("$assembly SNPs post-import update", dataSource,
                    "schemas/snps-post.sql", 1, replacements)
            executeSqlResourceParallel("$assembly SNPs post-import-index update", dataSource,
                    "schemas/snps-post-index.sql", postProcessingPar, replacements)

            for (chromosome in chromosomes[assembly] ?: listOf()) {
                executeSqlResourceParallel(
                    "SNPs post-import update", dataSource,
                    "schemas/snps-post-chromosome.sql", postProcessingPar,
                    mapOf("\$ASSEMBLY" to assembly, "\$CHROM" to chromosome)
                )
            }

        }

    }
}

interface SnpsSource {
    val assembly: String
    fun import(sink: SnpsSink)
}

class SnpsSink(dataSource: DataSource, assembly: String) : Closeable {

    private val writer = CopyValueWriter(dataSource, snpTableDef(assembly))

    fun write(chrom: String, start: String, stop: String, snp: String) {
        writer.write(chrom, start, stop, snp)
    }

    override fun close()  {
        writer.close()
    }

}
