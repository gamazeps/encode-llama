package source

import import.*
import mu.KotlinLogging
import java.io.*
import java.util.zip.GZIPInputStream
import model.*
import util.*

private val log = KotlinLogging.logger {}

class GSGwasIntersectingSnpsWithBcreSource(private val gsParentPath: GSDirectory) : GwasIntersectingSnpsWithBcreSource {
    override fun import(sink: GwasIntersectingSnpsWithBcreSink) {
        log.info { "Beginning gwas Intersecting Snps GS File Import" }
        val allFiles = gsList(gsParentPath.bucket, gsParentPath.dirPath).filter {  !it.isDirectory && it.name.endsWith("_gwassnp_bcre.bed") }
        log.info { "allFiles size: ${allFiles.size}" }
        for (f in allFiles) {
            log.info { "Importing gwas Intersecting Snps With bcre from file $f" }
            log.info { "file name is: ${f.name}" }
            val fileName =  f.name.split("/").last().split('.').first() 
            log.info { "fileName is: $fileName" }
            val ip = f.getContent().inputStream()
            val reader =  ip.bufferedReader()   
            reader.forEachLine { line ->
                val lineValues = line.split("\t")               
                var pvalList =  mutableListOf<Double>()
                try 
                {
                    if(lineValues.size>0)
                    {
                        log.info { "line is: $line" }
                        var pvals = lineValues[5].split(",")
                        for (p in pvals) {
                            pvalList.add(p.toDouble())
                        }
                        if(lineValues[3].split("-").size<2)
                        {
                            log.info { "line is: $line" }
                        }
                        //disease: String, snpid: String, chrom: String, start: Int, stop: Int, riskallele: String, associated_gene: String, association_p_val: List<Double>, CRE_chr   cCRE_start   cCRE_end   rDHS_id   cCRE_id   cCRE_class
                        sink.write(
                            fileName.split("_")[0],
                            lineValues[3].split("-")[0],
                            lineValues[0],
                            lineValues[1].toInt(),
                            lineValues[2].toInt(),
                            lineValues[3].split("-")[1],
                            lineValues[4],
                            pvalList,
                            lineValues[6],
                            lineValues[7].toInt(),
                            lineValues[8].toInt(),
                            lineValues[9],
                            lineValues[10],
                            lineValues[11],
                            fileName.split("_")[1]
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

class GwasIntersectingSnpsWithBcreFileSource(private val files: List<File>) : GwasIntersectingSnpsWithBcreSource {
    override fun import(sink: GwasIntersectingSnpsWithBcreSink) {
        log.info { "Beginning gwas Intersecting Snps With Bcre File Import" }
        for (file in files) {
            log.info { "Importing gwas Intersecting Snps With bcre  from file $file" }
            val fileName = file.getName().split('.').first() 
            log.info { "file name is: $fileName" }
            val reader = BufferedReader(InputStreamReader(FileInputStream(file)))
            val disease = fileName.split("_")[0]
            val group = fileName.split("_")[1]
            log.info {"group is $group"}
            log.info { " disease is: $disease" }
            reader.forEachLine { line ->
                val lineValues = line.split("\t")               
                var pvalList =  mutableListOf<Double>()
                
               
                if(lineValues.size>0)
                {
                    var pvals =lineValues[5].split(",")
                    for (p in pvals) {
                        pvalList.add(p.toDouble())
                    }
                    if(lineValues[3].split("-").size<2)
                    {
                         log.info { "line is: $line" }
                    }
                    sink.write(
                        disease,
                        lineValues[3].split("-")[0],
                        lineValues[0],
                        lineValues[1].toInt(),
                        lineValues[2].toInt(),
                        lineValues[3].split("-")[1],
                        lineValues[4],
                        pvalList,
                        lineValues[6],
                        lineValues[7].toInt(),
                        lineValues[8].toInt(),
                        lineValues[9],
                        lineValues[10],
                        lineValues[11],
                        group
                    )
                } else {
                    log.info { "lineValues are: $lineValues" }
                }

            }
        }
    }
}
