package source

import import.*
import model.*
import mu.KotlinLogging
import util.*
import java.io.File

import java.io.*
import java.util.zip.GZIPInputStream


private val log = KotlinLogging.logger {}
fun SingleCellfileNamePrefix(fileName: String) = fileName.split('.').first()


class SingleCellDiseaseBoxPlotFileSource(private val files: List<File>) : SingleCellDiseaseBoxPlotSource {
    override fun import(sink: SingleCellDiseaseBoxPlotSink) {
        log.info { "Beginning SingleCellDiseaseBoxPlot File Import" }
        for (file in files) {
            log.info { "Importing SingleCellDiseaseBoxPlot from file $file" }
            val fileName = SingleCellfileNamePrefix(file.getName())
            log.info { "file name is: $fileName" }
         
            val reader = BufferedReader(InputStreamReader(FileInputStream(file)))

            reader.readLine() // Skip first line of column header
            reader.forEachLine { line ->
                
                val lineValues = line.split("\t")
                //disease,gene,celltype,min,1quartile,median,3quartile, max,expr_frac,mean_count
                sink.write(fileName.split("-snRNAseq_processed_display")[0],lineValues[0],lineValues[1],lineValues[2],lineValues[3],lineValues[4],lineValues[5],lineValues[6],lineValues[7],lineValues[8])
                
            }
        }
    }
}

class GSSingleCellDiseaseBoxPlotSource(private val gsParentPath: GSDirectory) : SingleCellDiseaseBoxPlotSource {
    override fun import(sink: SingleCellDiseaseBoxPlotSink) {
        log.info { "Beginning SingleCellDiseaseBoxPlot GS File Import" }
        val allFiles = gsList(gsParentPath.bucket, gsParentPath.dirPath).filter {  !it.isDirectory && it.name.endsWith(".txt") }
        log.info { "allFiles size: ${allFiles.size}" }
        for (f in allFiles) {
            log.info { "Importing Single Cell Disease BoxPlot from file $f" }
            log.info { "file name is: ${f.name}" }
            val fileName = SingleCellfileNamePrefix(f.name.split("/").last())
            log.info { "fileName is: $fileName" }
            val ip = f.getContent().inputStream()
            val reader =  ip.bufferedReader() 

            val columns = reader.readLine() // Skip first line of column header
            log.info { "columns are: $columns" }


            reader.forEachLine { line ->
                val lineValues = line.split("\t")
                sink.write(fileName.split("-snRNAseq_processed_display")[0],lineValues[0],lineValues[1],lineValues[2],lineValues[3],lineValues[4],lineValues[5],lineValues[6],lineValues[7],lineValues[8])
                

            }
        }

    }
}
