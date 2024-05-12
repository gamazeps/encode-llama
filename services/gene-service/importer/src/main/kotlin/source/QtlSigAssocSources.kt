package source

import import.*
import mu.KotlinLogging
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.BufferedReader
import java.io.File
import java.io.InputStream
import java.io.InputStreamReader

private val http by lazy { OkHttpClient() }
private val log = KotlinLogging.logger {}

class QtlSigAssocHttpSource(private val url: String, private val type: String) : QtlSigAssocSource {
    override fun import(sink: QtlSigAssocSink) {
        log.info { "Beginning QtlSigAssoc data Import ${url}" }
        val fileDownloadRequest = Request.Builder().url(url).get().build()
        val downloadInputStream = http.newCall(fileDownloadRequest).execute().body()!!.byteStream()
        importData(type, sink, downloadInputStream)
        log.info { "QtlSigAssoc data complete for ${url}" }
    }
}

private fun importData(type: String, sink: QtlSigAssocSink, inputStream: InputStream) {
    val reader = BufferedReader(InputStreamReader(inputStream))
    //val columns = reader.readLine() // Skip first line of column header 
    //geneid,snpid, dist  npval  slope  fdr qtltype
    reader.forEachLine { line ->
        val lineVals = line.split("\t")
        if(line.contains("NA"))
        {
            //log.info { " ${type} line contains  ${line}" }
        } else {
            try {             
        
            sink.write(lineVals[0],lineVals[1],lineVals[2],lineVals[3],lineVals[4],lineVals[5],type)


            } catch (e: Exception) {
                log.error(e) { "Error occurred during ${type} ${line}" }
            }
        }   
        

    }

}