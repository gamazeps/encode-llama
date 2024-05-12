package source

import import.*
import mu.KotlinLogging
import java.io.BufferedReader
import java.io.File
import java.io.FileInputStream
import java.io.InputStreamReader

private val log = KotlinLogging.logger {}

class FileStudiesSource(private val files: List<File>, override val assembly: String): StudySource {

    override fun import(sink: StudySink) {
        log.info { "Beginning studies import" }
        for(file in files) {
            val reader = BufferedReader(InputStreamReader(FileInputStream(file)))
            reader.forEachLine { line ->
                sink.write(line)
            }
        }
    }

}
