package import

import Importer
import util.*
import mu.KotlinLogging
import java.io.Closeable
import javax.sql.DataSource

private val log = KotlinLogging.logger {}

class PsychEncodeMetadataImporter(private val sources: List<PsychEncodeMetadataSource>) : Importer {

    override fun import(dataSource: DataSource) {
        log.info { "Running metadata schema..." }
        executeSqlResource(dataSource, "schemas/psychencodemetadata.sql")
        PsychEncodeMetadataSink(dataSource).use {sink ->
            for (source in sources) {
                source.import(sink)
            }
        }
        log.info { "Metadata import complete!" }
    }
}

interface PsychEncodeMetadataSource {
    fun import(sink: PsychEncodeMetadataSink)
}

private const val DATASETS_TABLE_DEF = """
    psychencode_datasets(
        individualID, specimenID, species, study, Contributor, grantid, assay, assaytarget, diagnosis,
        organ, tissue, BrodmannArea, tissueAbbr, cellType, hemisphere, PMI, pH, libraryPrep, RIN, platform, readLength,
        runType, freezeid, Clone, Passage, terminalDifferentiationPoint, notes, Capstone_4, Capstone_1, createdBy,
        accession, biosample, cell_compartment, lab_name, lab_friendly_name, assay_term_name, biosample_type
    )
"""

private const val GENES_FILES_TABLE_DEF = """
    psychencode_gene_quantification_files(
        row_id, row_version, row_etag, accession, name, fileFormat, isStranded, iPSC_intergrative_analysis,
        currentVersion, dataFileHandleId, dataset_accession, assembly, biorep, techrep
    )
"""

private const val TRANSCRIPT_FILES_TABLE_DEF = """
    psychencode_transcript_quantification_files (
        row_id, row_version, row_etag, accession, name, fileFormat, isStranded, iPSC_intergrative_analysis,
        currentVersion, dataFileHandleId, dataset_accession, assembly, biorep, techrep
    )
"""

private const val SORTED_BY_COORD_ALIGNMENTS_FILES_TABLE_DEF = """
    psychencode_sortedByCoord_alignments_files(
        row_id, row_version, row_etag, accession, name, fileFormat, isStranded, iPSC_intergrative_analysis,
        currentVersion, dataFileHandleId, dataset_accession
    )
"""

private const val TRANSCRIPTOME_ALIGNMENTS_FILES_TABLE_DEF = """
    psychencode_transcriptome_alignments_files(
        row_id, row_version, row_etag, accession, name, fileFormat, isStranded, iPSC_intergrative_analysis,
        currentVersion, dataFileHandleId, dataset_accession
    )
"""

private const val SIGNAL_FILES_TABLE_DEF = """
    psychencode_signal_files(
        row_id, row_version, row_etag, accession, name, fileFormat, isStranded, iPSC_intergrative_analysis,
        currentVersion, dataFileHandleId, dataset_accession, strand, assembly, biorep, techrep, unique_reads
    )
"""

class PsychEncodeMetadataSink(dataSource: DataSource): Closeable {

    private val datasetsOut = CopyValueWriter(dataSource, DATASETS_TABLE_DEF)
    private val genesFilesOut = CopyValueWriter(dataSource, GENES_FILES_TABLE_DEF)
    private val transcriptFilesOut = CopyValueWriter(dataSource, TRANSCRIPT_FILES_TABLE_DEF)
    private val signalFilesOut = CopyValueWriter(dataSource, SIGNAL_FILES_TABLE_DEF)
    private val sortedByCoordAlignmentsFilesOut = CopyValueWriter(dataSource, SORTED_BY_COORD_ALIGNMENTS_FILES_TABLE_DEF)
    private val transcriptomeAlignmentsFilesOut = CopyValueWriter(dataSource, TRANSCRIPTOME_ALIGNMENTS_FILES_TABLE_DEF)

    fun writeDatasets(individualID: String, specimenID: String, species: String, study: String, Contributor: String?,
                      grantid: String, assay: String, assaytarget: String?, diagnosis: String?, organ: String,
                      tissue: String, BrodmannArea: String?, tissueAbbr: String?, cellType: String?, hemisphere: String?,
                      PMI: Float?, pH: Float?, libraryPrep :String, RIN: Float?, platform: String, readLength: Int?,
                      runType: String, freezeid: String?, Clone: String?, Passage: String?,
                      terminalDifferentiationPoint: String?, notes: String?, Capstone_4: String?, Capstone_1: String?,
                      createdBy: Int?, accession: String?, biosample: String?, cell_compartment: String?, lab_name: String?,
                      lab_friendly_name: String?, assay_term_name: String?, biosample_type: String?) {
        datasetsOut.write(individualID, specimenID, species, study, Contributor, grantid, assay, assaytarget, diagnosis,
                          organ, tissue, BrodmannArea, tissueAbbr, cellType, hemisphere, PMI?.toString(), pH?.toString(),
                          libraryPrep, RIN?.toString(), platform, readLength?.toString(), runType, freezeid, Clone,
                          Passage, terminalDifferentiationPoint, notes, Capstone_4, Capstone_1, createdBy?.toString(),
                          accession, biosample, cell_compartment, lab_name, lab_friendly_name, assay_term_name,
                          biosample_type)
    }

    fun writeGenesFiles(ROW_ID: String, ROW_VERSION: Int, ROW_ETAG: String, id: String, name: String, fileFormat: String,
                        isStranded: Boolean?, iPSC_intergrative_analysis: Boolean?, currentVersion: Int?, dataFileHandleId: Int?,
                        parentId: String?, assembly: String, biorep: Int, techrep: Int) {
        genesFilesOut.write(ROW_ID, ROW_VERSION.toString(), ROW_ETAG, id, name, fileFormat, isStranded?.toString(),
                            iPSC_intergrative_analysis?.toString(), currentVersion?.toString(),
                            dataFileHandleId?.toString(), parentId, assembly, biorep.toString(), techrep.toString())
    }

    fun writeTranscriptFiles(ROW_ID: String, ROW_VERSION: Int, ROW_ETAG:String, id: String, name: String,
                             fileFormat: String, isStranded: Boolean?, iPSC_intergrative_analysis: Boolean?, currentVersion: Int?,
                             dataFileHandleId: Int?, parentId: String?, assembly: String, biorep: Int, techrep: Int) {
        transcriptFilesOut.write(ROW_ID, ROW_VERSION.toString(), ROW_ETAG, id, name, fileFormat, isStranded?.toString(),
                                 iPSC_intergrative_analysis?.toString(), currentVersion?.toString(),
                                 dataFileHandleId?.toString(), parentId, assembly, biorep.toString(), techrep.toString())
    }

    fun writeSignalFiles(ROW_ID: String, ROW_VERSION: Int, ROW_ETAG: String, id: String, name: String,
                         fileFormat: String, isStranded: Boolean?, iPSC_intergrative_analysis: Boolean?, currentVersion: Int?,
                         dataFileHandleId: Int?, parentId: String?, strand: Char, assembly: String, biorep: Int, techrep: Int, unique_reads: Boolean) {
        signalFilesOut.write(ROW_ID, ROW_VERSION.toString(), ROW_ETAG, id, name, fileFormat,  isStranded?.toString(),
                             iPSC_intergrative_analysis?.toString(), currentVersion?.toString(), dataFileHandleId?.toString(),
                             parentId,strand.toString(), assembly, biorep.toString(), techrep.toString(), unique_reads.toString())
    }

    fun writeSortedByCoordAlignmentsFiles(ROW_ID: String, ROW_VERSION: Int, ROW_ETAG: String, id: String, name: String,
                                            fileFormat: String, isStranded: Boolean?, iPSC_intergrative_analysis: Boolean?,
                                            currentVersion: Int?, dataFileHandleId: Int?, parentId: String?) {
        sortedByCoordAlignmentsFilesOut.write(ROW_ID, ROW_VERSION.toString(), ROW_ETAG, id, name,
                                                fileFormat,  isStranded?.toString(), iPSC_intergrative_analysis?.toString(),
                                                currentVersion?.toString(), dataFileHandleId?.toString(), parentId)
    }

    fun writeTranscriptomeAlignmentsFiles(ROW_ID: String, ROW_VERSION: Int, ROW_ETAG: String, id: String, name: String,
                                            fileFormat: String, isStranded: Boolean?, iPSC_intergrative_analysis: Boolean?,
                                            currentVersion: Int?, dataFileHandleId: Int?, parentId: String?) {
        transcriptomeAlignmentsFilesOut.write(ROW_ID, ROW_VERSION.toString(), ROW_ETAG, id, name,
                                                fileFormat, isStranded?.toString(), iPSC_intergrative_analysis?.toString(),
                                                currentVersion?.toString(), dataFileHandleId?.toString(), parentId)
    }

    override fun close()  {
        datasetsOut.close()
        genesFilesOut.close()
        transcriptFilesOut.close()
        sortedByCoordAlignmentsFilesOut.close()
        transcriptomeAlignmentsFilesOut.close()
        signalFilesOut.close()
    }

}