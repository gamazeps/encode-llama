package source

import import.*
import model.PsychEncodeDataset
import mu.KotlinLogging
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.BufferedReader
import java.io.InputStreamReader
import util.*

private val http by lazy { OkHttpClient() }
private val log = KotlinLogging.logger {}

class PsychEncodeQuantificationSource(private val srcAssembly: String,
                                      private val metadataUrl: String,
                                      private val psychEncodeQuantificationBaseUrl: String,
                                      private val parallelism: Int) : QuantificationSource {

    override fun assemblies() = listOf(srcAssembly)

    override fun import(assembly: String, sink: QuantificationSink) {

        log.info { "Beginning Psych Encode Quantification Import" }

        val fileDownloadRequest = Request.Builder().url(metadataUrl).get().build()
        val downloadInputStream = http.newCall(fileDownloadRequest).execute().body()!!.byteStream()
        val reader = BufferedReader(InputStreamReader(downloadInputStream))
        val geneQuantificationFiles: MutableMap<String, PsychEncodeDataset> = mutableMapOf()
        val transcriptQuantificationFiles: MutableMap<String, PsychEncodeDataset> = mutableMapOf()

        reader.readLine() // Skip first line
        reader.forEachLine { line ->
            val lineVals = line.replace("\"", "").split("\t")
            try {
                val fileId = lineVals[2].replace(" ", "")
                val name = lineVals[3].replace(" ", "")
                val assay = lineVals[10].replace(" ", "")
                val specimenId = lineVals[28].replace(" ", "")
                val ds = PsychEncodeDataset(name = name, datasetAccession = specimenId + assay)
                when {
                    name.contains("genes", true) -> {
                        geneQuantificationFiles.putIfAbsent(fileId, ds)
                    }
                    name.contains("isoform", true) -> {
                        transcriptQuantificationFiles.putIfAbsent(fileId, ds)
                    }
                }
            } catch (e: Exception) { }
        }

        log.info { "found ${geneQuantificationFiles.size} gene quantification files to import"}

        runParallel("PsychENCODE Gene Quantification Import", geneQuantificationFiles.keys.toList(), parallelism) {
            val file = geneQuantificationFiles[it]!!
            val quantDownloadRequest = Request.Builder().url(psychEncodeQuantificationBaseUrl + file.name).get().build()
            val quantInputStream = http.newCall(quantDownloadRequest).execute().body()!!.byteStream()
            importGeneQuantification(file.datasetAccession, file.name, quantInputStream, sink)
        }

        log.info { "found ${transcriptQuantificationFiles.size} transcript quantification files to import"}

        runParallel("PsychENCODE transcript Quantification Import", transcriptQuantificationFiles.keys.toList(), parallelism) {
            val file = transcriptQuantificationFiles[it]!!
            val transcriptDownloadRequest = Request.Builder().url(psychEncodeQuantificationBaseUrl + file.name).get().build()
            val transcriptInputStream = http.newCall(transcriptDownloadRequest).execute().body()!!.byteStream()
            importTranscriptQuantification(file.datasetAccession, file.name, transcriptInputStream, sink)
        }
    }

}

class PsychEncodeNormalizedSource(private val assembly: String,
                                  private val url: String) : QuantificationSource {

    override fun assemblies() = listOf(assembly)

    override fun import(assembly: String, sink: QuantificationSink) {
        log.info { "Beginning PsychENCODE normalized import" }
        val fileDownloadRequest = Request.Builder().url(url).get().build()
        val downloadInputStream = http.newCall(fileDownloadRequest).execute().body()!!.byteStream()
        val reader = BufferedReader(InputStreamReader(downloadInputStream))
        val header = reader.readLine().split("\t")
        val hIds = header.takeLast(header.size - 1)

        reader.forEachLine { line ->
            val columns = line.split("\t")
            val geneId = columns[0]
            val values = columns.takeLast(columns.size - 1)
            values.forEachIndexed { i, e ->
                sink.writeGeneQuantNormalized(hIds[i], geneId, e.toFloat())
            }
        }

    }

}