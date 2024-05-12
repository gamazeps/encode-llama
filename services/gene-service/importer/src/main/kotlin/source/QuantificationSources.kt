package source

import import.*
import model.*
import util.*
import okhttp3.*
import mu.KotlinLogging
import java.io.File
import java.io.InputStream

private val log = KotlinLogging.logger {}

private enum class QuantificationType { GENE, TRANSCRIPT }
private data class RemoteQuantificationFile(
        val assembly: String,
        val type: QuantificationType,
        val experimentAccession: String,
        val fileAccession: String,
        val url: String
)
private data class RemoteQuantificationFiles(
        val geneFilesByAssembly: Map<String, List<RemoteQuantificationFile>>,
        val transcriptFilesByAssembly: Map<String, List<RemoteQuantificationFile>>
)

class EncodeQuantificationSource(private val assemblies: List<String>,
                                 private val encodeApiParallelism: Int,
                                 private val encodeFileParallelism: Int,
                                 private val encodeBaseUrl: String = ENCODE_BASE_URL) : QuantificationSource {

    private val http = OkHttpClient()
    private val quantificationFiles: RemoteQuantificationFiles by lazy { findQuantificationFiles() }

    private fun findQuantificationFiles(): RemoteQuantificationFiles {
        if (assemblies.isEmpty()) return RemoteQuantificationFiles(mapOf(), mapOf())
        log.info { "Beginning Encode Quantification File Lookup" }
        log.info { "Searching ENCODE for applicable experiments..." }
        val searchResult = requestEncodeSearch(encodeBaseUrl)
        log.info { "ENCODE search complete. ${searchResult.graph.size} results found." }

        val experimentAccessions = searchResult.graph.map { it.accession }

        val allFiles = runParallel("ENCODE Quantification File Lookup", experimentAccessions, encodeApiParallelism) { experimentAccession ->
            val experiment = requestEncodeExperiment(encodeBaseUrl, experimentAccession)
            return@runParallel experiment.files
                    .filter {
                        val isQuantification = it.isGeneQuantification() || it.isTranscriptQuantification()
                        val isTsv = it.fileType == "tsv"
                        val pipelines = it.analysisStepVersion?.analysisStep?.pipelines
                        val pipelineTitle = if (pipelines?.isNotEmpty() == true) pipelines[0].title else null
                        val isReddyGgr = pipelineTitle == "RNA-seq pipeline (Reddy GGR)"
                        return@filter isQuantification && isTsv && it.isReleased() && !isReddyGgr &&
                                assemblies.contains(it.assembly) && it.cloudMetadata != null
                    }.map {
                        val fileType =
                                if (it.isGeneQuantification()) QuantificationType.GENE
                                else QuantificationType.TRANSCRIPT
                        return@map RemoteQuantificationFile(it.assembly!!, fileType, experiment.accession,
                                it.accession!!, it.cloudMetadata!!.url)
                    }
        }.flatten()

        log.info { "Quantification file lookup complete. Files found: ${allFiles.size}" }

        val geneFilesByAssembly = mutableMapOf<String, MutableList<RemoteQuantificationFile>>()
        val transcriptFilesByAssembly = mutableMapOf<String, MutableList<RemoteQuantificationFile>>()
        for (file in allFiles) {
            when (file.type) {
                QuantificationType.GENE -> {
                    geneFilesByAssembly.putIfAbsent(file.assembly, mutableListOf())
                    geneFilesByAssembly.getValue(file.assembly).add(file)
                }
                QuantificationType.TRANSCRIPT -> {
                    transcriptFilesByAssembly.putIfAbsent(file.assembly, mutableListOf())
                    transcriptFilesByAssembly.getValue(file.assembly).add(file)
                }
            }
        }

        return RemoteQuantificationFiles(geneFilesByAssembly, transcriptFilesByAssembly)
    }

    override fun assemblies() = assemblies

    override fun import(assembly: String, sink: QuantificationSink) {
        log.info { "Running encode quantification files import for assembly $assembly..." }

        val assemblyFiles = quantificationFiles
        val geneQuantFiles = assemblyFiles.geneFilesByAssembly[assembly]
        if (geneQuantFiles != null) {
            runParallel("Assembly $assembly - Encode Gene Quantification Files Import", geneQuantFiles, encodeFileParallelism) { file ->
               // val fileDownloadRequest = Request.Builder().url(file.url).get().build()
               // val downloadInputStream = http.newCall(fileDownloadRequest).execute().body()!!.byteStream()
               // importGeneQuantification(file.experimentAccession, file.fileAccession, downloadInputStream, sink)
            }
        }

        val transcriptQuantFiles = assemblyFiles.transcriptFilesByAssembly[assembly]
        if (transcriptQuantFiles != null) {
            runParallel("Assembly $assembly - Encode Transcript Quantification Files Import", transcriptQuantFiles, encodeFileParallelism) { file ->
                val fileDownloadRequest = Request.Builder().url(file.url).get().build()
                val downloadInputStream = http.newCall(fileDownloadRequest).execute().body()!!.byteStream()
                importTranscriptQuantification(file.experimentAccession, file.fileAccession, downloadInputStream, sink)
            }
        }

        log.info { "Completed encode quantification files import for assembly $assembly!" }
    }
}

data class LocalQuantificationFile(
        val experimentAccession: String,
        val fileAccession: String,
        val file: File
)

class FileQuantificationSource(private val geneFilesByAssembly: Map<String, List<LocalQuantificationFile>>,
                               private val transcriptFilesByAssembly: Map<String, List<LocalQuantificationFile>>,
                               private val fileParallelism: Int) : QuantificationSource {

    override fun assemblies(): List<String> = (geneFilesByAssembly.keys + transcriptFilesByAssembly.keys).toList()

    override fun import(assembly: String, sink: QuantificationSink) {
        log.info { "Running local quantification files import for assembly $assembly..." }

        val geneQuantFiles = geneFilesByAssembly[assembly]
        if (geneQuantFiles != null) {
            runParallel("Assembly $assembly - Gene Quantification Files Import", geneQuantFiles, fileParallelism) { file ->
              //  importGeneQuantification(file.experimentAccession, file.fileAccession, file.file.inputStream(), sink)
            }
        }

        val transcriptQuantFiles = transcriptFilesByAssembly[assembly]
        if (transcriptQuantFiles != null) {
            runParallel("Assembly $assembly - Transcript Quantification Files Import", transcriptQuantFiles, fileParallelism) { file ->
             //   importTranscriptQuantification(file.experimentAccession, file.fileAccession, file.file.inputStream(), sink)
            }
        }

        log.info { "Completed local quantification files import for assembly $assembly!" }
    }
}

fun importGeneQuantification(experimentAccession: String, fileAccession: String,
                             inputStream: InputStream, sink: QuantificationSink) {
    log.info { "Reading gene TSV" }
    readTsv(inputStream) { line ->
        val geneId = line.getValue("gene_id")
        val geneIdPrefix = geneId.split(".")[0]
        val transcriptIds = line.getValue("transcript_id(s)").split(",")
        val len = line.getValue("length").toFloat()
        val effectiveLen = line.getValue("effective_length").toFloat()
        val expectedCount = line.getValue("expected_count").toFloat()
        val tpm = line.getValue("tpm").toFloat()
        val fpkm = line.getValue("fpkm").toFloat()
        val posteriorMeanCount = line.getValue("posterior_mean_count").toFloat()
        val posteriorStandardDeviationOfCount = line.getValue("posterior_standard_deviation_of_count").toFloat()
        val pmeTpm = line.getValue("pme_tpm").toFloat()
        val pmeFpkm = line.getValue("pme_fpkm").toFloat()
        val tpmCiLowerBound = line.getValue("tpm_ci_lower_bound").toFloat()
        val tpmCiUpperBound = line.getValue("tpm_ci_upper_bound").toFloat()
        val tpmCoefficientOfQuartileVariation = line["tpm_coefficient_of_quartile_variation"]?.toFloat()
        val fpkmCiLowerBound = line.getValue("fpkm_ci_lower_bound").toFloat()
        val fpkmCiUpperBound = line.getValue("fpkm_ci_upper_bound").toFloat()
        val fpkmCoefficientOfQuartileVariation = line["fpkm_coefficient_of_quartile_variation"]?.toFloat()

        sink.writeGeneQuant(experimentAccession, fileAccession,
                geneId, geneIdPrefix, transcriptIds, len, effectiveLen, expectedCount, tpm, fpkm, posteriorMeanCount,
                posteriorStandardDeviationOfCount, pmeTpm, pmeFpkm, tpmCiLowerBound, tpmCiUpperBound,
                tpmCoefficientOfQuartileVariation, fpkmCiLowerBound, fpkmCiUpperBound, fpkmCoefficientOfQuartileVariation)
    }
}

fun importTranscriptQuantification(experimentAccession: String, fileAccession: String,
                                           inputStream: InputStream, sink: QuantificationSink) {
    readTsv(inputStream) { line ->
        val transcriptId = line.getValue("transcript_id")
        val transcriptIdPrefix = transcriptId.split(".")[0]
        val geneId = line.getValue("gene_id")
        val geneIdPrefix = geneId.split(".")[0]
        val len = line.getValue("length").toInt()
        val effectiveLen = line.getValue("effective_length").toFloat()
        val expectedCount = line.getValue("expected_count").toFloat()
        val tpm = line.getValue("tpm").toFloat()
        val fpkm = line.getValue("fpkm").toFloat()
        val isoPct = line.getValue("isopct").toFloat()
        val posteriorMeanCount = line.getValue("posterior_mean_count").toFloat()
        val posteriorStandardDeviationOfCount = line.getValue("posterior_standard_deviation_of_count").toFloat()
        val pmeTpm = line.getValue("pme_tpm").toFloat()
        val pmeFpkm = line.getValue("pme_fpkm").toFloat()
        val isoPctFromPmeTpm = line.getValue("isopct_from_pme_tpm").toFloat()
        val tpmCiLowerBound = line.getValue("tpm_ci_lower_bound").toFloat()
        val tpmCiUpperBound = line.getValue("tpm_ci_upper_bound").toFloat()
        val tpmCoefficientOfQuartileVariation: Float? = line["tpm_coefficient_of_quartile_variation"]?.toFloat()
        val fpkmCiLowerBound = line.getValue("fpkm_ci_lower_bound").toFloat()
        val fpkmCiUpperBound = line.getValue("fpkm_ci_upper_bound").toFloat()
        val fpkmCoefficientOfQuartileVariation: Float? = line["fpkm_coefficient_of_quartile_variation"]?.toFloat()

        sink.writeTranscriptQuant(experimentAccession, fileAccession,
                transcriptId, transcriptIdPrefix, geneId, geneIdPrefix, len, effectiveLen, expectedCount, tpm, fpkm, isoPct,
                posteriorMeanCount, posteriorStandardDeviationOfCount, pmeTpm, pmeFpkm, isoPctFromPmeTpm, tpmCiLowerBound,
                tpmCiUpperBound, tpmCoefficientOfQuartileVariation, fpkmCiLowerBound, fpkmCiUpperBound,
                fpkmCoefficientOfQuartileVariation)
    }
}
