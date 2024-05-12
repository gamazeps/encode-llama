export interface Range {
    chromosome: string;
    start: number;
    end: number;
}

export interface CelltypeQueryParameters {
    name?: string[];
    assembly: string;
}
export interface CelltypeDetails {
    celltype: string[];
    wiki_desc?: string;
    ct_image_url?: string;
}
export interface HgncData {
    hgnc_id?: string;
    symbol?: string;
    name?: string;
    uniprot_ids?: string[];
    locus_type?: string;
    prev_symbol?: string[];
    prev_name?: string[];
    location?: string;
    entrez_id?: string;
    gene_group?: string[];
    gene_group_id?: string[];
    ccds_id?: string[];
    locus_group?: string;
    alias_symbol?: string[];
}
export interface EnsembleData {
    id?: string;
    display_name?: string;
    biotype?: string;
    description?: string;
    hgnc_synonyms?: string[];
    hgnc_primary_id?: string;
    version?: string;
    ccds_id?: string[];
    uniprot_synonyms?: string[];
    uniprot_primary_id?: string;
}
export interface Modifications {
    name?: string;
    title?: string;
    symbol?: string;
    modification?: ModificationData[];
}

export interface ModificationData {
    position?: string;
    modification?: string;
    amino_acid_code?: string;
}
export interface FactorDetails {
    gene_id?: string;
    name: string;
    assembly: string;
    coordinates?: Range;
    uniprot_data?: string;
    ncbi_data?: string;
    hgnc_data?: HgncData;
    ensemble_data?: EnsembleData;
    modifications?: Modifications;
    pdbids?: string;
    factor_wiki?: string;
    dbd?: string[];
    isTF?: boolean;
    color?: string;
}

export interface FactorQueryParameters {
    id?: string[];
    name?: string[];
    assembly: string;
    name_prefix?: string;
    limit?: number; 
    isTF?: boolean;
}
