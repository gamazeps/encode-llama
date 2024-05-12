package source

import import.*
import model.*
import util.*
import mu.KotlinLogging
import okhttp3.*
import java.util.zip.GZIPInputStream

private val log = KotlinLogging.logger {}

class EncodePeaksSource(private val speciesList: List<String>,
                        private val searchTerm: String,
                        private val encodeApiParallelism: Int,
                        private val encodeFileParallelism: Int,
                        private val encodeBaseUrl: String = ENCODE_BASE_URL,
                        private val importHistonePeaks:Boolean = false): PeaksSource {

    private val http = OkHttpClient()
    private val peaksFilesByAssembly by lazy { findPeaksFiles() }

    override fun assemblies() = peaksFilesByAssembly.keys.toList()

    private fun findPeaksFiles(): Map<String, List<EncodePeaksFile>> {
        log.info { "Beginning Encode ${searchTerm} Peaks File Lookup" }
        log.info { "Searching ENCODE for applicable experiments..." }
        val peaksByAssembly = mutableMapOf<String, MutableList<EncodePeaksFile>>()
        for (species in speciesList) {
            log.info { "${searchTerm} - Searching ENCODE for $species experiments" }
            val searchResult = requestEncodeSearch(encodeBaseUrl, species, searchTerm,importHistonePeaks)
            log.info { "${searchTerm} - ENCODE $species search complete. ${searchResult.graph.size} results found." }

            val experimentAccessions = searchResult.graph.map { it.accession }

            val peaksFiles = runParallel("ENCODE Experiment Peaks File URL Lookup", experimentAccessions,
                    encodeApiParallelism) { experimentAccession ->
                val encodeExperiment = requestEncodeExperiment(encodeBaseUrl, experimentAccession)
                encodeExperiment.files
                        .filter { if(searchTerm.equals("chip-seq",true)) {it.isReleased() && it.isReplicatedPeaks()} else {it.isReleased() && it.isUnreplicatedPeaks()}  }
                        .map { EncodePeaksFile(it.assembly!!, experimentAccession, it.accession!!, it.cloudMetadata!!.url) }
            }.flatten()

            for (file in peaksFiles) {
                peaksByAssembly.putIfAbsent(file.assembly, mutableListOf())
                peaksByAssembly.getValue(file.assembly).add(file)
            }
        }

        val peaksFileCount = peaksByAssembly.values.fold(0) { acc, files -> acc + files.size }
        log.info { "${searchTerm} Peaks files lookup complete. Peaks files found: $peaksFileCount" }
        return peaksByAssembly
    }

    override fun import(assembly: String, sink: PeaksSink) {
        log.info { "Running encode ${searchTerm} peaks files import for assembly $assembly..." }

        val peaksFiles = peaksFilesByAssembly[assembly]
        if (peaksFiles != null) {
            runParallel("${searchTerm} Peaks Files Import", peaksFiles, encodeFileParallelism) { peaksFile ->
                val fileDownloadRequest = Request.Builder().url(peaksFile.url).get().build()
                val downloadInputStream = http.newCall(fileDownloadRequest).execute().body()!!.byteStream()
                GZIPInputStream(downloadInputStream).reader().forEachLine { line ->
                    sink.write(peaksFile.experimentAccession, peaksFile.fileAccession, line)
                }
            }
        }

        log.info { "Completed encode ${searchTerm} peaks files import for assembly $assembly!" }
    }
}

private data class EncodePeaksFile(val assembly: String, val experimentAccession: String, val fileAccession: String, val url: String)