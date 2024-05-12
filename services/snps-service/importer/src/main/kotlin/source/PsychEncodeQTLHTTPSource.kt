package source

import import.*
import mu.KotlinLogging
import okhttp3.OkHttpClient
import okhttp3.Request
import util.runParallel
import java.io.BufferedReader
import java.io.InputStreamReader
import java.util.zip.GZIPInputStream

private val log = KotlinLogging.logger {}
private val http by lazy { OkHttpClient() }

class PsychEncodeQTLHTTPSource(private val fileUrls: List<String>, private val fileParallelism: Int): PsychEncodeQTLSource {
	
    override fun import(sink: PsychEncodeQTLSink) {
        log.info { "Beginning QTLs import over HTTP" }
        runParallel("QTLs", fileUrls, fileParallelism) { fileUrl ->
            log.info { "Reading  $fileUrl" }
            val fileDownloadRequest = Request.Builder().url(fileUrl).get().build()
            val downloadInputStream = http.newCall(fileDownloadRequest).execute().body()!!.byteStream()
            val reader = BufferedReader(InputStreamReader(GZIPInputStream(downloadInputStream)))
            reader.readLine() // Skip first line
            reader.forEachLine { line ->
                val lineValues = line.split("\t")
                sink.write(lineValues[0], lineValues[1], lineValues[2].toInt(), lineValues[3].toInt(), lineValues[4], lineValues[5], lineValues[6].toInt(),
                           lineValues[7].toInt(), lineValues[8].toFloat(), lineValues[9].toFloat(), lineValues[10].toInt(), lineValues[11].toFloat())
            }
        }
    }
}
