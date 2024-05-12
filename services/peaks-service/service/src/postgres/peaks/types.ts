/**
 * Represents a set of parameters for searching peaks.
 *
 * @prop experiment_accession the accession for the experiment
 * @prop file_accession the accession for the peaks file
 * @prop chrom the chromosome to search on
 * @prop chrom_start the beginning of a peaks range on the given chromosome
 * @prop chrom_end the end of a peaks range on the given chromosome
 */
export interface PeaksSelectionParameters {
    assembly: string;
    target?: string;
    experiment_accession?: string;
    file_accession?: string;
    range: ChromRange[];
    searchterm?: string[];
    assay?: string;
    type?: string[];
}
/**
 * Represents a set of parameters for searching peaks.
 *
 * @prop experiment_accession the accession for the experiment
 * @prop file_accession the accession for the peaks file
 * @prop chrom the chromosome to search on
 * @prop chrom_start the beginning of a peaks range on the given chromosome
 * @prop chrom_end the end of a peaks range on the given chromosome
 */
export interface PeaksByRangeSelectionParameters {
    assembly: string;
    target?: string;
    biosample?: string;
    experiment_accession?: string;
    file_accession?: string;
    range: ChromRange[];
    searchterm?: string[];
    assay?: string;
    type?: string[];
    orderby?: boolean;
    limit?: number;
    offset?: number;
    dataformat?: "bed" | "json";
}
export type ChromRange = { chrom: string; chrom_start: number; chrom_end: number };
export interface PeaksSelectionParametersFromFile {
    chrom: string;
    chrom_start: number;
    chrom_end: number;
}
