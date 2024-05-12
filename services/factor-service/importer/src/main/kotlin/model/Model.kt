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
        val files: List<ExperimentFile>
)

data class Modifications(
        val amino_acid_code: String?,
        val position: Int?,
        val modification: String?
)
data class ModificationsGenes(
        val status: String?,
        val name: String?,
        val title: String?,
        val geneid: String?,
        val symbol: String?,
        val synonyms: List<String>?,
        val targets: List<String>?
)

data class ModificationData(
        val symbol: String?,
        val status: String?,
        val name: String?,
        val title: String?,
        val geneid: String?,
        val synonyms: List<String>?,
        val modification: List<Modifications>?
)
data class EncodeTarget(
        val title: String?,
        val name: String?,
        val genes:List<ModificationsGenes>?,
        val modifications: List<Modifications>?

)
data class ExperimentTarget(val label: String,val investigated_as: List<String>)

data class BiosampleOntology(@Json(name = "term_name") val termName: String)

data class Award(val pi: PI?, val project: String)
data class PI(val title: String, val lab: Lab)
data class Lab(val name: String)

data class Replicate(val library: ReplicateLibrary)
data class ReplicateLibrary(val biosample: ReplicateBiosample)
data class ReplicateBiosample(val organism: ReplicateOrganism)
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

data class tfsccbr_data(
        val ensembl_id: String,
        val name: String,
        val dbd: String,
        val isTF: Boolean
)
data class WikiSummary(val extract: String?,val type: String?)
data class WikiImage(val items: List<WikiImageUrls>? )
data class WikiImageUrls(val original: source? )
data class source(val source:String?)
data class hgnc_data(
        val hgnc_id: String,
        val symbol: String,
        val name: String,
        val uniprot_ids: List<String>?,
        val locus_type: String,
        val prev_symbol: List<String>?,
        val prev_name: List<String>?,
        val location: String,
        val entrez_id: String,
        val gene_group: List<String>?,
        val gene_group_id: List<String>?,
        val ccds_id: List<String>?,
        val locus_group: String,
        val alias_symbol: List<String>?

)
data class hgncResponse(
        val response: hgnc_docs
)
data class hgnc_docs(
        val docs: List<hgnc_data>?
)
data class external_db_info(
        val dbname: String,
        val primary_id: String,
        val db_display_name: String,
        val synonyms: List<String>?

)
data class Ensemble_Gene_Info(
        var description: String? ="",
        var biotype: String? ="",
        var display_name: String?="",
        var id: String? ="",
        var version: String? = "",
        var hgnc_primary_id: String?="",
        var hgnc_synonyms: List<String>? = null,
        var uniprot_synonyms: List<String>? = null,
        var uniprot_primary_id: String? =null,
        var ccds_id: List<String>? = null
)

