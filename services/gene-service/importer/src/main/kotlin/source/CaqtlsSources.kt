package source

import import.*
import mu.KotlinLogging
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.BufferedReader
import java.io.File
import java.io.InputStream
import java.io.InputStreamReader

private val http by lazy { OkHttpClient() }
private val log = KotlinLogging.logger {}

class CaqtlsHttpSource(private val url: String, private val type: String) : CaqtlsSource {
    override fun import(sink: CaqtlsSink) {
        log.info { "Beginning Ca qtls data Import" }
        val fileDownloadRequest = Request.Builder().url(url).get().build()
        val downloadInputStream = http.newCall(fileDownloadRequest).execute().body()!!.byteStream()
        importData(type, sink, downloadInputStream)
        log.info { "caqtls data complete" }
    }
}

private fun importData(type: String, sink: CaqtlsSink, inputStream: InputStream) {
    val reader = BufferedReader(InputStreamReader(inputStream))
    
    reader.forEachLine { line ->
        val lineVals = line.split("\t")
        try {             
        
            sink.write(lineVals[0],type)


        } catch (e: Exception) {
            log.error(e) { "Error occurred during ${type} ${line}" }
        }

    }

}