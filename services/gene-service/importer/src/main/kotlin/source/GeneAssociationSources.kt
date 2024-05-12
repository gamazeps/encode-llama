package source

import import.*
import model.*
import mu.KotlinLogging
import util.*
import java.io.File

import java.io.*
import java.util.zip.GZIPInputStream


private val log = KotlinLogging.logger {}
fun fileNamePrefix(fileName: String) = fileName.split('.').first()


class GeneAssociationFileSource(private val files: List<File>) : GeneAssociationSource {
    override fun import(sink: GeneAssociationSink) {
        log.info { "Beginning Genes Associations File Import" }
        for (file in files) {
            log.info { "Importing Genes Associations from file $file" }
            val fileName = fileNamePrefix(file.getName())
            log.info { "file name is: $fileName" }
         
            val reader = BufferedReader(InputStreamReader(FileInputStream(file)))

            reader.readLine() // Skip first line of column header
           //disease, gene_name, gene_id, twas_p, twas_bonferroni, hsq, dge_fdr, dge_log2fc
            reader.forEachLine { line ->
                log.info {"$line"}

                val lineValues = line.split("\t")
                sink.geneAssociationsFile(fileName.split(".")[0],lineValues[7],lineValues[1],lineValues[21],lineValues[22],lineValues[8],lineValues[27],lineValues[28])
                
            }
        }
    }
}

class GSGeneAssociationsSource(private val gsParentPath: GSDirectory) : GeneAssociationSource {
    override fun import(sink: GeneAssociationSink) {
        log.info { "Beginning Genes Associations GS File Import" }
        val allFiles = gsList(gsParentPath.bucket, gsParentPath.dirPath).filter {  !it.isDirectory && it.name.endsWith(".tsv") }
        log.info { "allFiles size: ${allFiles.size}" }
        for (f in allFiles) {
            log.info { "Importing Genes Associations from file $f" }
            log.info { "file name is: ${f.name}" }
            val fileName = fileNamePrefix(f.name.split("/").last())
            log.info { "fileName is: $fileName" }
            val ip = f.getContent().inputStream()
            val reader =  ip.bufferedReader() //BufferedReader(InputStreamReader(GZIPInputStream(FileInputStream(file))))

            val columns = reader.readLine() // Skip first line of column header
            log.info { "columns are: $columns" }


            reader.forEachLine { line ->
                val lineValues = line.split("\t")
                sink.geneAssociationsFile(fileName.split(".")[0],lineValues[7],lineValues[1],lineValues[21],lineValues[22],lineValues[8],lineValues[27],lineValues[28])


            }
        }

    }
}
