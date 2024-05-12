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

class PsychEncodeMetadataHttpSource(private val psychencodeUrl: String) : PsychEncodeMetadataSource {

    override fun import(sink: PsychEncodeMetadataSink) {
        log.info { "Beginning Psych Encode HTTP Metadata Import" }

        val fileDownloadRequest = Request.Builder().url(psychencodeUrl).get().build()
        val downloadInputStream = http.newCall(fileDownloadRequest).execute().body()!!.byteStream()
        importMetadata(sink, downloadInputStream)
    }
}

class PsychEncodeMetadataFileSource(private val file: File) : PsychEncodeMetadataSource {
    override fun import(sink: PsychEncodeMetadataSink) {
        log.info { "Beginning Psych Encode File Metadata Import" }
        importMetadata(sink, file.inputStream())
    }
}

private fun importMetadata(sink: PsychEncodeMetadataSink, inputStream: InputStream) {
    val reader = BufferedReader(InputStreamReader(inputStream))
    reader.readLine() // Skip first line

    reader.forEachLine { line ->
        val lineVals = line.replace("\"", "").split("\t")

        try {
            val rowId = lineVals[0];
            val rowVersion = lineVals[1].toInt();
            val fileId = lineVals[2].replace(" ", "");
            val name = lineVals[3].replace(" ", "");
            //val createdOn = lineVals[4];
            val createdBy = if (lineVals[5] != "") lineVals[5].toInt() else null;
            val etag = lineVals[6].replace(" ", "");
            val currentVersion = if (lineVals[7] != "") lineVals[7].toInt() else null;
            val grantId = lineVals[8].replace(" ", "");
            val study = lineVals[9].replace(" ", "");
            val assay = lineVals[10].replace(" ", "")
            val assayTarget = lineVals[11].replace(" ", "");
            val diagnosis = lineVals[12].replace(" ", "");
            val tissue = lineVals[13].replace(" ", "");
            val cellType = lineVals[14].replace(" ", "");
            val libraryPrep = lineVals[15].replace(" ", "");
            val fileFormat = lineVals[16].replace(" ", "");
            val brodmannArea = lineVals[17].replace(" ", "");
            val pmi = if (lineVals[18] != "") lineVals[18].toFloat() else null;
            val rin = if (lineVals[19] != "") lineVals[19].toFloat() else null;
            //val dataType = lineVals[20].replace(" ","");
            val hemisphere = lineVals[21].replace(" ", "");
            val invidualId = lineVals[22].replace(" ", "");
            val isStranded = if (lineVals[23] != "") lineVals[23].toBoolean() else null;
            val ph = if (lineVals[24] != "") lineVals[24].toFloat() else null;
            val platform = lineVals[25].replace(" ", "");
            val readLength = if (lineVals[26] != "") lineVals[26].toInt() else null;
            val runType = lineVals[27].replace(" ", "");
            val specimenId = lineVals[28].replace(" ", "");
            val tissueAbbr = lineVals[29].replace(" ", "");
            val freezeId = lineVals[30].replace(" ", "");
            val notes = lineVals[31].replace(" ", "");
            val cloneId = lineVals[32].replace(" ", "");
            val passageTD = lineVals[33].replace(" ", "");
            //val td =  lineVals[34].replace(" ","");
            val cellFraction =
                    if (lineVals[35] != "")
                        when {
                            lineVals[35] == "cell" -> null
                            lineVals[35] == "nuclei" -> "nucleus"
                            else -> lineVals[35].replace(" ", "")
                        }
                    else null
            val capstone4 = lineVals[36].replace(" ", "");
            val capstone1 = lineVals[37].replace(" ", "");
            val ipscIntergrativeAnalysis = if (lineVals[38] != "") lineVals[38].toBoolean() else null;
            val species = lineVals[39].replace(" ", "");
            //val pi = lineVals[40].replace(" ","");
            val organ = lineVals[41].replace(" ", "");
            //val consortium = lineVals[42].replace(" ","");
            val terminalDifferentiationPoint = lineVals[43].replace(" ", "");
            val parentId = specimenId + assay

            if (assay.equals("rnaSeq", true)) {
                when {
                    name.contains("genes", true) -> {
                        val genesAssay = if (lineVals[15].replace(" ", "").contains("polyAselection", true))
                            "polyA plus RNA-seq" else "total RNA-seq"
                        val accession = specimenId + assay
                        val bioSample = organ + specimenId + hemisphere
                        val assayTermName =
                                if (lineVals[15].contains("polyAselection", true)) "polyA plus RNA-seq"
                                else "total RNA-seq"
                        sink.writeDatasets(invidualId, specimenId, species, study, "PI", grantId,
                                genesAssay, assayTarget, diagnosis, organ, tissue, brodmannArea, tissueAbbr, cellType, hemisphere, pmi, ph, libraryPrep,
                                rin, platform, readLength, runType, freezeId, cloneId, passageTD, terminalDifferentiationPoint, notes, capstone4,
                                capstone1, createdBy, accession, bioSample, cellFraction, "PI", "PI", assayTermName, "tissue")
                        sink.writeGenesFiles(rowId, rowVersion, etag, fileId, name, fileFormat, isStranded,
                                ipscIntergrativeAnalysis, currentVersion, null, parentId,
                                "hg19", 1, 1)
                    }
                    name.contains("isoforms", true) -> {
                        log.info { "isoforms - $parentId" }
                        sink.writeTranscriptFiles(rowId, rowVersion, etag, fileId, name, fileFormat, isStranded,
                                ipscIntergrativeAnalysis, currentVersion, null, parentId,
                                "hg19", 1, 1)
                    }
                    name.contains("Aligned.sortedByCoord", true) && !name.contains("flagstat", true) -> {
                        log.info { "sortedByCoord - $parentId" }
                        sink.writeSortedByCoordAlignmentsFiles(rowId, rowVersion, etag, fileId, name, fileFormat, isStranded,
                                ipscIntergrativeAnalysis, currentVersion, null, parentId)
                    }
                    name.contains("Aligned.toTranscriptome", true) && !name.contains("flagstat", true) -> {
                        log.info { "toTranscriptome - $parentId" }
                        sink.writeTranscriptomeAlignmentsFiles(rowId, rowVersion, etag, fileId, name, fileFormat, isStranded,
                                ipscIntergrativeAnalysis, currentVersion, null, parentId)
                    }
                    name.contains("Signal", true) && !name.contains("UniqueMultiple", true) && !name.contains(".bg", true) -> {
                        log.info { "Signal - $parentId" }
                        val strand = name.split(".")[3].split("strand")[1].toCharArray()[0]
                        sink.writeSignalFiles(rowId, rowVersion, etag, fileId, name, fileFormat, isStranded,
                                ipscIntergrativeAnalysis, currentVersion, null, parentId,
                                strand, "hg19", 1, 1, true)
                    }
                }
            }

        } catch (e: Exception) {
            log.error(e) { "Error occurred during $lineVals" }
        }
    }
    log.info { "Psych Encode HTTP Metadata Import Complete!" }
}
