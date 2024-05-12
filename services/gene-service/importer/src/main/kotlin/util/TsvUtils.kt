package util

import java.io.InputStream


/**
 * Utility function for reading TSVs. Iterates through lines in the given stream and provides a Map of
 * header keys (in lower case) to values for each.
 */
fun readTsv(inputStream: InputStream, handleLine: (line: Map<String, String>) -> Unit) {
    var headers: List<String>? = null
    var isFirstLine = true
    inputStream.reader().forEachLine { rawLine: String ->
        val splitLine = rawLine.split("\t")
        if (isFirstLine) {
            headers = splitLine.map { it.toLowerCase() }
            isFirstLine = false
            return@forEachLine
        }

        val tsvMap = mutableMapOf<String, String>()
        splitLine.forEachIndexed { i, s ->
            val header = headers!![i]
            tsvMap[header] = s
        }
        handleLine(tsvMap)
    }
}