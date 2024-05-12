package source

import import.*
import model.*
import util.*
import mu.KotlinLogging
import java.io.File

private val log = KotlinLogging.logger {}

class EncodeHttpMetadataSource(private val speciesList: List<String>,
                               private val searchTerm: String,
                               private val encodeApiParallelism: Int,
                               private val encodeBaseUrl: String = ENCODE_BASE_URL): MetadataSource {

    override fun import(sink: MetadataSink) {
        log.info { "Beginning Encode HTTP ${searchTerm} Metadata Import" }
        for (species in speciesList) {
            log.info { "${searchTerm} - Searching ENCODE for $species experiments" }
            val searchResult = requestEncodeSearch(encodeBaseUrl, species, searchTerm)
            log.info { "${searchTerm} - ENCODE $species search complete. ${searchResult.graph.size} results found." }

            val experimentAccessions = searchResult.graph.map { it.accession }
            runParallel("ENCODE Experiment Metadata Import", experimentAccessions, encodeApiParallelism) {
                writeExperimentToDb(requestEncodeExperiment(encodeBaseUrl, it), sink,searchTerm)
            }
        }
    }
}

class EncodeFileMetadataSource(private val files: List<File>, private val searchTerm: String): MetadataSource {
    override fun import(sink: MetadataSink) {
        log.info { "Beginning ENCODE ${searchTerm} Metadata File Import" }
        for (file in files) {
            log.info { "Importing ENCODE ${searchTerm} Metadata from file $file" }
            writeExperimentToDb(readEncodeExperimentFile(file), sink,searchTerm)
        }
    }
}

private fun writeExperimentToDb(experiment: EncodeExperiment, sink: MetadataSink, searchTerm: String) {
    var target = experiment.target?.label
    var treatment:String? = null
    var biosampleSummary:String? = experiment.biosampleSummary
    if(!experiment.relatedSeries.isNullOrEmpty())
    {
        if(!experiment.relatedSeries!![0].treatmentTermName.isNullOrEmpty())
        {
            treatment = experiment.relatedSeries!![0].treatmentTermName!![0]
            log.info { "treatment: ${experiment.relatedSeries!![0].treatmentTermName!![0]}" }
        }
    }
    if(!experiment.replicates[0].libraries.isNullOrEmpty())
    {
        if(!experiment.replicates[0].libraries!![0].biosample.appliedModifications.isNullOrEmpty())
        {
            if(!experiment.replicates[0].libraries!![0].biosample.appliedModifications!![0].introducedTags.isNullOrEmpty())
            {
                log.info { "accession: ${experiment.accession},target: ${experiment.target?.label},introduced_tags: ${experiment.replicates[0].libraries!![0].biosample.appliedModifications!![0].introducedTags!![0].name}" }
                if(target!==null)
                {
                    target = experiment.replicates[0].libraries!![0].biosample.appliedModifications!![0].introducedTags!![0].name+"-"+ target
                }

            }
        }


    }

    sink.dataset(
            accession = experiment.accession,
            target = target,
            released = experiment.dateReleased,
            project = experiment.award.project,
            source = "ENCODE",
            biosample = experiment.biosampleOntology.termName,
            labName = experiment.award.pi?.lab?.name,
            labFriendlyName = experiment.award.pi?.title,
            species = experiment.replicates[0].library.biosample.organism.scientificName,       
            investigated_as = experiment.target?.investigated_as,
            isTreated = if(treatment!==null) true else false,
            biosample_summary = biosampleSummary,
            developmental_slims = experiment.biosampleOntology.developmental_slims,
            cell_slims = experiment.biosampleOntology.cell_slims,
            organ_slims = experiment.biosampleOntology.organ_slims,
            system_slims = experiment.biosampleOntology.system_slims
    )


    for (file in experiment.files) {
        if (!file.isReleased()) {
            if (!file.isArchived()) {
                continue
            }
        }
        if (file.isSequenceRead()) {
            sink.sequenceReads(
                accession = file.accession!!,
                datasetAccession = experiment.accession,
                biorep = file.biorep(),
                techRep = file.techrep(),
                pairedEnd = file.runType == "paired-end",
                readId = if (file.runType == "paired-end") file.pairedEnd!! else "0",
                archived = file.isArchived(),
                url = file.cloudMetadata?.url
            )
        }
        if (file.isUnfilteredAlignment()) {
            sink.unfilteredAlignment(file.accession!!, experiment.accession, file.assembly!!, file.biorep(), file.techrep(), file.isArchived(), file.cloudMetadata?.url)
        }
        if (file.isFilteredAlignment()) {
            sink.filteredAlignment(file.accession!!, experiment.accession, file.assembly!!, file.biorep(), file.techrep(), file.isArchived(), file.cloudMetadata?.url)
        }
        if (file.isUnreplicatedPeaks()) {
            sink.unreplicatedPeaksOut(file.accession!!, experiment.accession, file.assembly!!, file.biorep(), file.techrep(), file.isArchived(), file.cloudMetadata?.url)
        }
        if(file.isBigBedUnreplicatedPeaks()) {
            sink.bigbedunreplicatedPeaks(file.accession!!, experiment.accession, file.assembly!!, file.biorep(), file.techrep(), file.isArchived(), file.cloudMetadata?.url)   
        }
        if (file.isReplicatedPeaks()) {
            sink.replicatedPeaksOut(file.accession!!, experiment.accession, file.assembly!!, file.isArchived(), file.cloudMetadata?.url)
        }
        if(file.isBigBedReplicatedPeaks()) {
            sink.bigbedreplicatedPeaks(file.accession!!, experiment.accession, file.assembly!!, file.isArchived(), file.cloudMetadata?.url)   
        }
        if (file.isDnaseSeqNormalizedSignal() && experiment.replicates.size == file.technicalReplicates.size && searchTerm.equals("dnase-seq",true))
        {
            sink.normalizedSignalsOut(file.accession!!, experiment.accession, file.assembly!!, file.biorep(), file.techrep(), file.isArchived(), file.cloudMetadata?.url)
        }
        if (file.isChipSeqNormalizedSignal() && experiment.replicates.size == file.technicalReplicates.size && file.biologicalReplicates.size > 1 && searchTerm.equals("chip-seq",true))
        {
            sink.normalizedSignalsOut(file.accession!!, experiment.accession, file.assembly!!, file.biorep(), file.techrep(), file.isArchived(), file.cloudMetadata?.url)
        }
        if (file.isAtacSeqNormalizedSignal() && experiment.replicates.size == file.technicalReplicates.size && searchTerm.equals("atac-seq",true))
        {
            sink.normalizedSignalsOut(file.accession!!, experiment.accession, file.assembly!!, file.biorep(), file.techrep(), file.isArchived(), file.cloudMetadata?.url)
        }

    }

}