package model

import com.squareup.moshi.Json
import java.util.*

/*
 * Search Results Model
 */
data class EncodeSearchResult(@Json(name = "@graph") val graph: List<SearchGraphEntry>)
data class SearchGraphEntry(val accession: String)

/*
 * Experiment Metadata Results Model
 */
data class EncodeExperiment(
        val accession: String,
        val award: Award,
        @Json(name = "biosample_ontology") val biosampleOntology: BiosampleOntology,
        val target: ExperimentTarget?,
        @Json(name = "date_released") val dateReleased: Date?,
        val replicates: List<Replicate>,
        val files: List<ExperimentFile>,
        @Json(name="biosample_summary") val biosampleSummary: String?,
        @Json(name="related_series") val relatedSeries: List<Treatment>?
)

data class Treatment( @Json(name="treatment_term_name")  val treatmentTermName: List<String> )

data class ExperimentTarget(val label: String,val investigated_as: List<String>)

data class BiosampleOntology(
        @Json(name = "term_name") val termName: String,
        @Json(name = "developmental_slims")  val developmental_slims: List<String>,
        @Json(name = "organ_slims")  val organ_slims: List<String>,
        @Json(name = "system_slims")  val system_slims: List<String>,
        @Json(name = "cell_slims")  val cell_slims: List<String>)

data class Award(val pi: PI?, val project: String)
data class PI(val title: String, val lab: Lab)
data class Lab(val name: String)

data class Replicate(val library: ReplicateLibrary,val libraries: List<ReplicateLibraries>?)
data class ReplicateLibrary(val biosample: ReplicateBiosample)
data class ReplicateLibraries(val biosample: ReplicateAppliedModifications)
data class ReplicateAppliedModifications(@Json(name = "applied_modifications") val appliedModifications:List<ReplicateIntroducedTags>?)
data class ReplicateIntroducedTags(@Json(name = "introduced_tags") val introducedTags:List<ReplicateIntroducedTagName>? )
data class ReplicateBiosample(val organism: ReplicateOrganism)
data class ReplicateIntroducedTagName(val name: String)
data class ReplicateOrganism(@Json(name = "scientific_name") val scientificName: String)

data class ExperimentFile(
        val accession: String?,
        val assembly: String?,
        val status: String,
        @Json(name = "file_type") val fileType: String,
        @Json(name = "output_type") val outputType: String,
        @Json(name = "run_type") val runType: String?,
        @Json(name = "paired_end") val pairedEnd: String?,
        @Json(name = "technical_replicates") val technicalReplicates: List<String>,
        @Json(name = "biological_replicates") val biologicalReplicates: List<String>,
        @Json(name = "cloud_metadata") val cloudMetadata: CloudMetadata?
)

data class CloudMetadata(val url: String)

/*
 * Some helper functions
 */
fun ExperimentFile.isReleased() = status.toLowerCase() == "released"
fun ExperimentFile.isArchived() = status.toLowerCase() == "archived"
fun ExperimentFile.isSequenceRead() = fileType.toLowerCase() == "fastq" && outputType.toLowerCase() == "reads"
fun ExperimentFile.isUnfilteredAlignment() = fileType.toLowerCase() == "bam" && outputType.toLowerCase() == "unfiltered alignments"
fun ExperimentFile.isFilteredAlignment() = fileType.toLowerCase() == "bam" && outputType.toLowerCase() == "alignments"
fun ExperimentFile.isUnreplicatedPeaks() = fileType.toLowerCase() == "bed narrowpeak" && (outputType.toLowerCase() == "peaks" ||
        outputType.toLowerCase() == "peaks and background as input for idr")
fun ExperimentFile.isBigBedUnreplicatedPeaks() = fileType.toLowerCase() == "bigbed narrowpeak" && (outputType.toLowerCase() == "peaks" ||
        outputType.toLowerCase() == "peaks and background as input for idr")        
fun ExperimentFile.isReplicatedPeaks() = fileType.toLowerCase() == "bed narrowpeak" &&
        (outputType.toLowerCase() == "replicated peaks" || outputType.toLowerCase() == "optimal idr thresholded peaks" || outputType.toLowerCase() == "pseudoreplicated idr thresholded peaks" )
fun ExperimentFile.isBigBedReplicatedPeaks() = fileType.toLowerCase() == "bigbed narrowpeak" &&
        (outputType.toLowerCase() == "replicated peaks" || outputType.toLowerCase() == "optimal idr thresholded peaks" || outputType.toLowerCase() == "pseudoreplicated idr thresholded peaks" )        
fun ExperimentFile.isDnaseSeqNormalizedSignal() = fileType.toLowerCase() == "bigwig"
fun ExperimentFile.isChipSeqNormalizedSignal() = fileType.toLowerCase() == "bigwig" && outputType.toLowerCase() == "fold change over control"
fun ExperimentFile.isAtacSeqNormalizedSignal() = fileType.toLowerCase() == "bigwig" && outputType.toLowerCase() == "signal of all reads"

fun ExperimentFile.biorep() = if (this.biologicalReplicates.isNotEmpty())
    this.biologicalReplicates[0] else null
fun ExperimentFile.techrep() = if (this.technicalReplicates.isNotEmpty())
    this.technicalReplicates[0].split("_")[1] else null

