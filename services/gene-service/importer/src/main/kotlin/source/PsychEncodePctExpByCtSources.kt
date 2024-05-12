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

class PsychEncodePctExpByCtHttpSource(private val psychencodeUrl: String, private val dataset: String) : PsychEncodePctExpByCtSource {
    override fun import(sink: PsychEncodePctExpByCtSink) {
        log.info { "Beginning Psych Encode dataset pct exp by ct data Import" }
        val fileDownloadRequest = Request.Builder().url(psychencodeUrl).get().build()
        val downloadInputStream = http.newCall(fileDownloadRequest).execute().body()!!.byteStream()
        importData(dataset, sink, downloadInputStream)
        log.info { "Psych Encode dataset pct exp by ct data complete" }
    }
}

private fun importData(dataset: String, sink: PsychEncodePctExpByCtSink, inputStream: InputStream) { 
    val reader = BufferedReader(InputStreamReader(inputStream))
    reader.readLine() // Skip first header line
    reader.forEachLine { line ->       
        val lineVals = line.split(",")
        try {
           
                sink.write(dataset,lineVals[0],"ExcitatoryNeurons",lineVals[1])
                sink.write(dataset,lineVals[0],"InhibitoryNeurons",lineVals[2])
                sink.write(dataset,lineVals[0],"Astrocytes",lineVals[3])
                sink.write(dataset,lineVals[0],"Oligodendrocytes",lineVals[4])
                sink.write(dataset,lineVals[0],"OPCs",lineVals[5])
                sink.write(dataset,lineVals[0],"Microglia",lineVals[6])
                sink.write(dataset,lineVals[0],"Misc",lineVals[7])
            
        } catch (e: Exception) {
            log.error(e) { "Error occurred during $lineVals" }
        }
        
    }

}