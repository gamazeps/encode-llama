package source

import import.*
import mu.KotlinLogging
import java.io.File
import java.io.FileInputStream
import java.util.zip.GZIPInputStream

private val log = KotlinLogging.logger {}

class FileMafSource(private val mafFileUrls: List<File>): MafSource {

    override fun import(sink: MafSink) {
        mafFileUrls.forEach { file ->
            log.info { "Importing MAFs from file $file" }
            (GZIPInputStream(FileInputStream(file))).reader().forEachLine {
                if (!it.startsWith('#')) sink.write(it)
            }
        }
    }

}
