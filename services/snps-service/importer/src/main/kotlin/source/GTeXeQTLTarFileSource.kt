package source

import import.*
import mu.KotlinLogging
import java.io.*

private val log = KotlinLogging.logger {}

class GTeXeQTLTarFileSource(private val tarball: File) : GTeXeQTLSource() {
    override fun import(sink: GTeXeQTLSink) {
        log.info { "Importing GTeX eQTLs from file $tarball" }
        FileInputStream(tarball).use {
            super.import(sink, it)
        }
    }
}
