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

class DegHttpSource(private val url: String) : DegSource {
    override fun import(sink: DegSink) {
        log.info { "Beginning deg data Import" }
        val fileDownloadRequest = Request.Builder().url(url).get().build()
        val downloadInputStream = http.newCall(fileDownloadRequest).execute().body()!!.byteStream()
        val disease = url.split("/")[3].split("_DEGcombined.csv")[0]
        importData(disease, sink, downloadInputStream)
        log.info { "${disease} deg data complete" }
    }
}

private fun importData(disease: String, sink: DegSink, inputStream: InputStream) {
    val reader = BufferedReader(InputStreamReader(inputStream))
    val columns = reader.readLine() // Skip first line of column header 
    //gene,base_mean,log2_fc,lfc_se,stat,pvalue,padj,disease,celltype

    //gene,base_mean,log2_fc,lfc_se,stat,pvalue,padj,disease,celltype

    //,gene,baseMean,log2FoldChange,lfcSE,stat,pvalue,padj,cell_type
    reader.forEachLine { line ->
        val lineVals = line.split(",")
        if(lineVals.size>1)
        {
             val l1 = if(lineVals[1] == "NA") "0" else lineVals[1]
            val l2 = if(lineVals[2]== "NA") "0" else lineVals[2] 
            val l3= if(lineVals[3]== "NA") "0" else lineVals[3] 
            val l4 = if(lineVals[4]== "NA") "0" else lineVals[4] 
            val l5 = if(lineVals[5]== "NA") "0" else lineVals[5] 
            val l6  = if(lineVals[6]== "NA") "0" else lineVals[6]
        try {             
            
            val gene = lineVals[0]
            sink.write(gene, l1,l2,l3,l4,l5,l6,disease,lineVals[7])


        } catch (e: Exception) {
            log.error(e) { "Error occurred during ${e},  ${l1},${l2},${l3},${l4},${l5},${l6},${disease},${lineVals[7]}" }
        }
        }
          

    }

}