package source

import import.*
import mu.KotlinLogging
import java.io.*
import java.util.zip.GZIPInputStream
import model.*
import util.*

private val log = KotlinLogging.logger {}
fun fileNamePrefix(fileName: String) = fileName.split('.').first()

class GSSnpAssociationsSource(private val gsParentPath: GSDirectory) : SnpAssociationsSource {
    override fun import(sink: SnpAssociationsSink) {
        log.info { "Beginning Snp Associations GS File Import" }
        val allFiles = gsList(gsParentPath.bucket, gsParentPath.dirPath).filter {  !it.isDirectory && it.name.endsWith("sumstats.gz") }
        log.info { "allFiles size: ${allFiles.size}" }
        for (f in allFiles) {
            log.info { "Importing Snp Associations from file $f" }
            log.info { "file name is: ${f.name}" }
            val fileName = fileNamePrefix(f.name.split("/").last())
            log.info { "fileName is: $fileName" }
            val ip = GZIPInputStream(f.getContent().inputStream())
            val reader =  ip.bufferedReader() //BufferedReader(InputStreamReader(GZIPInputStream(FileInputStream(file))))

            val columns = reader.readLine() // Skip first line of column header
            log.info { "columns are: $columns" }
            val colHeaders = columns.split("\t")

            reader.forEachLine { line ->
                log.info { "line is: $line" }
                val lineValues = line.split("\t")
                var CHISQ: String?
                var N: String?
                var Z: String?
                if(lineValues.size>1)
                {
                    if(lineValues.size<6){
                        CHISQ = null
                        Z = lineValues[3]
                        N = lineValues[4]
                    } else {
                        CHISQ= lineValues[4]
                        Z = lineValues[5]
                        N=  lineValues[3]
                    }
                    sink.write(fileName.split("PASS_")[1],lineValues[0],lineValues[1],lineValues[2],N,Z,CHISQ)
                } else {
                    log.info { "lineValues are: $lineValues" }
                }

            }
        }

     }
}

class SnpAssociationsFileSource(private val files: List<File>) : SnpAssociationsSource {
    override fun import(sink: SnpAssociationsSink) {
        log.info { "Beginning Snp Associations File Import" }
        for (file in files) {
            log.info { "Importing Snp Associations from file $file" }
            val fileName = fileNamePrefix(file.getName())
            log.info { "file name is: $fileName" }
            val reader = BufferedReader(InputStreamReader(GZIPInputStream(FileInputStream(file))))

            val columns = reader.readLine() // Skip first line of column header
            val colHeaders = columns.split("\t")

            reader.forEachLine { line ->
                val lineValues = line.split("\t")
                var CHISQ: String?
                var N: String?
                var Z: String?
                if(lineValues.size>1)
                {
                    if(lineValues.size<6){
                        CHISQ = null
                        Z = lineValues[3]
                        N = lineValues[4]
                    } else {
                        CHISQ= lineValues[4]
                        Z = lineValues[5]
                        N=  lineValues[3]
                    }
                    sink.write(fileName.split("PASS_")[1],lineValues[0],lineValues[1],lineValues[2],N,Z,CHISQ)
                } else {
                    log.info { "lineValues are: $lineValues" }
                }
            }
        }
    }
}
