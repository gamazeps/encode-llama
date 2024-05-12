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

class DeconqtlsHttpSource(private val url: String, private val type: String) : DeconqtlsSource {
    override fun import(sink: DeconqtlsSink) {
        log.info { "Beginning Decon qtls data Import ${url}" }
        val fileDownloadRequest = Request.Builder().url(url).get().build()
        val downloadInputStream = http.newCall(fileDownloadRequest).execute().body()!!.byteStream()
        importData(type, sink, downloadInputStream)
        log.info { "Deconqtls data complete for ${url}" }
    }
}

private fun importData(type: String, sink: DeconqtlsSink, inputStream: InputStream) {
    val reader = BufferedReader(InputStreamReader(inputStream))
    val columns = reader.readLine() // Skip first line of column header 
    //geneid,snpid,snp_chrom,snp_start, nom_val,slope,adj_beta_pval,r_squared,celltype
    reader.forEachLine { line ->
        val lineVals = line.split("\t")
        if(line.contains("NA"))
        {
            //log.info { " ${type} line contains  ${line}" }
        } else {
            try {             
        
            sink.write(lineVals[1],lineVals[8],lineVals[9],lineVals[10],lineVals[16],lineVals[18],lineVals[20],lineVals[17],type)


            } catch (e: Exception) {
                log.error(e) { "Error occurred during ${type} ${line}" }
            }
        }   
        

    }

}