package source

import import.*
import mu.KotlinLogging
import java.io.*
import java.util.zip.GZIPInputStream

private val log = KotlinLogging.logger {}

class PsychEncodeQTLFileSource(private val files: List<File>) : PsychEncodeQTLSource {
    override fun import(sink: PsychEncodeQTLSink) {
        log.info { "Beginning QTL File Import" }
        for (file in files) {
            log.info { "Importing QTLs from file $file" }
            val reader = BufferedReader(InputStreamReader(GZIPInputStream(FileInputStream(file))))
            reader.readLine() // Skip first line
            reader.forEachLine { line ->
                val lineValues = line.split("\t")
                    sink.write(lineValues[0], lineValues[1], lineValues[2].toInt(), lineValues[3].toInt(), lineValues[4], lineValues[5], lineValues[6].toInt(),
	                       lineValues[7].toInt(), lineValues[8].toFloat(), lineValues[9].toFloat(), lineValues[10].toInt(), lineValues[11].toFloat())
            }
        }
    }
}
