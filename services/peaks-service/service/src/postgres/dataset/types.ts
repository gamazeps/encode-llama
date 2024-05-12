/**
 * Represents a set of parameters used for searching datasets.
 *
 * @prop target the ChIP target of the experiment, for example a TF or histone mark.
 * @prop biosample the cell type or tissue in which the experiment was performed.
 * @prop lab the ID or display name of the lab performing the experiment.
 * @prop project the project to which the dataset belongs, for example ENCODE.
 * @prop source the source to which the dataset belongs, for example ENCODE, Cistrome.
 * @prop species the name of the species in which the experiment was performed.
 * @prop assembly the genomic assembly for which to select files.
 */
export interface DatasetSelectionParameters {
    target?: string | null;
    biosample?: string;
    target_prefix?: string;
    biosample_prefix?: string;
    lab?: string;
    project?: string;
    source?: string;
    species?: string;
    processed_assembly?: string;
    accession?: string[];
    searchterm?: string[];
    assay?: string;
    limit?: number;
    replicated_peaks?: boolean;
    include_investigatedas?: string[];
    exclude_investigatedas?: string[];
    replicated_peak_accession?: string;
    developmental_slims?: string[];
    cell_slims?: string[];
    organ_slims?: string[];
    system_slims?: string[];
}

export interface FileSelectionParameters {
    accession?: string[];
    assembly?: string;
}
