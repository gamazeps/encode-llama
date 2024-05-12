import { QuantificationDataSource } from "../types"

export interface DatasetParameters {
    source?: QuantificationDataSource;
    processed_assembly?: string;
    tissue?: string[];
    biosample?: string[];
    bs?: string;
    lab?: string[];
    cell_compartment?: string[];
    assay_term_name?: string[];
    biosample_type?: string[];
    accession?: string[];
    user_collection_accession?: string[];
    limit?: number;
    offset?: number;
    diagnosis?: string[];
    study?: string[];
    sex?: string[];
    suicidaldeath?: boolean;
    life_stage?: string;
}

export interface SignalFileParameters {
    source?: QuantificationDataSource;
    dataset_accession?: string[];
    accession?: string[];
    assembly?: string;
}

export interface QuantificationFileParameters {
    source?: QuantificationDataSource;
    dataset_accession?: string[];
    accession?: string[];
    assembly?: string;
}

export interface Dataset {
    accession: string;
    biosample: string;
    biosample_type?: string | null;
    tissue?: string | null;
    cell_compartment?: string | null;
    lab_name?: string | null;
    lab_friendly_name?: string | null;
    assay_term_name?: string | null;
    age_death?: number;
    fetal?: boolean;
    diagnosis?: string;
    study?: string;
    sex?: string;
    metadata? : JSON;
    suicidaldeath?: boolean;
    user_collection_accession? : string | null;
    source: QuantificationDataSource;
}

export interface SignalFile {
    accession: string;
    dataset_accession: string;
    assembly: string;
    biorep?: number | null;
    techrep?: number | null;
    strand?: string | null;
    unique_reads: boolean;
    source?: QuantificationDataSource;
}

export interface QuantificationFile {
    accession: string;
    name?: string;
    dataset_accession: string;
    assembly: string;
    biorep?: number | null;
    techrep?: number | null;
    source?: QuantificationDataSource;
}
