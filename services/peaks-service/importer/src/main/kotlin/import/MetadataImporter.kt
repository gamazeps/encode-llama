package import

import Importer
import mu.KotlinLogging
import util.*
import java.io.Closeable
import java.util.*
import javax.sql.DataSource

private val log = KotlinLogging.logger {}


/**
 * Importer for experiment and processed file metadata.
 *
 * Steps:
 * - Runs initial schema creation for metadata tables
 * - Dumps data from given sources into metadata tables.
 */
class MetadataImporter(private val sources: List<MetadataSource>,private val searchTerm: String): Importer {

    override fun import(dataSource: DataSource) {
        log.info { "Running ${searchTerm} metadata schema..." }
        val searchTerm:String = searchTerm.toLowerCase()
        executeSqlResource(dataSource, "schemas/${searchTerm}-metadata.sql")
        MetadataSink(dataSource,searchTerm).use {sink ->
            for (source in sources) {
                source.import(sink)
            }
        }
        log.info { "${searchTerm} Metadata import complete!" }
    }
}

interface MetadataSource {
    fun import(sink: MetadataSink)
}
private fun datasetsTableDef(searchTerm: String) =  "${searchTerm}_datasets(accession, target, released, project, source, biosample, lab_name, lab_friendly_name, species, investigated_as, isTreated, biosample_summary, developmental_slims, cell_slims, organ_slims, system_slims)";
private fun sequenceReadsTableDef(searchTerm: String) = "${searchTerm}_sequence_reads(accession, dataset_accession, paired_end, read_id, biorep, techrep, archived, url)"
private fun unfilteredAlignmentsTableDef(searchTerm: String) = "${searchTerm}_unfiltered_alignments(accession, dataset_accession, assembly, biorep, techrep, archived, url)"
private fun filteredAlignmentsTableDef(searchTerm: String) = "${searchTerm}_filtered_alignments(accession, dataset_accession, assembly, biorep, techrep, archived, url)"
private fun unreplicatedPeaksTableDef(searchTerm: String) = "${searchTerm}_unreplicated_peaks(accession, dataset_accession, assembly, biorep, techrep, archived, url)"
private fun bigbedunreplicatedPeaksTableDef(searchTerm: String) = "${searchTerm}_bigbed_unreplicated_peaks(accession, dataset_accession, assembly, biorep, techrep, archived, url)"
private fun replicatedPeaksTableDef(searchTerm: String) = "${searchTerm}_replicated_peaks(accession, dataset_accession, assembly, archived, url)"
private fun bigbedreplicatedPeaksTableDef(searchTerm: String) = "${searchTerm}_bigbed_replicated_peaks(accession, dataset_accession, assembly, archived, url)"
private fun normalizedSignalLTableDef(searchTerm: String) = "${searchTerm}_normalized_signal(accession, dataset_accession, assembly, biorep, techrep, archived, url)"

class MetadataSink(dataSource: DataSource,searchTerm: String): Closeable {

    private val datasetsOut = CopyValueWriter(dataSource, datasetsTableDef(searchTerm.replace("-","_")))
    private val sequenceReadsOut = CopyValueWriter(dataSource, sequenceReadsTableDef(searchTerm.replace("-","_")))
    private val unfilteredAlignmentsOut = CopyValueWriter(dataSource, unfilteredAlignmentsTableDef(searchTerm.replace("-","_")))
    private val filteredAlignmentsOut = CopyValueWriter(dataSource, filteredAlignmentsTableDef(searchTerm.replace("-","_")))
    private val unreplicatedPeaksOut = CopyValueWriter(dataSource, unreplicatedPeaksTableDef(searchTerm.replace("-","_")))
    private val bigbedunreplicatedPeaksOut = CopyValueWriter(dataSource, bigbedunreplicatedPeaksTableDef(searchTerm.replace("-","_")))
    private val replicatedPeaksOut = CopyValueWriter(dataSource, replicatedPeaksTableDef(searchTerm.replace("-","_")))
    private val bigbedreplicatedPeaksOut = CopyValueWriter(dataSource, bigbedreplicatedPeaksTableDef(searchTerm.replace("-","_")))
    private val normalizedSignalsOut = CopyValueWriter(dataSource, normalizedSignalLTableDef(searchTerm.replace("-","_")))


    fun dataset(accession: String, target: String?, released: Date?, project: String, source: String, biosample: String,
                labName: String?, labFriendlyName: String?, species: String, investigated_as: List<String>?, isTreated: Boolean,
                biosample_summary: String?,  developmental_slims: List<String>?, cell_slims: List<String>?,organ_slims: List<String>?, system_slims: List<String>?) =
            datasetsOut.write(accession, target, released?.toDbDate(), project, source, biosample, labName, labFriendlyName, species, investigated_as?.toDbString(), isTreated.toString(), biosample_summary, developmental_slims?.toDbString(), cell_slims?.toDbString(), organ_slims?.toDbString(), system_slims?.toDbString())

    fun sequenceReads(accession: String, datasetAccession: String, pairedEnd: Boolean, readId: String,
                      biorep: String?, techRep: String?, archived: Boolean, url: String?) =
        sequenceReadsOut.write(accession, datasetAccession, pairedEnd.toString(), readId, biorep, techRep, archived.toString(), url)

    fun unfilteredAlignment(accession: String, datasetAccession: String, assembly: String, biorep: String?, techRep: String?, archived: Boolean, url: String?) =
        unfilteredAlignmentsOut.write(accession, datasetAccession, assembly, biorep, techRep, archived.toString(), url)

    fun filteredAlignment(accession: String, datasetAccession: String, assembly: String, biorep: String?, techRep: String?, archived: Boolean, url: String?) =
        filteredAlignmentsOut.write(accession, datasetAccession, assembly, biorep, techRep, archived.toString(), url)

    fun unreplicatedPeaksOut(accession: String, datasetAccession: String, assembly: String, biorep: String?, techRep: String?, archived: Boolean, url: String?) =
        unreplicatedPeaksOut.write(accession, datasetAccession, assembly, biorep, techRep, archived.toString(), url)
    
    fun bigbedunreplicatedPeaks(accession: String, datasetAccession: String, assembly: String, biorep: String?, techRep: String?, archived: Boolean, url: String?) =
        bigbedunreplicatedPeaksOut.write(accession, datasetAccession, assembly, biorep, techRep, archived.toString(), url)        

    fun replicatedPeaksOut(accession: String, datasetAccession: String, assembly: String, archived: Boolean, url: String?) =
        replicatedPeaksOut.write(accession, datasetAccession, assembly, archived.toString(), url)

    fun bigbedreplicatedPeaks(accession: String, datasetAccession: String, assembly: String, archived: Boolean, url: String?) =
        bigbedreplicatedPeaksOut.write(accession, datasetAccession, assembly, archived.toString(), url)        

    fun normalizedSignalsOut(accession: String, datasetAccession: String, assembly: String, biorep: String?, techRep: String?, archived: Boolean, url: String?) =
            normalizedSignalsOut.write(accession, datasetAccession, assembly, biorep, techRep, archived.toString(), url)

    override fun close() {
        datasetsOut.close()
        sequenceReadsOut.close()
        unfilteredAlignmentsOut.close()
        filteredAlignmentsOut.close()
        unreplicatedPeaksOut.close()
        replicatedPeaksOut.close()
        normalizedSignalsOut.close()
        bigbedunreplicatedPeaksOut.close()
        bigbedreplicatedPeaksOut.close()
    }

}
