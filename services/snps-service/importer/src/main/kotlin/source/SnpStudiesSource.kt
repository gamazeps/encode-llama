package source

import import.*
import mu.KotlinLogging
import okhttp3.OkHttpClient
import okhttp3.Request
import util.runParallel
import java.io.BufferedReader
import java.io.InputStreamReader

private val log = KotlinLogging.logger {}
private val http by lazy { OkHttpClient() }

class SnpsStudySource(private val snpStudyFileUrls: List<String>,
                     private val snpStudyFileParallelism: Int, override val assembly: String): SnpStudySource {

    override fun import(sink: SnpStudySink) {
        log.info { "Beginning studies import" }
        runParallel("SNP study files import", snpStudyFileUrls, snpStudyFileParallelism) { snpStudyFileUrl ->
            log.info { "Beginning SNP study files import from  $snpStudyFileUrl" }
            val fileDownloadRequest = Request.Builder().url(snpStudyFileUrl).get().build()
            val downloadInputStream = http.newCall(fileDownloadRequest).execute().body()!!.byteStream()
            val reader = BufferedReader(InputStreamReader(downloadInputStream))
            reader.forEachLine { line ->
                sink.write(line)
            }
        }
    }

}
