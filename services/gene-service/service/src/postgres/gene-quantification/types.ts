import { QuantificationRange, QuantificationDataSource } from "../types";

export interface GeneQuantParameters {
    source?: QuantificationDataSource;
    assembly: string;
    experiment_accession?: string[];
    file_accession?: string[];
    fa?: string;
    gene_id?: string[];
    gene_id_prefix?: string[];
    name?: string[];
    tpm_range?: QuantificationRange;
    fpkm_range?: QuantificationRange;
    limit?: number;
    offset?: number;
    sortByFpkm?: boolean;
}

export interface GeneQuant {
    experiment_accession: string;
    file_accession: string;
    gene_id: string;
    transcript_ids: string[];
    len: number;
    effective_len: number;
    expected_count: number;
    tpm: number;
    fpkm: number;
    posterior_mean_count: number;
    posterior_standard_deviation_of_count: number;
    pme_tpm: number;
    pme_fpkm: number;
    tpm_ci_lower_bound: number;
    tpm_ci_upper_bound: number;
    fpkm_ci_lower_bound: number;
    fpkm_ci_upper_bound: number;
    r?: number;
    source?: string;
    assembly?: string;
}
