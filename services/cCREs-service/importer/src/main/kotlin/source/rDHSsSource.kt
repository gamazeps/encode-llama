package source

import import.*
import mu.KotlinLogging
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.*
import java.util.zip.GZIPInputStream

private val log = KotlinLogging.logger {}
private val http by lazy { OkHttpClient() }

abstract class rDHSSource(val assembly: String) {

    abstract fun import(sink: rDHSSink)

    protected fun import(sink: rDHSSink, reader: BufferedReader) {
        reader.forEachLine { line ->
            val lv = line.split("\t")
            if (lv.size < 4) return@forEachLine
            sink.write(lv[3], lv[0], lv[1], lv[2])
        }
    }

}

class rDHSHTTPSource(private val rDHSUrl: String, assembly: String): rDHSSource(assembly) {
    override fun import(sink: rDHSSink) {
        log.info { "Beginning rDHS import from $rDHSUrl" }
        val fileDownloadRequest = Request.Builder().url(rDHSUrl).get().build()
        val downloadInputStream = http.newCall(fileDownloadRequest).execute().body()!!.byteStream()
        val stream = if (rDHSUrl.endsWith(".gz")) GZIPInputStream(downloadInputStream) else downloadInputStream
        stream.bufferedReader().use { this.import(sink, it) }
    }
}

class rDHSFileSource(private val rDHSFile: File, assembly: String): rDHSSource(assembly) {
    override fun import(sink: rDHSSink) {
        log.info { "Beginning rDHS import from $rDHSFile" }
        val stream = if (rDHSFile.path.endsWith(".gz")) GZIPInputStream(FileInputStream(rDHSFile)) else FileInputStream(rDHSFile)
        this.import(sink, BufferedReader(InputStreamReader(stream)))
    }
}
