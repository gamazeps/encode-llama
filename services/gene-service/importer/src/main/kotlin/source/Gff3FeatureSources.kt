package source

import import.FeatureCommon
import import.FeatureSink
import import.FeatureSource
import mu.KotlinLogging
import util.importFtp
import java.io.File
import java.util.zip.GZIPInputStream


private val log = KotlinLogging.logger {}

class Gff3FileFeatureSource(private val assembliesToFiles: Map<String, List<File>>) : FeatureSource {

    override fun assemblies() = assembliesToFiles.keys

    override fun import(assembly: String, sink: FeatureSink) {
        val files = assembliesToFiles[assembly] ?: return
        for (file in files) {
            log.info { "Importing data from file $file" }
            GZIPInputStream(file.inputStream()).reader().forEachLine { line ->
                writeGffLine(line, sink)
            }
        }
    }
}

class Gff3FtpFeatureSource(private val assembliesToFtpUrls: Map<String, List<String>>) : FeatureSource {

    override fun assemblies() = assembliesToFtpUrls.keys

    override fun import(assembly: String, sink: FeatureSink) {
        val urls = assembliesToFtpUrls[assembly] ?: return
        for (url in urls) {
            importFtp(url) { inputStream ->
                GZIPInputStream(inputStream).reader().forEachLine { line ->
                    writeGffLine(line, sink)
                }
            }
        }
    }
}

private fun writeGffLine(line: String, sink: FeatureSink) {
    if (line.startsWith("#")) return
    val cols = line.split("\t")
    val chrom = cols[0]
    val project = cols[1]
    val feature = cols[2]
    val start = cols[3].toInt()
    val stop = cols[4].toInt()
    val score = if (cols[5] == ".") 0.0 else cols[5].toDouble()
    val strand = if (cols[6].length == 1) cols[6][0] else throw Exception("Invalid strand ${cols[6]}")
    val phase = if (cols[7] == ".") -1 else cols[7].toInt()
    val rawAttributes = cols[8]
    val attributes = rawAttributes.split(";")
            .map { it.split("=") }
            .associateBy({ it[0] }, { it[1] })

    val id = when (feature) {
        "gene" -> attributes.getValue("gene_id")
        "transcript" -> attributes.getValue("transcript_id")
        "exon" -> attributes.getValue("ID")
        "CDS", "three_prime_UTR", "five_prime_UTR" -> attributes.getValue("ID")
        else -> return
    }
    val idPrefix = when (feature) {
        "exon" -> id
        "gene", "transcript", "CDS", "three_prime_UTR", "five_prime_UTR" -> id.split(".")[0]
        else -> return
    }

    val common = FeatureCommon(id, idPrefix, chrom, start, stop, project, score, strand, phase)

    when (feature) {
        "gene" -> {
            val name = attributes["gene_name"]
            val geneType = attributes["gene_type"]
            val havanaId = attributes["havana_gene"]
            sink.writeGene(common, name, geneType, havanaId)
        }
        "transcript" -> {
            val name = attributes["transcript_name"]
            val transcriptType = attributes["transcript_type"]
            val havanaId = attributes["havana_transcript"]
            val supportLevel = with(attributes["transcript_support_level"]) { if (this == "NA") 0 else this?.toInt() }
            val tag = attributes["tag"]
            val parentGene = attributes["Parent"]
            sink.writeTranscript(common, name, transcriptType, havanaId, supportLevel, tag, parentGene)
        }
        "exon" -> {
            val name = attributes["exon_id"]
            val exonNumber = attributes["exon_number"]?.toInt()
            val parentTranscript = attributes["Parent"]
            sink.writeExon(common, name, exonNumber, parentTranscript)
        }
        "CDS" -> {
            val parentExon = attributes["exon_id"]
            val parentProtein = attributes["protein_id"]
            val tag = attributes["tag"]
            sink.writeCds(common, parentExon, parentProtein, tag)
        }
        "three_prime_UTR", "five_prime_UTR" -> {
            val direction = if (feature == "five_prime_UTR") 5 else 3
            val parentExon = attributes["exon_id"]
            val parentProtein = attributes["protein_id"]
            val tag = attributes["tag"]
            sink.writeUtr(common, direction, parentExon, parentProtein, tag)
        }
    }
}