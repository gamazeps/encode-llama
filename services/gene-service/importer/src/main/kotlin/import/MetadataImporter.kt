package import

import Importer
import util.*
import mu.KotlinLogging
import java.io.Closeable
import javax.sql.DataSource

private val log = KotlinLogging.logger {}

class MetadataImporter(private val sources: List<MetadataSource>) : Importer {

    override fun import(dataSource: DataSource) {
        log.info { "Running metadata schema..." }
        executeSqlResource(dataSource, "schemas/encodemetadata.sql")
        MetadataSink(dataSource).use {sink ->
            for (source in sources) {
                source.import(sink)
            }
        }
        log.info { "Metadata import complete!" }
    }
}

interface MetadataSource {
    fun import(sink: MetadataSink)
}

private const val DATASETS_TABLE_DEF = "encode_datasets(accession, biosample, tissue, cell_compartment, lab_name, " +
        "lab_friendly_name, assay_term_name, biosample_type)"
private const val SIGNAL_FILES_TABLE_DEF = "encode_signal_files(accession, dataset_accession, assembly, biorep, techrep, " +
        "strand, unique_reads)"
private const val GENE_QUANTIFICATION_FILES_TABLE_DEF = "encode_gene_quantification_files(accession, dataset_accession, assembly, biorep, techrep)"
private const val TRANSCRIPT_QUANTIFICATION_FILES_TABLE_DEF = "encode_transcript_quantification_files(accession, dataset_accession, assembly, biorep, techrep)"

class MetadataSink(dataSource: DataSource): Closeable {

    private val datasetsOut = CopyValueWriter(dataSource, DATASETS_TABLE_DEF)
    private val signalFilesOut = CopyValueWriter(dataSource, SIGNAL_FILES_TABLE_DEF)
    private val genequantificationFilesOut = CopyValueWriter(dataSource, GENE_QUANTIFICATION_FILES_TABLE_DEF)
    private val transcriptquantificationFilesOut = CopyValueWriter(dataSource, TRANSCRIPT_QUANTIFICATION_FILES_TABLE_DEF)

    fun dataset(accession: String, biosample: String, tissue: String?, cellCompartment: String?, labName: String?,
                labFriendlyName: String?, assayTermName: String?, biosampleType: String?) =
        datasetsOut.write(accession, biosample, tissue, cellCompartment, labName, labFriendlyName, assayTermName, biosampleType)

    fun signalFile(accession: String, datasetAccession: String, assembly: String, biorep: String?, techrep: String?,
                   strand: Char, uniqueReads: Boolean) =
        signalFilesOut.write(accession, datasetAccession, assembly, biorep, techrep, strand.toString(), uniqueReads.toString())

    fun genequantificationFile(accession: String, datasetAccession: String, assembly: String, biorep: String?, techrep: String?) =
            genequantificationFilesOut.write(accession, datasetAccession, assembly, biorep, techrep)

    fun transcriptquantificationFile(accession: String, datasetAccession: String, assembly: String, biorep: String?, techrep: String?) =
            transcriptquantificationFilesOut.write(accession, datasetAccession, assembly, biorep, techrep)

    override fun close() {
        datasetsOut.close()
        signalFilesOut.close()
        genequantificationFilesOut.close()
        transcriptquantificationFilesOut.close()
    }
}