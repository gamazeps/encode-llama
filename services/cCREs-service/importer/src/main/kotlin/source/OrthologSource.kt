package source

import import.*
import model.*
import mu.KotlinLogging
import util.*
import java.io.File

import java.io.*
import java.util.zip.GZIPInputStream

private val log = KotlinLogging.logger {}
fun orthologFilePrefix(fileName: String) = fileName.split('.').first()

class OrthologFileSource(private val files: List<File>) : OrthologSource {
    override fun import(sink: OrthologSink) {
        log.info { "Beginning Ortholog File Import" }
        for (file in files) {
            log.info { "Importing Ortholog from file $file" }
            val fileName = orthologFilePrefix(file.getName())
            log.info { "file name is: $fileName" }
            
            val reader = BufferedReader(InputStreamReader(FileInputStream(file)))

            reader.forEachLine { line ->
                val lineValues = line.split("\t")
                sink.orthologFile(lineValues[0], lineValues[1])     // grch38, mm10
            }
        }
    }
}

class GSOrthologSource(private val gsParentPath: GSDirectory) : OrthologSource {
    override fun import(sink: OrthologSink) {
        log.info { "Beginning Ortholog GS File Import" }
        val allFiles = gsList(gsParentPath.bucket, gsParentPath.dirPath).filter {  
            !it.isDirectory && it.name.endsWith(".txt") } // need file type
        log.info { "allFiles size: ${allFiles.size}" }
        for (f in allFiles) {
            log.info { "Importing Ortholog from file $f" }
            log.info { "file name is: ${f.name}" }
            val fileName = orthologFilePrefix(f.name.split("/").last())
            log.info { "fileName is: $fileName" }
            
            val ip = f.getContent().inputStream()
            val reader =  ip.bufferedReader()

            reader.forEachLine { line ->
                val lineValues = line.split("\t")
                sink.orthologFile(lineValues[0], lineValues[1])     // grch38, mm10
            }
        }
    }
}
