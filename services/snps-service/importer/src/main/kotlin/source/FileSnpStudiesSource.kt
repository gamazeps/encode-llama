package source

import import.*
import mu.KotlinLogging
import java.io.BufferedReader
import java.io.File
import java.io.FileInputStream
import java.io.InputStreamReader

private val log = KotlinLogging.logger {}

class FileSnpStudiesSource(private val files: List<File>, override val assembly: String): SnpStudySource {

    override fun import(sink: SnpStudySink) {
        log.info { "Beginning SNP studies file import " }
        for(file in files) {
            val reader = BufferedReader(InputStreamReader(FileInputStream(file)))
            reader.forEachLine { line ->
                sink.write(line)
            }
        }
    }

}
