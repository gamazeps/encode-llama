package import

import Importer
import mu.KotlinLogging
import util.*
import util.executeSqlResource
import java.io.Closeable
import javax.sql.DataSource

private const val MAF_TABLE_DEF = "snps_maf(snp, refallele, altallele, af, eas_af, amr_af, afr_af, eur_af, sas_af, chrom, start)"
private val log = KotlinLogging.logger {}

class MafImporter(private val sources: List<MafSource>): Importer {

    override fun import(dataSource: DataSource) {
        executeSqlResource(dataSource, "schemas/snps_maf.sql")
        MafSink(dataSource).use { sink ->
            for (source in sources) {
                source.import(sink)
            }
        }
        log.info { "Running post import schema commands on snp mafs..." }
        executeSqlResource(dataSource,"schemas/snps_maf_post.sql")
        log.info { "snp maf index creation done!" }
    }
    
}

interface MafSource {
    fun import(sink: MafSink)
}

fun n(s: String): String? = if (s == "") null else s

class MafSink(dataSource: DataSource) : Closeable {

    private val writer = CopyValueWriter(dataSource, MAF_TABLE_DEF)

    fun write(it: String) {
        try {
            val lineValues = it.split("\t")
            val regionFrequency = lineValues[7].split(";")
            val altAllele = lineValues[4].split(",")
            val snpId = lineValues[2].split(";")
            val chrom = "chr"+lineValues[0].trim()
            val start = lineValues[1]
            var easAf: List<String> = listOf("")
            var eurAf: List<String> = listOf("")
            var sasAf: List<String> = listOf("")
            var afrAf: List<String> = listOf("")
            var amrAf: List<String> = listOf("")
            var af: List<String> = listOf("")
            for (rf in regionFrequency) {
                when {
                    rf.contains("eas_af", true) -> easAf = rf.split("=")[1].split(',')
                    rf.contains("afr_af", true) -> afrAf = rf.split("=")[1].split(',')
                    rf.contains("eur_af", true) -> eurAf = rf.split("=")[1].split(',')
                    rf.contains("sas_af", true) -> sasAf = rf.split("=")[1].split(',')
                    rf.contains("amr_af", true) -> amrAf = rf.split("=")[1].split(',')
                    rf.contains("af=", true) -> af = rf.split("=")[1].split(',')
                }
            }
            for (s in snpId.indices) {
                for (d in altAllele.indices) {
                   // if (snpId[s].trim() != ".") {
                        writer.write(
                            snpId[s], lineValues[3], altAllele[d], n(af[d]), n(easAf[d]), n(amrAf[d]),
                            n(afrAf[d]), n(eurAf[d]), n(sasAf[d]), chrom, start
                        )
               //     }
                }
            }
        } catch (e: Throwable) {

            log.info("maf error is: $e")
        }
    }

    override fun close()  {
        writer.close()
    }

}
