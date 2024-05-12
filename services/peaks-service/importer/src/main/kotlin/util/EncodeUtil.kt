package util

import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import model.*
import okhttp3.*
import java.io.File
import java.util.*
import java.util.concurrent.TimeUnit
import com.squareup.moshi.FromJson
import com.squareup.moshi.ToJson
import java.util.TimeZone
import java.text.SimpleDateFormat
import java.text.DateFormat
import java.text.ParseException



const val ENCODE_BASE_URL = "https://www.encodeproject.org/"
private val http by lazy {
    OkHttpClient.Builder()
            .connectTimeout(20, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .build()
}
private val moshi by lazy {
    Moshi.Builder()
            .add(KotlinJsonAdapterFactory())
            .add(customDateAdapter())
            .build()
}
class customDateAdapter {
    val dateFormat: DateFormat
    init {
        dateFormat = SimpleDateFormat("yyyy-MM-dd")
        dateFormat.timeZone = TimeZone.getTimeZone("GMT")
    }
    @ToJson
    @Synchronized
    fun dateToJson(d: Date): String {
        return dateFormat.format(d)
    }

    @FromJson
    @Synchronized
    @Throws(ParseException::class)
    fun dateToJson(s: String): Date {
        return dateFormat.parse(s)
    }
}

fun requestEncodeSearch(encodeBaseUrl: String, species: String,searchTerm: String,getHistoneData: Boolean = true): EncodeSearchResult {
    val searchUrl = HttpUrl.parse("$encodeBaseUrl/search/")!!.newBuilder()
            .addQueryParameter("type", "Experiment")
            .addQueryParameter("format", "json")
            .addQueryParameter("limit", "all")
            .addQueryParameter("replicates.library.biosample.donor.organism.scientific_name", species)
            .addQueryParameter("assay_title",if(searchTerm.toLowerCase()=="dnase-seq") "DNase-seq" else if(searchTerm.toLowerCase()=="atac-seq") "ATAC-seq" else "TF ChIP-seq" )
            .addQueryParameter("assay_title",if(searchTerm.toLowerCase()=="chip-seq" && getHistoneData) "Histone ChIP-seq" else "")
            .build()

    val searchRequest = Request.Builder().url(searchUrl).get().build()

    val searchResultString = http.newCall(searchRequest).execute().body()!!.string()
    return moshi.adapter(EncodeSearchResult::class.java).fromJson(searchResultString)!!
}

fun requestEncodeExperiment(encodeBaseUrl: String, accession: String): EncodeExperiment {
    val experimentUrl = HttpUrl.parse("$encodeBaseUrl/experiments/$accession/")!!.newBuilder()
            .addQueryParameter("format", "json")
            .build()
    val experimentRequest = Request.Builder().url(experimentUrl).get().build()
    val experimentResultString = retry("Experiment Request", 3) {
        http.newCall(experimentRequest).execute().body()!!.string()
    }
    return moshi.adapter(EncodeExperiment::class.java).fromJson(experimentResultString)!!
}

fun readEncodeExperimentFile(file: File): EncodeExperiment = moshi.adapter(EncodeExperiment::class.java).fromJson(file.readText())!!

