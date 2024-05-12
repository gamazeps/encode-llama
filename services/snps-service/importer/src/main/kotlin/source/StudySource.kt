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

class StudiesSource(private val StudyFileUrls: List<String>,
                    private val StudyFileParallelism: Int, override val assembly: String): StudySource {

    override fun import(sink: StudySink) {
        log.info { "Beginning SNP File Import" }
        runParallel("SNP study files import", StudyFileUrls, StudyFileParallelism) { StudyFileUrl ->
            log.info { "Beginning study files import from  $StudyFileUrl" }
            val fileDownloadRequest = Request.Builder().url(StudyFileUrl).get().build()
            val downloadInputStream = http.newCall(fileDownloadRequest).execute().body()!!.byteStream()
            val reader = BufferedReader(InputStreamReader(downloadInputStream))
            reader.forEachLine { line ->
                sink.write(line)
            }
        }
    }

}
