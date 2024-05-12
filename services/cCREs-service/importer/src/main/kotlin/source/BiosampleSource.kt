package source

import import.*
import mu.KotlinLogging
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.*
import java.util.zip.GZIPInputStream

private val log = KotlinLogging.logger {}
private val http by lazy { OkHttpClient() }

abstract class BiosampleSource(val assembly: String, val assay: String) {

    abstract fun import(sink: BiosampleSink, esink: ExperimentSink)

    protected fun import(sink: BiosampleSink, esink: ExperimentSink, reader: BufferedReader) {
        reader.forEachLine { line ->
            val lv = line.split("\t")
            if (lv.size < 5) return@forEachLine
            sink.write(lv[0], lv[1], lv[2], assay)
            esink.write(lv[0], if (lv.size >= 6) lv[5] else "unknown", lv[3], lv[4])
        }
    }

}

class BiosampleHTTPSource(private val url: String, assembly: String, assay: String): BiosampleSource(assembly, assay) {
    override fun import(sink: BiosampleSink, esink: ExperimentSink) {
        log.info { "Beginning biosample import from $url" }
        val fileDownloadRequest = Request.Builder().url(url).get().build()
        val downloadInputStream = http.newCall(fileDownloadRequest).execute().body()!!.byteStream()
        val stream = if (url.endsWith(".gz")) GZIPInputStream(downloadInputStream) else downloadInputStream
        stream.bufferedReader().use { this.import(sink, esink, it) }
    }
}

class BiosampleFileSource(private val file: File, assembly: String, assay: String): BiosampleSource(assembly, assay) {
    override fun import(sink: BiosampleSink, esink: ExperimentSink) {
        log.info { "Beginning biosample import from ${file.path}" }
        val stream = if (file.path.endsWith(".gz")) GZIPInputStream(FileInputStream(file)) else FileInputStream(file)
        this.import(sink, esink, BufferedReader(InputStreamReader(stream)))
    }
}
