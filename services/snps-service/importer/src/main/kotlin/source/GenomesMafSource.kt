package source

import import.*
import mu.KotlinLogging
import java.net.URL
import util.runParallel
import java.util.zip.GZIPInputStream
import org.apache.commons.net.ftp.*

private val log = KotlinLogging.logger {}

class GenomesMafSource(private val mafFileUrls: List<String>,
                    private val mafFileParallelism: Int): MafSource {
    override fun import(sink: MafSink) {

        log.info { "Beginning MAF file import from 1000 Genomes" }
        runParallel("MAF file import from 1000 Genomes", mafFileUrls, mafFileParallelism) { snpsFileUrl ->
            try {
                log.info { "Beginning MAF files from  $snpsFileUrl" }

                val ftp by lazy { FTPClient() }
                val parsedUrl = URL(snpsFileUrl)
                ftp.connect(parsedUrl.host)
                val reply = ftp.replyCode
                if (!FTPReply.isPositiveCompletion(reply)) {
                    ftp.disconnect()
                    log.error { "unable to connect to $snpsFileUrl " }
                }

                ftp.login("anonymous", "")
                ftp.setFileType(FTP.BINARY_FILE_TYPE)
                ftp.setFileTransferMode(FTP.BLOCK_TRANSFER_MODE)
                ftp.enterLocalPassiveMode()

                val ip = ftp.retrieveFileStream(parsedUrl.path)
                (GZIPInputStream(ip)).reader().forEachLine { line ->
                    if (!line.startsWith('#')) sink.write(line)
                }
            } catch (e: Throwable) {
                log.info { "Exception: $e" }
            }
        }
    }
}
