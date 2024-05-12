package util

import mu.KotlinLogging
import org.apache.commons.net.ftp.FTP
import org.apache.commons.net.ftp.FTPClient
import org.apache.commons.net.ftp.FTPReply
import java.io.InputStream
import java.net.URL

private val log = KotlinLogging.logger {}

fun importFtp(url: String, processStream: (InputStream) -> Unit) {
    val ftp = FTPClient()

    val parsedUrl = URL(url)
    val host = parsedUrl.host
    log.info { "Connecting to ftp host $host..." }
    ftp.connect(parsedUrl.host)
    val reply = ftp.replyCode

    if (!FTPReply.isPositiveCompletion(reply)) {
        ftp.disconnect()
        log.error { "Unable to connect to ftp host $host" }
        return
    }

    val userInfo = parsedUrl.userInfo.split(":")
    val username = userInfo[0]
    val password = if (userInfo.size > 1) userInfo[1] else ""

    log.info { "Logging in to host $host with given credentials (user=$username)..." }
    ftp.login(username, password)
    ftp.setFileType(FTP.BINARY_FILE_TYPE)
    ftp.setFileTransferMode(FTP.COMPRESSED_TRANSFER_MODE)
    ftp.enterLocalPassiveMode()

    if (ftp.isConnected) {
        val path = parsedUrl.path
        log.info { "Successfully connected to ftp at $host. Initiating download for $path..." }
        val downloadInputStream = ftp.retrieveFileStream(path)
        processStream(downloadInputStream)

        log.info { "Import for ftp file $host/$path complete!" }
        try {
            ftp.disconnect()
        } catch (e: Throwable) {
            log.error(e) { "Error Disconnecting after ftp import for $host/$url" }
        }
    } else throw Exception("Unable to connect to ftp at $host")
}