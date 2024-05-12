package source

import import.*
import mu.KotlinLogging
import java.io.*
import java.util.zip.GZIPInputStream

private val log = KotlinLogging.logger {}

class FileSnpsSource(private val files: List<File>, override val assembly: String): SnpsSource {
    override fun import(sink: SnpsSink) {
        log.info { "Beginning SNP File Import" }
        for(file in files) {
            log.info { "Importing SNPs from file $file" }
            val reader = BufferedReader(InputStreamReader(GZIPInputStream(FileInputStream(file))))
            reader.readLine() // Skip first line
            reader.forEachLine { line ->
                val lineValues = line.split("\t")
                sink.write(lineValues[0], lineValues[1], lineValues[2], lineValues[3])
            }

        }

    }
}