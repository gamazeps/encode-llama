package source

import import.*
import mu.KotlinLogging
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.zip.GZIPInputStream

private val log = KotlinLogging.logger {}
private val http by lazy { OkHttpClient() }

class BroadLdBlockSource(private val ldBlockUrls: List<String>, override val population: String): LdBlocksSource {
    override fun import(sink: LdBlocksSink) {
        for(url in ldBlockUrls) {
            log.info { "url is ${url}, population is: ${population}" }
            log.info { "Beginning LD block file import from Broad for $url" }
            val fileDownloadRequest = Request.Builder().url(url).get().build()
            val downloadInputStream = http.newCall(fileDownloadRequest).execute().body()!!.byteStream()
            sink.write(GZIPInputStream(downloadInputStream))
        }
    }
}
