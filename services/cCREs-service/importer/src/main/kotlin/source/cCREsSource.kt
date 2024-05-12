package source

import import.*
import mu.KotlinLogging
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.*
import java.util.zip.GZIPInputStream

private val log = KotlinLogging.logger {}
private val http by lazy { OkHttpClient() }

abstract class cCRESource(val assembly: String) {

    abstract fun import(sink: cCRESink)

    protected fun import(sink: cCRESink, reader: BufferedReader) {
        reader.forEachLine { line ->
            val lv = line.split("\t")
            if (lv.size < 6) return@forEachLine
            val ctcf_bound: String = if (lv[5].contains("CTCF-bound", true)) "true" else "false"
            sink.write(lv[4], lv[3], lv[0], lv[1], lv[2], lv[5].split(",")[0], ctcf_bound)
        }
    }

}

class cCREHTTPSource(private val cCREUrl: String, assembly: String): cCRESource(assembly) {
    override fun import(sink: cCRESink) {
        log.info { "Beginning cCRE import from $cCREUrl" }
        val fileDownloadRequest = Request.Builder().url(cCREUrl).get().build()
        val downloadInputStream = http.newCall(fileDownloadRequest).execute().body()!!.byteStream()
        val stream = if (cCREUrl.endsWith(".gz")) GZIPInputStream(downloadInputStream) else downloadInputStream
        stream.bufferedReader().use { this.import(sink, it) }
    }
}

class cCREFileSource(private val cCREFile: File, assembly: String): cCRESource(assembly) {
    override fun import(sink: cCRESink) {
        log.info { "Beginning cCRE import from $cCREFile" }
        val stream = if (cCREFile.path.endsWith(".gz")) GZIPInputStream(FileInputStream(cCREFile)) else FileInputStream(cCREFile)
        this.import(sink, BufferedReader(InputStreamReader(stream)))
    }
}
