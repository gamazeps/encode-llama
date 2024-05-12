package source

import import.*
import mu.KotlinLogging
import java.io.BufferedReader
import java.io.File
import java.io.FileInputStream
import java.io.InputStreamReader

private val log = KotlinLogging.logger {}

class FileCellTypeEnrichmentsSource(private val files: List<File>, override val assembly: String): CellTypeEnrichmentSource {

    override fun import(sink: CellTypeEnrichmentSink) {
        log.info { "Beginning import of cell type enrichment" }
        for(file in files) {
            val reader = BufferedReader(InputStreamReader(FileInputStream(file)))
            val lineHeaders =reader.readLine() // Skip first line
            val headerValues = lineHeaders.split("\t")
            reader.forEachLine { line ->
                sink.write(line, headerValues)
            }
        }
    }

}
