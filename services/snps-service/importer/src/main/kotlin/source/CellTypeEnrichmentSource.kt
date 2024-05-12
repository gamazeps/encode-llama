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

class CellTypeEnrichmentsSource(private val cellTypeEnrichmentFileUrls: List<String>,
                                private val cellTypeEnrichmentFileParallelism: Int,
                                override val assembly: String): CellTypeEnrichmentSource {

    override fun import(sink: CellTypeEnrichmentSink) {

        log.info { "Beginning import of cell type enrichment" }
        runParallel("Cell type enrichment files import", cellTypeEnrichmentFileUrls, cellTypeEnrichmentFileParallelism) { cellTypeEnrichmentFileUrl ->
            log.info { "Beginning cell type enrichment import from  $cellTypeEnrichmentFileUrl" }
            val fileDownloadRequest = Request.Builder().url(cellTypeEnrichmentFileUrl).get().build()
            val downloadInputStream = http.newCall(fileDownloadRequest).execute().body()!!.byteStream()
            val reader = BufferedReader(InputStreamReader(downloadInputStream))
            val lineHeaders = reader.readLine()
            val headerValues = lineHeaders.split("\t")
            reader.forEachLine { line ->
                sink.write(line, headerValues)
            }
        }

    }

}
