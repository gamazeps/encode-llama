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

class NihSnpsSource(private val snpsFileUrls: List<String>,
                    private val snpFileParallelism: Int, override val assembly: String): SnpsSource {

    override fun import(sink: SnpsSink) {

        log.info { "Beginning SNP file import from NIH" }
        runParallel("SNP files import from NIH", snpsFileUrls, snpFileParallelism) { snpsFileUrl ->
            log.info { "Beginning SNP files from  $snpsFileUrl" }
            val fileDownloadRequest = Request.Builder().url(snpsFileUrl).get().build()
            val downloadInputStream = http.newCall(fileDownloadRequest).execute().body()!!.byteStream()
            val reader = BufferedReader(InputStreamReader(GZIPInputStream(downloadInputStream)))
            reader.readLine() // Skip first line
            reader.forEachLine { line ->
                val lineValues = line.split("\t")
                sink.write(lineValues[0], lineValues[1], lineValues[2], lineValues[3])
            }
        }
    }

}
