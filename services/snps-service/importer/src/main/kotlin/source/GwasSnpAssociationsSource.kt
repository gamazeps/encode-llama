package source

import import.*
import mu.KotlinLogging
import java.io.*
import java.util.zip.GZIPInputStream
import model.*
import util.*

private val log = KotlinLogging.logger {}
fun gwasfileNamePrefix(fileName: String) = fileName.split('.').first()

class GSGwasSnpAssociationsSource(private val gsParentPath: GSDirectory) : GwasSnpAssociationsSource {
    override fun import(sink: GwasSnpAssociationsSink) {
        log.info { "Beginning gwas Snp Associations GS File Import" }
        val allFiles = gsList(gsParentPath.bucket, gsParentPath.dirPath).filter {  !it.isDirectory && it.name.endsWith("_gwassnp.bed") }
        log.info { "allFiles size: ${allFiles.size}" }
        for (f in allFiles) {
            log.info { "Importing gwas Snp Associations from file $f" }
            log.info { "file name is: ${f.name}" }
            val fileName = gwasfileNamePrefix(f.name.split("/").last())
            log.info { "fileName is: $fileName" }
            val ip = f.getContent().inputStream()
            val reader =  ip.bufferedReader()   //BufferedReader(InputStreamReader(GZIPInputStream(FileInputStream(file))))
            reader.forEachLine { line ->
                val lineValues = line.split("\t")               
                var pvalList =  mutableListOf<Double>()
                try 
                {
                    if(lineValues.size>0)
                    {
                       // log.info { "line is: $line" }
                        var pvals =lineValues[6].split(",")
                        for (p in pvals) {
                            pvalList.add(p.toDouble())
                        }
                        if(lineValues[3].split("-").size<2)
                        {
                            log.info { "line is: $line" }
                        }
                        //disease: String, snpid: String, chrom: String, start: Int, stop: Int, riskallele: String, associated_gene: String, analyses_identifying_SNP: Int, association_p_val: List<Double>
                        sink.write(
                            fileName.split("_")[0],
                            lineValues[3].split("-")[0],
                            lineValues[0],
                            lineValues[1].toInt(),
                            lineValues[2].toInt(),
                            lineValues[3].split("-")[1],
                            lineValues[4],
                            lineValues[5].toInt(),
                            pvalList
                        )
                    } else {
                        log.info { "lineValues are: $lineValues" }
                    }
                } catch (e: Throwable) {
                      log.info { "exception is: $e" }
                }
                

            }
        }

     }
}

class GwasSnpAssociationsFileSource(private val files: List<File>) : GwasSnpAssociationsSource {
    override fun import(sink: GwasSnpAssociationsSink) {
        log.info { "Beginning Gwas Snp Associations File Import" }
        for (file in files) {
            log.info { "Importing Gwas Snp Associations from file $file" }
            val fileName = gwasfileNamePrefix(file.getName())
            log.info { "file name is: $fileName" }
            val reader = BufferedReader(InputStreamReader(FileInputStream(file)))

            reader.forEachLine { line ->
                val lineValues = line.split("\t")               
                var pvalList =  mutableListOf<Double>()
                if(lineValues.size>0)
                {
                    var pvals =lineValues[6].split(",")
                    for (p in pvals) {
                        pvalList.add(p.toDouble())
                    }
                    if(lineValues[3].split("-").size<2)
                    {
                         log.info { "line is: $line" }
                    }
                    sink.write(
                        fileName.split("_")[0],
                        lineValues[3].split("-")[0],
                        lineValues[0],
                        lineValues[1].toInt(),
                        lineValues[2].toInt(),
                        lineValues[3].split("-")[1],
                        lineValues[4],
                        lineValues[5].toInt(),
                        pvalList
                        )
                } else {
                    log.info { "lineValues are: $lineValues" }
                }

            }
        }
    }
}
