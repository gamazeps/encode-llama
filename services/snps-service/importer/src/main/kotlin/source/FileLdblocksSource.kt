package source

import import.LdBlocksSink
import import.LdBlocksSource
import mu.KotlinLogging
import java.io.File
import java.io.FileInputStream
import java.util.zip.GZIPInputStream

private val log = KotlinLogging.logger {}
class FileLdBlockSource(private val files: List<File>, override val population: String): LdBlocksSource {

    override fun import(sink: LdBlocksSink) {
        log.info { "Beginning blocks File Import" }
        for(file in files) {
            log.info { "Importing LD blocks from file $file" }
            sink.write(GZIPInputStream(FileInputStream(file)))
        }
    }

}
