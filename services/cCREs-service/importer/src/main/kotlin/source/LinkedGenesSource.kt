package source

import import.*
import model.*
import mu.KotlinLogging
import util.*
import java.io.File

import java.io.*
import java.util.zip.GZIPInputStream


private val log = KotlinLogging.logger {}
fun linkedgenesfileNamePrefix(fileName: String) = fileName.split('.').first()


class LinkedGenesFileSource(private val files: List<File>) : LinkedGenesSource {
    override fun import(sink: LinkedGenesSink) {
        log.info { "Beginning LinkedGenes File Import" }
        for (file in files) {
            log.info { "Importing LinkedGenes from file $file" }
            val fileName = linkedgenesfileNamePrefix(file.getName())
            log.info { "file name is: $fileName" }
         
            val reader = BufferedReader(InputStreamReader(FileInputStream(file)))
            //GZIPInputStream(FileInputStream(file)).bufferedReader()
            

            reader.forEachLine { line ->
                
                val assembly = fileName.split("_")[0]
                val lineValues = line.split("\t")
               val d = lineValues[0]
                //accession,gene,assembly,assay, experiment_accession,celltype
                //EH38D0076589    ENSG00000225446.3       CTCF-ChIAPET    ENCSR185PEE     Caco-2
                log.info { "test here $d" }
                sink.linkedgenesFile(lineValues[0],lineValues[1],assembly,lineValues[2],lineValues[3],lineValues[4])
                
            }
        }
    }
}

class GSLinkedGenesSource(private val gsParentPath: GSDirectory) : LinkedGenesSource {
    override fun import(sink: LinkedGenesSink) {
        log.info { "Beginning LinkedGenes GS File Import" }
        val allFiles = gsList(gsParentPath.bucket, gsParentPath.dirPath).filter {  !it.isDirectory && it.name.endsWith(".txt") }
        log.info { "allFiles size: ${allFiles.size}" }
        for (f in allFiles) {
            log.info { "Importing LinkedGenes from file $f" }
            log.info { "file name is: ${f.name}" }
            val fileName = linkedgenesfileNamePrefix(f.name.split("/").last())
            log.info { "fileName is: $fileName" }
            val assembly = fileName.split("_")[0]
            
            val ip = f.getContent().inputStream()
            val reader =  ip.bufferedReader() 

            reader.forEachLine { line ->
                val lineValues = line.split("\t")
                sink.linkedgenesFile(lineValues[0],lineValues[1],assembly,lineValues[2],lineValues[3],lineValues[4])


            }
        }

    }
}
