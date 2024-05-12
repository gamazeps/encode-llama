import { DatasetSelectionParameters } from "./dataset";
import { PeaksSelectionParameters } from "./peaks/types";

export interface PeakCountParameters {
    assay: string;
    assembly: string;
}

/**
 * A genomic assembly.
 *
 * @prop name the name of the assembly.
 * @prop species the species to which the assembly belongs.
 */
export interface Assembly {
    name: string;
    species: string;
}

/**
 * Represents a lab.
 *
 * @prop name unique identifier for the lab, for example as used by ENCODE for namespacing.
 * @prop friendly_name a friendly display name for the lab.
 */
export interface Lab {
    name: string | null;
    friendly_name?: string;
}

/**
 * Represents a FASTQ file.
 *
 * @prop accession unique ID of the file, for example an ENCODE accession.
 * @prop paired_end true if from a paired-end run; false if from a single-end run.
 * @prop read_id if from a paired_end run, the end to which this file's reads belong.
 */
export interface Fastq {
    accession: string;
    paired_end: boolean;
    read_id?: number;
    biorep?: number;
    techrep?: number;
}

/**
 * Represents a BAM file.
 *
 * @prop accession unique ID of the file for example an ENCODE accession.
 * @prop assembly genome assembly to which this file's alignments map.
 * @prop biorep biological replicate number to which this file belongs.
 * @prop techrep technical replicate number to which this file belongs.
 */
export interface Bam {
    accession: string;
    assembly: Assembly;
    biorep?: number;
    techrep?: number;
}

/**
 * Represents a BigWig file.
 *
 * @prop accession unique ID of the file for example an ENCODE accession.
 * @prop assembly genome assembly to which this file's alignments map.
 * @prop biorep biological replicate number to which this file belongs.
 * @prop techrep technical replicate number to which this file belongs.
 */
export interface BigWig {
    accession: string;
    assembly: Assembly;
    biorep?: number;
    techrep?: number;
    url?: string;
}

/**
 * Represents a BED file.
 *
 * @prop accession unique ID of the file for example an ENCODE accession.
 * @prop assembly genome assembly to which this file's alignments map.
 * @prop biorep biological replicate number to which this file belongs.
 * @prop techrep technical replicate number to which this file belongs.
 */
export interface Bed {
    accession: string;
    assembly: Assembly;
    biorep?: number;
    techrep?: number;
}

/**
 * Contains all files associated with a dataset.
 *
 * @prop sequence_reads FASTQ files belonging to the experiment.
 * @prop unfiltered_alignments unfiltered BAMs belonging to the experiment.
 * @prop filtered_alignments filtered BAMs belonging to the experiment.
 * @prop unreplicated_peaks BED peak files belonging to a single replicate.
 * @prop replicated_peaks BED peak files derived from several replicates.
 */
export interface DatasetFileset {
    [key: string]: any[] | undefined;
    sequence_reads?: Fastq[];
    unfiltered_alignments?: Bam[];
    filtered_alignments?: Bam[];
    unreplicated_peaks?: Bed[];
    replicated_peaks?: Bed[];
    normalized_signal?: BigWig[];
}

/**
 * Represents a ChIP-seq experiment dataset.
 *
 * @prop accession unique ID of the dataset, for example an ENCODE accession.
 * @prop target the immunoprecipitation target, for example a TF or histone mark.
 * @prop released the date the experiment was made public.
 * @prop biosample cell type or tissue in which the experiment was performed.
 * @prop lab the lab which performed the experiment.
 * @prop species the name of the species in which the experiment was performed.
 */
export interface Dataset {
    accession: string;
    target: string | null;
    released?: Date;
    project: string;
    source: string;
    biosample: string;
    lab: Lab;
    species: string;
    assay: string;
    developmental_slims: string[],
    cell_slims: string[],
    organ_slims: string[],
    system_slims: string[]
}

/**
 * Represents the result of selecting a dataset row from the database.
 *
 * @prop accession unique identifier, for example an ENCODE ID.
 * @prop target ChIP target, for example a transcription factor or histone mark.
 * @prop released the date the experiment was made public.
 * @prop biosample the cell type or tissue in which the experiment was performed.
 * @prop lab_name unique identifier of the lab which performed the experiment.
 * @prop lab_friendly_name friendly display name of the lab which performed the experiment.
 * @prop species the name of the species in which the experiment was performed.
 */
export interface DatasetRow {
    accession: string;
    target: string;
    released: Date;
    project: string;
    source: string;
    biosample: string;
    lab_name: string;
    lab_friendly_name: string;
    species: string;
    assay: string;
    developmental_slims: string[],
    cell_slims: string[],
    organ_slims: string[],
    system_slims: string[]
    
}

/**
 * Represents the results of counting features of datasets, filtered by search criteria.
 *
 * @prop total the total number of results matching the criteria.
 * @prop targets the total number of targets matching the criteria.
 * @prop biosamples the total number of biosamples matching the criteria.
 * @prop species the total number of species matching the criteria.
 * @prop projects the total number of projects, for example ENCODE and Cistrome, matching.
 * @prop labs the total number of labs performing experiments matching the criteria.
 */
export interface DatasetCountRow {
    total: number;
    targets: number;
    biosamples: number;
    species: number;
    projects: number;
    labs: number;
}

/**
 * Represents a genomic assembly.
 *
 * @prop name the name of the assembly, for example hg19.
 * @prop species the species to which the assembly belongs.
 */
export interface AssemblyRow {
    name: string;
    species?: string;
    assay?: string;
    parameters?: DatasetSelectionParameters;
}

/**
 * Represents a species.
 *
 * @prop name the name of the species, for example human or mouse.
 */
export interface SpeciesRow {
    name: string;
    assay?: string;
    parameters?: DatasetSelectionParameters;
}

/**
 * Represents a ChIP target, for example a transcription factor or histone mark.
 *
 * @prop name the name of the target.
 */
export interface TargetRow {
    name: string;
    assay?: string;
    parameters?: DatasetSelectionParameters;
}

/**
 * Represents a biosample, for example a cell line or tissue.
 *
 * @prop name the name of the biosample.
 */
export interface BiosampleRow {
    name: string;
    species: string;
    assay?: string;
    parameters?: DatasetSelectionParameters;
}

export type DatasetFiles = {
    dataset: Dataset;
    assembly?: Assembly;
};

/**
 * Represents a sequence reads (FASTQ) file.
 *
 * @prop accession unique ID of the file, for example an ENCODE ID.
 * @prop paired_end true if the reads are paired-end; false if they are single-end.
 * @prop read_id if paired_end is true, represents the end ID of the reads in this file (1 or 2).
 * @prop biorep the biological replicate number of this file.
 * @prop techrep the technical replicate number of this file.
 */
export interface SequenceReadsRow {
    accession: string;
    paired_end: boolean;
    read_id?: number;
    biorep: number;
    techrep: number;
}

/**
 * Represents a replicated peaks file containing peaks from pooled replicates.
 *
 * @prop accession unique ID of the file, for example an ENCODE ID.
 * @prop assembly the genomic assembly to which the peaks are mapped.
 */
export interface ReplicatedPeaksRow {
    accession: string;
    assembly: string;
}

/**
 * Represents a count of experiments for a given biosample.
 *
 * @prop expcount the number of matching experiments in this biosample.
 * @prop name the name of the biosample.
 */
export interface BiosampleCountRow {
    name: string;
    species: string;
    expcount: number;
}

/**
 * Represents a count of experiments for a given target.
 *
 * @prop expcount the number of matching experiments for this target.
 * @prop name the name of the target.
 */
export interface TargetCountRow {
    expcount: number;
    name: string;
}

/**
 * Represents a count of experiments for a given species.
 *
 * @prop expcount the number of matching experiments for this species.
 * @prop name the name of the species.
 */
export interface SpeciesCountRow {
    expcount: number;
    name: string;
}

/**
 * Represents the result of selecting a single file from a single dataset.
 *
 * @prop datasetaccession the accession of the dataset.
 * @prop fileassembly the genomic assembly to which the file is mapped, or null if N/A.
 * @prop fileaccession accession of this file.
 * @prop paired_end for sequence_read files, true if paired end, false otherwise.
 * @prop read_id for paired end sequence_read files, the read ID.
 * @prop biorep the biological replicate of this file.
 * @prop techrep the technical replicate of this file.
 * @prop filetype string representing the type of file, for example filtered_alignments.
 */
export interface FileRow {
    datasetaccession: string;
    fileassembly: string | null;
    fileaccession: string;
    paired_end?: boolean;
    read_id?: number;
    biorep?: number;
    techrep?: number;
    filetype: FileType;
    assay?: string;
    url?: string;
}

/**
 * A collection of datasets to return for a GraphQL query.
 *
 * @prop datasets the datasets returned from an errorless query.
 * @prop counts counts of unique features associated with the experiments.
 */
export interface DatasetCollection {
    parameters: DatasetSelectionParameters;
    datasets: Dataset[];
    counts?: DatasetCountRow;
}

export interface BiosamplePartitionCollection extends DatasetCollection {
    biosample: BiosampleRow;
}

export interface TargetPartitionCollection extends DatasetCollection {
    target: TargetRow | null;
}

export interface LabPartitionCollection extends DatasetCollection {
    lab: Lab;
}

export type AnyDatasetCollection = DatasetCollection | BiosamplePartitionCollection | TargetPartitionCollection | LabPartitionCollection;

export type FileType = "sequence_reads" | "unfiltered_alignments" | "filtered_alignments" | "unreplicated_peaks" | "replicated_peaks" | "normalized_signal" | "bigbed_unreplicated_peaks" | "bigbed_replicated_peaks";

export interface File {
    accession: string;
    dataset: Dataset;
    type: FileType;
}
export interface SequenceReads extends File {
    type: "sequence_reads";
    paired_end: boolean;
    read_id: number;
    biorep?: number;
    techrep?: number;
    assay?: string;
    url?: string;
}

export interface UnfilteredAlignments extends File {
    type: "unfiltered_alignments";
    assembly: Assembly;
    biorep?: number;
    techrep?: number;
    assay?: string;
    url?: string;
}

export interface FilteredAlignments extends File {
    type: "filtered_alignments";
    assembly: Assembly;
    biorep?: number;
    techrep?: number;
    assay?: string;
    url?: string;
}

export interface UnreplicatedPeaks extends File {
    type: "unreplicated_peaks";
    assembly: Assembly;
    biorep?: number;
    techrep?: number;
    assay?: string;
    url?: string;
}

export interface BigBedUnreplicatedPeaks extends File {
    type: "bigbed_unreplicated_peaks";
    assembly: Assembly;
    biorep?: number;
    techrep?: number;
    assay?: string;
    url?: string;
}

export interface ReplicatedPeaks extends File {
    type: "replicated_peaks";
    assembly: Assembly;
    assay?: string;
    url?: string;
}

export interface BigBedReplicatedPeaks extends File {
    type: "bigbed_replicated_peaks";
    assembly: Assembly;
    assay?: string;
    url?: string;
}

export interface NormalizedSignal extends File {
    type: "normalized_signal";
    assembly: Assembly;
    biorep?: number;
    techrep?: number;
    assay?: string;
    url?: string;
}

export type DatasetFile = SequenceReads | UnfilteredAlignments | FilteredAlignments | UnreplicatedPeaks | ReplicatedPeaks | NormalizedSignal | BigBedUnreplicatedPeaks | BigBedReplicatedPeaks;

/**
 * Represents a single peak value from a bed file
 */
export interface Peak {
    experiment_accession: string;
    file_accession: string;
    chrom: string;
    chrom_start: number;
    chrom_end: number;
    name: string;
    assembly: string;
    assay: string;
    score: number;
    strand: string;
    signal_value: number;
    p_value: number;
    q_value: number;
    peak: number;
    dataset: Dataset;
}
/**
 * A collection of peaks to return for a GraphQL query.
 *
 * @prop datasets the datasets returned from an errorless query.
 */
export interface PeaksCollection {
    parameters: PeaksSelectionParameters;
    peaks: Peak[];
    count?: number;
}
export interface TargetPeaksPartitionCollection extends PeaksCollection {
    target: TargetRow | null;
}

export type AnyPeaksCollection = PeaksCollection | TargetPeaksPartitionCollection;
/**
 * Represents the results of counting features of datasets, filtered by search criteria.
 *
 * @prop total the total number of results matching the criteria.
 * @prop peaks the total number of peaks matching the criteria.
 * @prop biosamples the total number of biosamples matching the criteria.
 * @prop species the total number of species matching the criteria.
 * @prop projects the total number of projects, for example ENCODE and Cistrome, matching.
 * @prop labs the total number of labs performing experiments matching the criteria.
 */
export interface PeakCountRow {
    total: number;
    peaks: number;
}

export type StreamPeak = {
    experiment_accession: string;
    file_accession: string;
    chrom: string;
    chrom_start: number;
    chrom_end: number;
    p_value: number;
    q_value: number;
    target: string;
    biosample: string;
};