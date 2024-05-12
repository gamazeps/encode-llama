package source

import org.w3c.dom.Document
import org.w3c.dom.Element
import org.w3c.dom.Node
import org.w3c.dom.NodeList
import javax.xml.parsers.DocumentBuilderFactory
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import import.*
import model.*

import mu.KotlinLogging
import okhttp3.HttpUrl
import okhttp3.OkHttpClient
import okhttp3.Request
import org.xml.sax.InputSource
import java.io.File
import java.io.StringReader
import java.util.concurrent.TimeUnit
import java.util.zip.GZIPInputStream
import util.importFtp
import util.retry
import util.*

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.URL;
import java.net.URLEncoder;
import java.awt.Color

val hg19_EnsembleBaseUrl = "https://grch37.rest.ensembl.org/"
val EnsembleBaseUrl = "https://rest.ensembl.org/"
val NcbiBaseUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
val UniprotBaseUrl = "https://www.uniprot.org/"
val HgncBaseUrl ="http://rest.genenames.org/fetch/hgnc_id/"
val TfdbdUrl = "http://humantfs.ccbr.utoronto.ca/download/v_1.01/DatabaseExtract_v_1.01.csv"
val SERVICELOCATION = "https://www.rcsb.org/pdb/rest/search"

data class gene(
        val name: String? ,
        val gene_id: String? ,
        val chrom : String? ,
        val start: Int? ,
        val stop: Int?
)
private val moshi by lazy {
    Moshi.Builder()
            .add(KotlinJsonAdapterFactory())
            .build()
}
var hgncjsonAdapter = moshi.adapter(hgnc_data::class.java)
var ensemblejsonAdapter = moshi.adapter(Ensemble_Gene_Info::class.java)
var modjsonAdapter = moshi.adapter(ModificationData::class.java)

private val log = KotlinLogging.logger {}

private val http by lazy {
    OkHttpClient.Builder()
            .connectTimeout(600, TimeUnit.SECONDS)
            .readTimeout(600, TimeUnit.SECONDS)
            .build()
}

class Gff3FtpFactorSource(private val assembliesToFtpUrls: Map<String,List<String>>, private val encodeApiParallelism: Int) : FactorSource {

    override fun assemblies() = assembliesToFtpUrls.keys

    override fun import(assembly: String, sink: FactorSink) {
        val urls = assembliesToFtpUrls[assembly] ?: return
        log.info { "Beginning factor desc Import " }
        for (url in urls) {

            var genes = mutableListOf<gene>()

            importFtp(url) { inputStream ->
                GZIPInputStream(inputStream).reader().forEachLine { l ->
                    if (!l.startsWith("#")) {
                        
                        val cols = l.split("\t")
                        val chrom = cols[0]
                        val feature = cols[2]
                        val start = cols[3].toInt()
                        val stop = cols[4].toInt()
                        val rawAttributes = cols[8]
                        val attributes = rawAttributes.split(";")
                                .map { it.split("=") }
                                .associateBy({ it[0] }, { it[1] })
                        if (feature.toLowerCase() == "gene") {
                            val gene_id = attributes.getValue("gene_id")
                            val name = attributes["gene_name"]
                            genes.add(gene(name,gene_id,chrom,start,stop))
                        }
                    }
                }
            }
            log.info { "Done with fetching genes ${genes.size}" }

            val species: String = if(assembly.toLowerCase()=="grch38") "Homo sapiens" else "Mus musculus"
            val speciesType: String = if(assembly.toLowerCase()=="grch38") "human" else "mouse"
            val searchTerm =  "ChIP-seq"
            val encodeBaseUrl = ENCODE_BASE_URL
            var targets = mutableListOf<String>()

            var tfData = mutableListOf<tfsccbr_data>();
            val encodeApiParallelism = encodeApiParallelism
            log.info { "${searchTerm} - Searching ENCODE for $species experiments" }
            val searchResult = requestEncodeSearch(encodeBaseUrl, species, searchTerm)
            log.info { "${searchTerm} - ENCODE $species search complete. ${searchResult.graph.size} results found." }

            val experimentAccessions = searchResult.graph.map { it.accession }

            runParallel("ENCODE Experiment Metadata Import", experimentAccessions, encodeApiParallelism) {
                val encodeExp = requestEncodeExperiment(encodeBaseUrl, it)
                if (encodeExp.target !== null) targets.add(encodeExp.target.label) else log.info { "target null" }

            }

            log.info { "${targets.distinct().size}" }

            val u = URL(TfdbdUrl)
            val inps = getDBDs(u)
            val rd = BufferedReader(InputStreamReader(inps))
            var line=rd.readLine()
            while ((line)!=null)
            {
                line = rd.readLine()
                if(line!=null)
                {
                    val gn = line.split(",")[2]
                    targets.add(gn)

                    tfData.add(tfsccbr_data(line.split(",")[1],line.split(",")[2],
                            line.split(",")[3],
                            if(line.split(",")[4]=="Yes") true else false))
                }

            }
            rd.close()

            targets.distinct().forEach {
                var g:gene? = null
                var tf:tfsccbr_data?
               var gn = genes.find { ge -> ge.name!!.toLowerCase() == it.toLowerCase() }

                    tf = tfData.find { ge -> ge.name.toLowerCase() == it.toLowerCase() }
                    if(tf!=null)
                    {
                        if(gn!=null)
                        {
                            g = gene(tf.name, tf.ensembl_id, gn.chrom, gn.start, gn.stop)
                        } else {
                            g = gene(tf.name, tf.ensembl_id,null,null,null)
                        }
                    }


                val et = requestEncodeTarget(encodeBaseUrl,"${it}-${speciesType}")

                writeExperimentToDb(it,sink,assembly,if(et.modifications==null) null
                else ModificationData(et.genes!![0].symbol,et.genes[0].status,et.genes[0].name,et.genes[0].title,et.genes[0].geneid,et.genes[0].synonyms,et.modifications), g,tf)
            }
        }
    }
}

class Gff3FileFactorSource(private val assembliesToFiles: Map<String, List<File>>,private val encodefiles: List<File>,private val tfdbdfiles: List<File>): FactorSource {

    override fun assemblies() = assembliesToFiles.keys

    override fun import(assembly: String,sink: FactorSink) {
        log.info { "Beginning factor desc Import " }
        val files = assembliesToFiles[assembly] ?: return

        for (file in files) {
            var genes = mutableListOf<gene>()
            log.info { "Importing data from file $file" }
            val lines =  GZIPInputStream(file.inputStream()).reader().readLines()
            lines.forEach { l ->
                if (!l.startsWith("#")) {

                    val cols = l.split("\t")
                    val chrom = cols[0]
                    val feature = cols[2]
                    val start = cols[3].toInt()
                    val stop = cols[4].toInt()
                    val rawAttributes = cols[8]
                    val attributes = rawAttributes.split(";")
                            .map { it.split("=") }
                            .associateBy({ it[0] }, { it[1] })
                    if (feature.toLowerCase() == "gene") {
                        val gene_id = attributes.getValue("gene_id")
                        val name = attributes["gene_name"]
                        genes.add(gene(name,gene_id,chrom,start,stop))
                    }
                }
            }
            log.info { "Done with fetching genes ${genes.size}" }

            val speciesType: String = if(assembly.toLowerCase()=="grch38") "human" else "mouse"
            val searchTerm =  "ChIP-seq"
            val encodeBaseUrl = ENCODE_BASE_URL
            var targets = mutableListOf<String>()

            var tfData = mutableListOf<tfsccbr_data>();

            for (efile in encodefiles) {
                log.info { "Importing ENCODE ${searchTerm} Metadata from file $efile" }
                val encodeExp = readEncodeExperimentFile(efile)
                if (encodeExp.target !== null) targets.add(encodeExp.target.label)

            }
            for(tffile in tfdbdfiles)
            {
                val tflines =  tffile.inputStream().reader().readLines()
                tflines.forEach { line ->
                        val gn = line.split(",")[2]
                        targets.add(gn)
                        tfData.add(tfsccbr_data(line.split(",")[1],line.split(",")[2],
                                line.split(",")[3],
                                if(line.split(",")[4]=="Yes") true else false))
                }
            }
            log.info { "${targets.size}" }
            targets.distinct().forEach {
                var g:gene? = null
                var tf:tfsccbr_data?
                var gn = genes.find { ge -> ge.name!!.toLowerCase() == it.toLowerCase() }

                    tf = tfData.find { ge -> ge.name.toLowerCase() == it.toLowerCase() }
                    if(tf!=null)
                    {
                        if(gn!=null)
                        {	
                            g = gene(tf.name, tf.ensembl_id, gn.chrom, gn.start, gn.stop)
                        } else {	
                            g = gene(tf.name, tf.ensembl_id,null,null,null)
                        }
                    }

                val et = requestEncodeTarget(encodeBaseUrl,"${it}-${speciesType}")

                writeExperimentToDb(it,sink,assembly,if(et.modifications==null) null
                else ModificationData(et.genes!![0].symbol,et.genes[0].status,et.genes[0].name,et.genes[0].title,et.genes[0].geneid,et.genes[0].synonyms,et.modifications),
                g,tf)
            }

        }
    }
}


private fun getPdbIds(uniprot_pid: String):List<String>? {
    val xml = "<orgPdbCompositeQuery version=\"1.0\">" +

            " <queryRefinement>" +

            "  <queryRefinementLevel>0</queryRefinementLevel>" +

            "<orgPdbQuery>" +

            "<queryType>org.pdb.query.simple.UpAccessionIdQuery</queryType>" +

            "<description>Simple query for a list of Uniprot Accession IDs: ${uniprot_pid}</description>" +

            "<accessionIdList>${uniprot_pid}</accessionIdList>" +

            "</orgPdbQuery>" +
            " </queryRefinement>" +

            "</orgPdbCompositeQuery>"

    try {
        val pdbIds =postXmlQuery(xml);
        return pdbIds

    } catch (e:Exception){
        log.info { "failed uid is : ${uniprot_pid}" }
        log.info { "${e}" }
        return null
    }
}
private fun postXmlQuery(xml:String):List<String>
{
    val u = URL(SERVICELOCATION)
    val encodedXML = URLEncoder.encode(xml, "UTF-8")
    val inps = doPost(u,encodedXML)
    var pdbIds = mutableListOf<String>()
    val rd = BufferedReader(InputStreamReader(inps))
    var line=rd.readLine()
    while ((line)!=null){
        pdbIds.add(line)
        line = rd.readLine()
    }
    rd.close()
    return pdbIds

}

private fun doPost(url:URL,data:String): InputStream
{

    val conn =  url.openConnection()
    conn.setDoOutput(true)
    val wr  = retry("get pdb ids ",3) {
        OutputStreamWriter(conn.getOutputStream())
    }
    wr.write(data)
    wr.flush()
    return conn.getInputStream()


}
private fun getDBDs(url:URL): InputStream
{
    val conn =  url.openConnection()
    conn.setDoOutput(true)
    val wr  = retry("get pdb ids ",3) {
        OutputStreamWriter(conn.getOutputStream())
    }
    wr.flush()
    return conn.getInputStream()
}

private fun writeExperimentToDb(experiment: String,sink:FactorSink,assembly:String,modifications: ModificationData?, gene: gene?,tf:tfsccbr_data?) {

    if(gene!=null)
    {
        writeline(gene,tf,assembly,modifications,sink)
    } else {
        writeline(gene(experiment,null,null,null,null),tf,assembly,modifications,sink)
    }


}

private fun getFactorDetailsFromWikipedia(gene:String): String? {
    var tfsummary:String?
    val searchUrl = HttpUrl.parse("https://en.wikipedia.org/api/rest_v1/page/summary/${gene}")!!.newBuilder().build()
    val searchRequest = Request.Builder().header("Content-Type", "application/json").url(searchUrl).get().build()

    try {
        val searchResultString = http.newCall(searchRequest).execute().body()!!.string()
        val tf = moshi.adapter(WikiSummary::class.java).fromJson(searchResultString)!!
        tfsummary = tf.extract
        return if (tf.type == "disambiguation") null else tfsummary
    } catch (e:Exception)
    {
        log.info { "failed fetching wiki summary for $gene" }
        log.info { "exception ${e}" }
        return null
    }
}
private fun getExternalDBIdInfo(dbname:String,id:String,assembly: String):Array<external_db_info>? {
    log.info { "fetching ExternalDBIdInfo for ${id} and ${dbname}" }
    var externalDBInfo:Array<external_db_info>?
    var ensembleUrl = if(assembly.toLowerCase()=="hg19") hg19_EnsembleBaseUrl else EnsembleBaseUrl
    try {
        val searchUrl = HttpUrl.parse("${ensembleUrl}xrefs/id/${id}?external_db=${dbname}")!!.newBuilder().build()
        val searchRequest = Request.Builder().header("Content-Type", "application/json").url(searchUrl).get().build()
        val searchResultString = http.newCall(searchRequest).execute().body()!!.string()
        externalDBInfo = moshi.adapter(Array<external_db_info>::class.java).fromJson(searchResultString)!!
    } catch(e:Exception)
    {
        log.info { "failed fetching ExternalDBIdInfo for ${id} and ${dbname}" }
        log.info { "exception ${e}" }
        return null
    }
    return externalDBInfo
}

private fun getUniprotDesc(uniprot_pid:String):String {
    log.info { "fetching Uniprot desc for ${uniprot_pid}" }
    var uniprot_desc=""
    val xml_searchUrl = HttpUrl.parse("${UniprotBaseUrl}uniprot/${uniprot_pid}.xml")!!.newBuilder().build()
    val xml_searchRequest = Request.Builder().header("Content-Type", "application/xml").url(xml_searchUrl).get().build()
    val Response = http.newCall(xml_searchRequest).execute()
    if(Response.code()==200)
    {
        val xml_searchResultString = Response.body()!!.string()
        Response.close()
        try {
            val sr = StringReader(xml_searchResultString)
            val xmlDoc: Document = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(InputSource(sr))
            xmlDoc.documentElement.normalize()
            val nList: NodeList = xmlDoc.getElementsByTagName("comment")
            for (i in 0..nList.length - 1) {
                var commentNode: Node = nList.item(i)
                var b = commentNode as Element
                val f = b.getAttribute("type")
                if (f == "function") {
                    uniprot_desc = b.getElementsByTagName("text").item(0).textContent
                }
            }
        } catch (e: Exception){
            log.info { "uniprot failed for ${uniprot_pid}" }
            log.info { "exception ${e}" }
            return uniprot_desc
        }
    }
    return uniprot_desc
}

private fun getHgncDesc(hgncId:String):List<hgnc_data>?{
    var json:hgncResponse?
    log.info { "fetching hgnc desc for ${hgncId}" }

    try {
        val searchUrl = HttpUrl.parse("${HgncBaseUrl}${hgncId}")!!.newBuilder().build()


        val searchRequest = Request.Builder().header("Accept", "application/json").url(searchUrl).get().build()
        val searchResultString = retry("hgnc desc request", 3) {
            http.newCall(searchRequest).execute().body()!!.string()
        }
        json = moshi.adapter(hgncResponse::class.java).fromJson(searchResultString)!!
        if(json.response.docs.isNullOrEmpty())
        {
            return null
        }
    } catch (e:Exception){
        log.info { "failed fetching hgnc data for ${hgncId} " }
        log.info { "exception ${e}" }
        return null
    }
    return json.response.docs
}

private fun getEnsembleData(assembly: String,id:String):Ensemble_Gene_Info? {
    var ensembleUrl = if(assembly.toLowerCase()=="hg19") hg19_EnsembleBaseUrl else EnsembleBaseUrl
    var json:Ensemble_Gene_Info?
    try {
        val searchUrl = HttpUrl.parse("${ensembleUrl}lookup/id/${id}")!!.newBuilder().build()
        val searchRequest = Request.Builder().header("Content-Type", "application/json").url(searchUrl).get().build()
        val searchResultString = retry("Ensemble data request", 3) {
            http.newCall(searchRequest).execute().body()!!.string()
        }
        json = moshi.adapter(Ensemble_Gene_Info::class.java).fromJson(searchResultString)!!


    } catch (e:Exception){
        log.info { "Ensemble data fetch failed for ${id} " }
        log.info { "exception ${e}" }
        return null
    }
    return json
}
private fun getNCBISummary(id:String):String {
    log.info { "fetching ncbi desc for ${id}" }
    var ncbi_desc=""
    try {
    val xml_searchUrl = HttpUrl.parse("${NcbiBaseUrl}?db=gene&id=${id}")!!.newBuilder().build()
    val xml_searchRequest = Request.Builder().header("Content-Type", "application/xml").url(xml_searchUrl).get().build()

    val xml_searchResultString = retry("NCBI summary request", 3) {
        http.newCall(xml_searchRequest).execute().body()!!.string()
    }
    val sr = StringReader(xml_searchResultString)
        val xmlDoc: Document = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(InputSource(sr))
        xmlDoc.documentElement.normalize()
        val nList: NodeList = xmlDoc.getElementsByTagName("Summary")
        for (i in 0..nList.length - 1) {
            var summaryNode: Node = nList.item(i)
            var b = summaryNode as Element
            ncbi_desc  = b.textContent
        }
    } catch (e:Exception) {
        log.info { "failed for ncbi ${id}" }
        log.info { "exception ${e}" }
        return ncbi_desc
    }

    return ncbi_desc
}

private fun writeline(g:gene,tf:tfsccbr_data?,assembly: String,modifications: ModificationData?, sink: FactorSink) {
    val chrom = g.chrom
    val start = g.start
    val stop = g.stop
    val gene_id = g.gene_id
    val name = g.name
    val id = if(gene_id!==null) gene_id.split(".")[0] else null

    val wikifactor = getFactorDetailsFromWikipedia(name!!)

    var uniprot_pid = ""
    var uniprot_desc=""
    var pdbids=""
    var hgnc_pid = ""
    var ncbiData=""

    var ensembleData:Ensemble_Gene_Info?=null
    if(id!==null)
    {
        ensembleData =  getEnsembleData(assembly,id)
    }


    if(ensembleData==null)
    {
        ensembleData = Ensemble_Gene_Info(id= gene_id)
    } else {
        ensembleData.id = gene_id
    }

    var uniprot_db_json:Array<external_db_info>?= null
    // Fetching uniprot Id
    if(id!==null) {
         uniprot_db_json = getExternalDBIdInfo("Uniprot_gn", id, assembly)
    }
    if(!uniprot_db_json.isNullOrEmpty())
    {
        uniprot_pid = uniprot_db_json[0].primary_id
        ensembleData.uniprot_primary_id = uniprot_db_json[0].primary_id
        ensembleData.uniprot_synonyms = uniprot_db_json[0].synonyms
    }
    // Fetching hgnc Id
    var hgnc_db_json:Array<external_db_info>?= null
    if(id!==null) {
        hgnc_db_json = getExternalDBIdInfo("hgnc", id, assembly)
    }
    if(!hgnc_db_json.isNullOrEmpty())
    {
        hgnc_pid = if (hgnc_db_json[0].primary_id.contains("HGNC")) hgnc_db_json[0].primary_id else "HGNC:${hgnc_db_json[0].primary_id}"

        ensembleData.hgnc_primary_id = hgnc_pid
        ensembleData.hgnc_synonyms = hgnc_db_json[0].synonyms

    }
    var uid= ""
    var hgncData:List<hgnc_data>?=null
    if(hgnc_pid!="")
    {
        //Fetching hgnc data
        hgncData = getHgncDesc(hgnc_pid)
            if(!hgncData.isNullOrEmpty()) {
                //Fetching ncbi summary
                ncbiData = getNCBISummary(hgncData[0].entrez_id)
                val d = hgncData[0]
                uid = if (d.uniprot_ids.isNullOrEmpty()) "" else d.uniprot_ids[0]
                if (!uniprot_db_json.isNullOrEmpty() || uid != "") {
                    ensembleData.uniprot_primary_id = if (uid != "") uid else uniprot_pid
                }
                ensembleData.ccds_id = d.ccds_id
            }
    }
    if(uniprot_pid!="" || uid != "") {
        uniprot_desc = getUniprotDesc(if(uid!="") uid else uniprot_pid)
        val ids = getPdbIds(if(uid!="") uid else uniprot_pid)
        if(ids!=null) pdbids = ids.joinToString(",")
    }
    var hgncjson ="{}"
    var ensemblejson: String
    var modjson ="{}"
    var eid= ""
    var dbd = listOf<String>()
    var tfColor:String? = null
    var isTF:Boolean?= false
    if(tf!=null) {
        eid = tf.ensembl_id
        dbd = tf.dbd.split(";")
        if(dbd.size==1)
        {

            val color = Integer.toHexString(dbd[0].hashCode())
            tfColor = '#'+color
        }else {
            val c1 =  '#' + Integer.toHexString(dbd[0].hashCode())
            val c2 =  '#' + Integer.toHexString(dbd[1].hashCode())          
            val cl1 = if(c1.length > 6) c1.substring(0,7) else c1
            val cl2 = if(c2.length > 6) c2.substring(0,7) else c2           
            val c = blend(Color.decode(cl1),Color.decode(cl2))
            var hex = Integer.toHexString(c.getRGB() and 0xffffff)
            while(hex.length < 6){
                hex = "0" + hex;
            }
            tfColor = "#" + hex;
        }
        isTF = tf.isTF
    }
    if(!hgncData.isNullOrEmpty()) hgncjson  = hgncjsonAdapter.toJson(hgncData[0])
     ensemblejson = ensemblejsonAdapter.toJson(ensembleData)
    if(modifications!=null) modjson = modjsonAdapter.toJson(modifications)

    sink.factordesc(gene_id,chrom,start,stop,name,uniprot_desc,ncbiData,hgncjson,if(gene_id==null) "{}" else ensemblejson,modjson,pdbids, if(wikifactor!==null)
        wikifactor.replace("\t","").replace("\n","") else null,
            eid, dbd,isTF,tfColor)
}

private fun blend(c0: Color, c1: Color): Color {
    val totalAlpha = (c0.alpha + c1.alpha).toDouble()
    val weight0 = c0.alpha / totalAlpha
    val weight1 = c1.alpha / totalAlpha

    val r = weight0 * c0.red + weight1 * c1.red
    val g = weight0 * c0.green + weight1 * c1.green
    val b = weight0 * c0.blue + weight1 * c1.blue
    val a = Math.max(c0.alpha, c1.alpha).toDouble()

    return Color(r.toInt(), g.toInt(), b.toInt(), a.toInt())
}
