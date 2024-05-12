package source

import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import import.CellTypeSink
import import.CellTypeSource
import model.*
import mu.KotlinLogging
import okhttp3.HttpUrl
import okhttp3.OkHttpClient
import okhttp3.Request
import util.*
import java.io.File
import java.util.concurrent.TimeUnit

private val http by lazy {
    OkHttpClient.Builder()
            .connectTimeout(600, TimeUnit.SECONDS)
            .readTimeout(600, TimeUnit.SECONDS)
            .build()
}
private val log = KotlinLogging.logger {}
private val moshi by lazy {
    Moshi.Builder()
            .add(KotlinJsonAdapterFactory())
            .build()
}
class HttpCelltypeSource(private val assemblies: Set<String>,
                               private val encodeApiParallelism: Int,
                               private val encodeBaseUrl: String = ENCODE_BASE_URL): CellTypeSource {

    override fun assemblies() = assemblies
    override fun import(assembly:String,sink: CellTypeSink) {
        val species: String = if(assembly.toLowerCase()=="grch38") "Homo sapiens" else "Mus musculus"

        val searchTerm =  "ChIP-seq"
        log.info { "Beginning Encode HTTP ${searchTerm} Metadata Import" }

            log.info { "${searchTerm} - Searching ENCODE for $species experiments" }
            val searchResult = requestEncodeSearch(encodeBaseUrl, species, searchTerm)
            log.info { "${searchTerm} - ENCODE $species search complete. ${searchResult.graph.size} results found." }

        var celltypes = mutableListOf<String>()
            val experimentAccessions = searchResult.graph.map { it.accession }
            runParallel("ENCODE Experiment Metadata Import", experimentAccessions, encodeApiParallelism) {
                val exp = requestEncodeExperiment(encodeBaseUrl, it)
                celltypes.add(exp.biosampleOntology.termName)
            }
        celltypes.distinct().forEach {
            writeExperimentToDb(it, sink)
        }

    }
}

class FileCelltypeSource(private val assembliesToFiles: Map<String, List<File>>): CellTypeSource {

    override fun assemblies() = assembliesToFiles.keys
    override fun import(assembly:String,sink: CellTypeSink) {
        log.info { "Beginning cell type desc Import " }
        val files = assembliesToFiles[assembly] ?: return
        var celltypes = mutableListOf<String>()

        for (file in files) 
        {
            val encodeExp = readEncodeExperimentFile(file)
            celltypes.add(encodeExp.biosampleOntology.termName)

        }
        celltypes.distinct().forEach {
            writeExperimentToDb(it, sink)
        }

    }
}
private fun writeExperimentToDb(celltype: String, sink: CellTypeSink) {
    val wiki_desc = getCTDetailsFromWikipedia(celltype)
    
    val ct_image_url = getCTImageFromWikipedia(celltype)
    sink.dataset(celltype.trim(),if(wiki_desc!==null) wiki_desc.replace("\t","").replace("\n","") else null,ct_image_url)
}
private fun getCTDetailsFromWikipedia(ct:String): String? {
    var ctsummary:String?
    val searchUrl = HttpUrl.parse("https://en.wikipedia.org/api/rest_v1/page/summary/${ct}")!!.newBuilder().build()
    val searchRequest = Request.Builder().header("Content-Type", "application/json").url(searchUrl).get().build()

    val searchResultString = http.newCall(searchRequest).execute().body()!!.string()
    val ctype = moshi.adapter(WikiSummary::class.java).fromJson(searchResultString)!!
    ctsummary = ctype.extract
    return if(ctype.type=="disambiguation") null else ctsummary
}
private fun getCTImageFromWikipedia(ct:String): String? {
    var ctImageUrl:String?
    val searchUrl = HttpUrl.parse("https://en.wikipedia.org/api/rest_v1/page/media/${ct}")!!.newBuilder().build()
    val searchRequest = Request.Builder().header("Content-Type", "application/json").url(searchUrl).get().build()

    val searchResultString = http.newCall(searchRequest).execute().body()!!.string()
    val ctype = moshi.adapter(WikiImage::class.java).fromJson(searchResultString)!!
    ctImageUrl = if(ctype.items!==null && ctype.items.size >0) ctype.items[0].original!!.source else null
    return  ctImageUrl
}