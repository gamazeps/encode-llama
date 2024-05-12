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

class PsychEncodePctExpByScHttpSource(private val psychencodeUrl: String, private val dataset: String) : PsychEncodePctExpByScSource {
    override fun import(sink: PsychEncodePctExpByScSink) {
        log.info { "Beginning Psych Encode dataset pct exp by sc data Import" }
        val fileDownloadRequest = Request.Builder().url(psychencodeUrl).get().build()
        val downloadInputStream = http.newCall(fileDownloadRequest).execute().body()!!.byteStream()
        importData(dataset, sink, downloadInputStream)
        log.info { "Psych Encode dataset pct exp by sc data complete" }
    }
}

private fun importData(dataset: String, sink: PsychEncodePctExpByScSink, inputStream: InputStream) {
    val reader = BufferedReader(InputStreamReader(inputStream))
    reader.readLine() // Skip first header line
    reader.forEachLine { line ->
        val lineVals = line.split(",")
       
        try {
        //L2/3 IT,L4 IT,L5 IT,L6 IT,L6 IT Car3,L5 ET,L5/6 NP,L6b,L6 CT,Sst,Sst Chodl,Pvalb,Chandelier,Lamp5 Lhx6,Lamp5, Sncg,Vip,Pax6, Astro,Oligo,OPC,Micro,Endo,VLMC,PC,SMC,Immune,RB
            sink.write(dataset,lineVals[0],"L2/3 IT",lineVals[1])
            sink.write(dataset,lineVals[0],"L4 IT",lineVals[2])
            sink.write(dataset,lineVals[0],"L5 IT",lineVals[3])
            sink.write(dataset,lineVals[0],"L6 IT",lineVals[4])
            sink.write(dataset,lineVals[0],"L6 IT Car3",lineVals[5])
            sink.write(dataset,lineVals[0],"L5 ET",lineVals[6])
            sink.write(dataset,lineVals[0],"L5/6 NP",lineVals[7])
            sink.write(dataset,lineVals[0],"L6b",lineVals[8])
            sink.write(dataset,lineVals[0],"L6 CT",lineVals[9])
            sink.write(dataset,lineVals[0],"Sst",lineVals[10])
            sink.write(dataset,lineVals[0],"Sst Chodl",lineVals[11])
            sink.write(dataset,lineVals[0],"Pvalb",lineVals[12])
            sink.write(dataset,lineVals[0],"Chandelier",lineVals[13])
            sink.write(dataset,lineVals[0],"Lamp5 Lhx6",lineVals[14])
            sink.write(dataset,lineVals[0],"Lamp5",lineVals[15])
            sink.write(dataset,lineVals[0],"Sncg",lineVals[16])
            sink.write(dataset,lineVals[0],"Vip",lineVals[17])
            sink.write(dataset,lineVals[0],"Pax6",lineVals[18])
            sink.write(dataset,lineVals[0],"Astro",lineVals[19])
            sink.write(dataset,lineVals[0],"Oligo",lineVals[20])
            sink.write(dataset,lineVals[0],"OPC",lineVals[21])
            sink.write(dataset,lineVals[0],"Micro",lineVals[22])
            sink.write(dataset,lineVals[0],"Endo",lineVals[23])
            sink.write(dataset,lineVals[0],"VLMC",lineVals[24])
            sink.write(dataset,lineVals[0],"PC",lineVals[25])
            sink.write(dataset,lineVals[0],"SMC",lineVals[26])
            sink.write(dataset,lineVals[0],"Immune",lineVals[27])
            sink.write(dataset,lineVals[0],"RB",if(lineVals[28]!="") lineVals[28] else "0")


        } catch (e: Exception) {
            log.error(e) { "Error occurred during ${dataset} ${line}" }
        }

    }

}