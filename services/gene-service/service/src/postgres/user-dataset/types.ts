
export interface InsertUserDatasetArgs {
    user_collection_accession: string;
    biosample: string;
    biosample_type?: string;
    tissue?: string;
    cell_compartment?: string;
    lab_name?: string;
    lab_friendly_name?: string;
    assay_term_name?: string;
    metadata?: JSON;
}

export interface UpdateUserDatasetArgs {
    accession: string;
    biosample?: string;
    biosample_type?: string;
    tissue?: string;
    cell_compartment?: string;
    lab_name?: string;
    lab_friendly_name?: string;
    assay_term_name?: string;
    metadata?: JSON;
}