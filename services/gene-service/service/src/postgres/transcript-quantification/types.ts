import { QuantificationRange, QuantificationDataSource } from "../types";

export interface TranscriptQuantParameters {
    source?: QuantificationDataSource;
    assembly: string;
    experiment_accession?: string[];
    file_accession?: string[];
    gene_id?: string[];
    transcript_id?: string[];
    tpm_range?: QuantificationRange;
    fpkm_range?: QuantificationRange;
    limit?: number;
    offset?: number;
    sortByFpkm?: boolean;
}

export interface TranscriptQuant {
    experiment_accession: string;
    file_accession: string;
    transcript_id: string;
    gene_id: string;
    len: number;
    effective_len: number;
    expected_count: number;
    tpm: number;
    fpkm: number;
    iso_pct: number;
    posterior_mean_count: number;
    posterior_standard_deviation_of_count: number;
    pme_tpm: number;
    pme_fpkm: number;
    iso_pct_from_pme_tpm: number;
    tpm_ci_lower_bound: number;
    tpm_ci_upper_bound: number;
    fpkm_ci_lower_bound: number;
    fpkm_ci_upper_bound: number;
    source?: string;
    assembly?: string;
}
