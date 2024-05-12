package source

import import.*
import mu.KotlinLogging
import java.io.*
import java.util.zip.GZIPInputStream

private val log = KotlinLogging.logger {}

data class PeaksFile(
        val experimentAccession: String,
        val fileAccession: String,
        val file: File
)

class FilePeaksSource(private val peaksFilesByAssembly: Map<String, List<PeaksFile>>): PeaksSource {
    override fun assemblies() = peaksFilesByAssembly.keys.toList()

    override fun import(assembly: String, sink: PeaksSink) {
        log.info { "Beginning Peaks File Import" }
        val peaksFiles = peaksFilesByAssembly[assembly]
        if (peaksFiles != null) {
            for(peaksFile in peaksFiles) {
                log.info { "Importing peaks from file ${peaksFile.file}" }
                GZIPInputStream(FileInputStream(peaksFile.file)).reader().forEachLine { line ->
                    sink.write(peaksFile.experimentAccession, peaksFile.fileAccession, line)
                }
            }
        }
    }
}