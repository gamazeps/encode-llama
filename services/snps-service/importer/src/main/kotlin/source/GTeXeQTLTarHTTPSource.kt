package source

import import.*
import mu.KotlinLogging
import java.io.*
import okhttp3.OkHttpClient
import okhttp3.Request
import org.apache.commons.compress.archivers.tar.TarArchiveInputStream
import java.io.BufferedReader
import java.io.InputStreamReader
import java.util.zip.GZIPInputStream

private val log = KotlinLogging.logger {}
private val http by lazy { OkHttpClient() }

class GTeXeQTLTarHTTPSource(private val url: String) : GTeXeQTLSource() {
    override fun import(sink: GTeXeQTLSink) {
        log.info { "Importing GTeX eQTLs from $url" }
        val fileDownloadRequest = Request.Builder().url(url).get().build()
        val downloadInputStream = http.newCall(fileDownloadRequest).execute().body()!!.byteStream()
        super.import(sink, downloadInputStream)
    }
}
