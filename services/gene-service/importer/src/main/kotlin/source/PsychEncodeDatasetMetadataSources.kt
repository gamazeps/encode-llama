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

class PsychEncodeDatasetMetadataHttpSource(private val psychencodeUrl: String) : PsychEncodeDatasetMetadataSource {
    override fun import(sink: PsychEncodeDatasetMetadataSink) {
        log.info { "Beginning Psych Encode HTTP Metadata Import" }
        val fileDownloadRequest = Request.Builder().url(psychencodeUrl).get().build()
        val downloadInputStream = http.newCall(fileDownloadRequest).execute().body()!!.byteStream()
        importMetadata(sink, downloadInputStream)
        log.info { "Psych Encode HTTP Metadata Import Complete!" }
    }
}

class PsychEncodeDatasetMetadataFileSource(private val file: File) : PsychEncodeDatasetMetadataSource {
    override fun import(sink: PsychEncodeDatasetMetadataSink) {
        log.info { "Beginning Psych Encode File Metadata Import" }
        importMetadata(sink, file.inputStream())
        log.info { "Psych Encode File Metadata Import Complete!" }
    }
}

private fun importMetadata(sink: PsychEncodeDatasetMetadataSink, inputStream: InputStream) {
    val reader = BufferedReader(InputStreamReader(inputStream))
    reader.readLine() // Skip first line

    reader.forEachLine { line ->
        val lineVals = line.replace("\"","").split("\t")

        try {

            val row_id = lineVals[0].toInt();
            val row_version = lineVals[1].toInt();
            val study = if(lineVals[2]!="") lineVals[2] else null
            val individualID = if(lineVals[3]!="") lineVals[3] else null
            val individualIDSource = if(lineVals[4]!="") lineVals[4] else null
            val diagnosis = if(lineVals[5]!="") lineVals[5] else null
            val sex = if(lineVals[6]!="") lineVals[6] else null
            val ethnicity = if(lineVals[7]!="") lineVals[7] else null

            var ageDeath: Float? = null
            var fetal: Boolean? = null
            val rawAgeDeath = lineVals[8]
            if(rawAgeDeath.contains("PCW",true) || rawAgeDeath.contains("gestation weeks")) {
                ageDeath = rawAgeDeath.split(" ")[0].toFloat()
                fetal = true
            } else if(rawAgeDeath.contains("days",true)) {
                ageDeath = rawAgeDeath.split("days")[0].trim().toFloat()/365
                fetal = false
            } else if(rawAgeDeath.contains("+",true)) {
                ageDeath = rawAgeDeath.split("+")[0].trim().toFloat()
                fetal = false
            } else if(rawAgeDeath.contains("-",true)) {
                ageDeath = ((rawAgeDeath.toFloat() + 0.75) * 52).toFloat()
                fetal = true
            } else if (rawAgeDeath.matches("\\d+w\\d+d".toRegex())) {
                val split = rawAgeDeath.split("w", "d")
                ageDeath = split[0].toFloat() + (split[1].toFloat() / 7)
                fetal = true
            } else if (rawAgeDeath.isNotBlank()) {
                ageDeath = rawAgeDeath.toFloat()
                fetal = false
            }

            val ageOnset = if(lineVals[9]!="") lineVals[9] else null
            val yearAutopsy = if(lineVals[10]!="") lineVals[10] else null
            val causeDeath = if(lineVals[11]!="") lineVals[11] else null
            val brainWeight = if(lineVals[12]!="") lineVals[12] else null
            val height = if(lineVals[13]!="") lineVals[13] else null
            val weight = if(lineVals[14]!="") lineVals[14] else null
            val ageBiopsy = if(lineVals[15]!="") lineVals[15] else null
            val smellTestScore = if(lineVals[16]!="") lineVals[16] else null
            val smoker = if(lineVals[17]!="") lineVals[17] else null
            val notes = if(lineVals[18]!="") lineVals[18] else null
            val Capstone_4 = if(lineVals[19]!="") lineVals[19].toBoolean() else null

            sink.writeDatasets(row_id, row_version, study, individualID, individualIDSource, diagnosis, sex, ethnicity,
                    ageDeath, fetal, ageOnset, yearAutopsy, causeDeath, brainWeight, height,
                    weight, ageBiopsy, smellTestScore, smoker, notes, Capstone_4)

        } catch (e: Exception) {
            log.error(e) { "Error occurred during $lineVals" }
        }
    }
}