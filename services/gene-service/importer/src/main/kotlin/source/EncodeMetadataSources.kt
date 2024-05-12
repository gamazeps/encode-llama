package source

import import.*
import model.*
import mu.KotlinLogging
import util.*
import java.io.File

private val log = KotlinLogging.logger {}

class EncodeMetadataHttpSource(private val assemblies: List<String>,
                               private val encodeApiParallelism: Int,
                               private val encodeBaseUrl: String = ENCODE_BASE_URL) : MetadataSource {

    override fun import(sink: MetadataSink) {
        if (assemblies.size == 0) return
        log.info { "Beginning Encode HTTP Metadata Import" }

        log.info { "Searching ENCODE for applicable experiments..." }
        val searchResult = requestEncodeSearch(encodeBaseUrl)
        log.info { "ENCODE search complete. ${searchResult.graph.size} results found." }

        val experimentAccessions = searchResult.graph.map { it.accession }
        runParallel("ENCODE Experiment Metadata Import", experimentAccessions, encodeApiParallelism) {
            val experiment = requestEncodeExperiment(encodeBaseUrl, it)

            // If none of the experiment's assemblies are the assemblies we want to import, skip this import.
            if (experiment.assembly.intersect(assemblies).isEmpty()) return@runParallel

            writeExperimentToDb(experiment, sink)
        }

        log.info { "Encode HTTP Metadata Import Complete!" }
    }
}

class EncodeMetadataFileSource(private val files: List<File>) : MetadataSource {

    override fun import(sink: MetadataSink) {
        log.info { "Beginning Encode File Metadata Import" }

        for (file in files) {
            writeExperimentToDb(readEncodeExperimentFile(file), sink)
        }

        log.info { "Encode File Metadata Import Complete!" }
    }
}

private fun writeExperimentToDb(experiment: EncodeExperiment, sink: MetadataSink) {
    var tissue = experiment.tissue()
    val biosampleSummary = experiment.biosampleSummary

    
    if(experiment.assembly.contains("GRCh38"))
    {
        log.info {"human assembly"}
        if(tissue.contains("blood vessel"))
        {
            tissue = "blood vessel"
        } else if(tissue.contains("blood"))
        {
            tissue = "blood"
        }else if(tissue.contains("brain"))
        {
            tissue = "brain"
        }else if(tissue.contains("large intestine"))
        {
            tissue = "large intestine"
        }else if(tissue.contains("kidney"))
        {
            tissue = "kidney"
        }else if(tissue.contains("musculature of body"))
        {
            tissue = "muscle"
        }else if(tissue.contains("skin of body"))
        {
            tissue = "skin"
        }else if(tissue.contains("small intestine"))
        {
            tissue = "small intestine"
        }else if(tissue.contains("ovary"))
        {
            tissue = "ovary"
        }else if(tissue.contains("mammary gland"))
        {
            tissue = "breast"
        }else if(tissue.contains("lung"))
        {
            tissue = "lung"
        }else if(tissue.contains("heart"))
        {
            tissue = "heart"
        }else if(tissue.contains("adipose"))
        {
            tissue = "adipose"
        }else if(tissue.contains("adrenal"))
        {
            tissue = "adrenal gland"
        }else if(tissue.contains("bone marrow"))
        {
            tissue = "bone marrow"
        }else if(tissue.contains("breast"))
        {
            tissue = "breast"
        }else if(tissue.contains("liver"))
        {
            tissue = "liver"
        }else if(tissue.contains("thymus"))
        {
            tissue = "thymus"
        }else if(tissue.contains("thyroid"))
        {
            tissue = "thyroid"
        }else if(tissue.contains("spleen"))
        {
            tissue = "spleen"
        }else if(tissue.contains("uterus"))
        {
            tissue = "uterus"
        }else if(tissue.contains("placenta"))
        {
            tissue = "placenta"
        }else if(tissue.contains("prostate"))
        {
            tissue = "prostate"
        }else if(tissue.contains("testis"))
        {
            tissue = "testis"
        }else if(tissue.contains("nerve"))
        {
            tissue = "nerve"
        }else if(biosampleSummary.contains("Peyer"))
        {
            tissue = "small intestine"
        }else if(tissue.contains("pancreas"))
        {
            tissue = "pancreas"
        }else if(tissue.contains("mouth"))
        {
            tissue = "mouth"
        }else if(tissue.contains("esophagus"))
        {
            tissue = "esophagus"
        }else if(tissue.contains("eye"))
        {
            tissue = "eye"
        }else if(tissue.contains("penis"))
        {
            tissue = "penis"
        }else if(tissue.contains("extraembryonic component"))
        {
            tissue = "embryo"
        }else if(tissue.contains("embryo"))
        {
            tissue = "embryo"
        }else if(biosampleSummary.contains("limb"))
        {
            tissue = "limb"
        }else if(tissue.contains("bone element"))
        {
            tissue = "bone"
        }else if(tissue.contains("nose"))
        {
            tissue = "nose"
        }else if(tissue.contains("connective tissue"))
        {
            tissue = "connective tissue"
        }

        if(tissue == "" || tissue == "NA")
        {
            log.info {" tissue: ${tissue}"}      
            if(biosampleSummary.contains("neur"))
            {
                tissue = "brain"
            }else if(biosampleSummary.contains("cardio"))
            {
                tissue = "heart"
            }else if(biosampleSummary.contains("T cell") || biosampleSummary.contains("helper") || biosampleSummary.contains("DOHH2") || biosampleSummary.contains("SU-DHL-6") )
            {
                tissue = "blood"
            }else if(biosampleSummary.contains("Calu3"))
            {
                tissue = "lung"
            }
        }

    }



    if(experiment.assembly.contains("mm10"))
    {
        log.info {" mouse assm"}   
        if(tissue.contains("thymus"))
        {
            tissue = "thymus"
        }else if(tissue.contains("blood"))
        {
            tissue = "blood"
        }else if(tissue.contains("liver"))
        {
            tissue = "liver"
        }else if(tissue.contains("spleen"))
        {
            tissue = "spleen"
        }else if(tissue.contains("musculature of body"))
        {
            tissue = "muscle"
        }else if(tissue.contains("testis"))
        {
            tissue = "testis"
        }else if(tissue.contains("small intestine"))
        {
            tissue = "small intestine"
        }else if(tissue.contains("ovary"))
        {
            tissue = "ovary"
        }else if(tissue.contains("bone marrow"))
        {
            tissue = "bone marrow"
        }else if(tissue.contains("placenta"))
        {
            tissue = "placenta"
        }else if(tissue.contains("epithelium"))
        {
            tissue = "epithelium"
        }else if(tissue.contains("connective tissue"))
        {
            tissue = "connective tissue"
        }else if(tissue.contains("adipose"))
        {
            tissue = "adipose"
        }else if(tissue.contains("adrenal"))
        {
            tissue = "adrenal gland"
        }else if(tissue.contains("large intestine"))
        {
            tissue = "large intestine"
        }
        if(tissue == "" || tissue == "NA")
        {
            log.info {" tissue: ${tissue}"}   
            if(biosampleSummary.contains("erythroid"))
            {
                tissue = "blood marrow"
            }else if(biosampleSummary.contains("cortex"))
            {
                tissue = "brain"
            }else if(biosampleSummary.contains("leukemia")  )
            {
                tissue = "blood marrow"
            }else if(biosampleSummary.contains("Muller"))
            {
                tissue = "eye"
            }
        }

    }
    sink.dataset(
            accession = experiment.accession,
            biosample = experiment.biosampleOntology.termName,
            tissue = tissue,
            cellCompartment = experiment.replicates[0].library.biosample.subcellularFractionTermName,
            labName = experiment.award.pi?.lab?.name ?: experiment.lab.name,
            labFriendlyName = experiment.award.pi?.title,
            assayTermName = experiment.assayTitle,
            biosampleType = experiment.biosampleOntology.classification)

    for (file in experiment.files) {
        if (!file.isReleased()) continue
        if (file.isSignal()) {
            sink.signalFile(file.accession!!, experiment.accession, file.assembly!!, file.biorep(), file.techrep(),
                    file.signalStrand(), file.isUniqueReads())
        }
        if (file.isQuantification() && file.isGeneQuantification() ) {
            if(experiment.assembly.contains("mm10") && file.latestMouseGenomeAnnotation())
            {
                sink.genequantificationFile(file.accession!!, experiment.accession, file.assembly!!, file.biorep(), file.techrep())
            } else if(experiment.assembly.contains("GRCh38") && file.latestHumanGenomeAnnotation()) {
                sink.genequantificationFile(file.accession!!, experiment.accession, file.assembly!!, file.biorep(), file.techrep())
            } else {
                log.info {" file accession: ${file.accession!!}, assem ${experiment.assembly}"}   
            }
            
        }
        if (file.isQuantification() && file.isTranscriptQuantification()) {
            if(experiment.assembly.contains("mm10") && file.latestMouseGenomeAnnotation()) {
                sink.transcriptquantificationFile(file.accession!!, experiment.accession, file.assembly!!, file.biorep(), file.techrep())
            } else if(experiment.assembly.contains("GRCh38") && file.latestHumanGenomeAnnotation()) {
                sink.transcriptquantificationFile(file.accession!!, experiment.accession, file.assembly!!, file.biorep(), file.techrep())
            } else {
                log.info {" file accession: ${file.accession!!}, assem ${experiment.assembly}"}   
            }
            
        }
    }
}