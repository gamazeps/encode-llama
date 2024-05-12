export enum QuantificationDataSourceType {
    ENCODE = "ENCODE", 
    PSYCH_ENCODE = "PSYCH_ENCODE", 
    USER = "USER"
}

export interface QuantificationDataSource {
    type: QuantificationDataSourceType;
    user_collection?: string;
}

export enum UserCollectionImportStatus {
    QUEUED = "QUEUED", 
    IN_PROGRESS = "IN_PROGRESS", 
    ERROR = "ERROR", 
    SUCCESS = "SUCCESS"
}

export enum FeatureDataSourceType {
    GENCODE, USER
}

export interface FeatureDataSource {
    type: FeatureDataSourceType;
    user_id?: string;
}

export interface GenomicCoordinates {
    chromosome: string;
    start: number;
    stop: number;
}

export interface FeatureParameters {
    source?: FeatureDataSource;
    id?: string[];
    name?: string[];
    strand?: string;
    coordinates?: GenomicCoordinates;
    name_prefix?: string[];
    limit?: number;
    [key: string]: any;
}

export interface GeneParameters extends FeatureParameters {
    source?: FeatureDataSource;
    id?: string[];
    idPrefix?: string[];
    name?: string[];
    strand?: string;
    coordinates?: GenomicCoordinates;
    gene_type?: string;
    havana_id?: string;
    name_prefix?: string[];
    limit?: number;
    offset?: number;
    orderby?: string;
    distanceThreshold?: number;
    version?: number;
}

export interface TranscriptParameters extends FeatureParameters {
    source?: FeatureDataSource;
    id?: string[];
    idPrefix?: string[];
    name?: string[];
    strand?: string;
    coordinates?: GenomicCoordinates;
    transcript_type?: string;
    havana_id?: string;
    name_prefix?: string[];
    limit?: number;
    support_level?: number;
    tag?: string;
}

export interface ExonParameters extends FeatureParameters {
    source?: FeatureDataSource;
    id?: string[];
    name?: string[];
    strand?: string;
    coordinates?: GenomicCoordinates;
    name_prefix?: string[];
    limit?: number;
    exon_number?: number;
    version?: number;
}

export interface UTRParameters extends FeatureParameters {
    source?: FeatureDataSource;
    id?: string[];
    name?: string[];
    strand?: string;
    coordinates?: GenomicCoordinates;
    name_prefix?: string[];
    limit?: number;
    phase?: number;
    direction?: number;
    tag?: string;
    parent_protein?: string;
}

export interface FeatureResult {
    id: string;
    name: string;
    chromosome: string;
    start: number;
    stop: number;
    project: string;
    strand: string;
}

export interface GeneResult extends FeatureResult {
    id: string;
    name: string;
    chromosome: string;
    start: number;
    stop: number;
    project: string;
    score: number;
    strand: string;
    gene_type: string;
    havana_id?: string;
    assembly?: string;
    version?: number;
}

export interface TranscriptResult extends FeatureResult {
    id: string;
    name: string;
    chromosome: string;
    start: number;
    stop: number;
    project: string;
    score: number;
    strand: string;
    transcript_type: string;
    havana_id?: string;
    support_level?: number;
    tag?: string;
    parent_gene: string;
    assembly?: string;
    version?: number;
}

export interface ExonResult extends FeatureResult {
    id: string;
    name: string;
    chromosome: string;
    start: number;
    stop: number;
    project: string;
    score: number;
    strand: string;
    exon_number: number;
    parent_transcript: string;
    assembly?: string;
    version?: number;
}

export interface UTRResult extends FeatureResult {
    id: string;
    chromosome: string;
    start: number;
    stop: number;
    project: string;
    score: number;
    strand: string;
    direction: number;
    phase: number;
    parent_exon: string;
    parent_protein: string;
    tag: string;
    assembly?: string;
    version?: number;
}

export interface QuantificationRange {
    low: number;
    high: number;
}

export interface genesCountResponse {
    chromosome: string;
    start?: number;
    end?: number;
    count: number;
}

export type ChromRange = { chromosome: string; start?: number; stop?: number };


export interface GeneAssociationsParameters {
    disease?: string;
    gene_id?: string;    
    limit?: number;
    offset?: number;
};

export interface PeDatasetValuesParameters {
    dataset: string[];
    gene: string
}
export interface SingleCellGeneBoxPlotParameters {
    disease?: string;
    gene?: string[];    
    celltype?: string[];    
    limit?: number;
    offset?: number;
};



export interface GeneAssociation {
    disease: string;
    gene_id: string;
    gene_name: string;
    twas_p: number;
    twas_bonferroni: number;
    hsq: number;
    dge_fdr: number;
    dge_log2fc: number;    
};

export interface DeconQtls {
    geneid: string,
    snpid: string,
    celltype: string,
    snp_chrom: number,
        snp_start: number,
        nom_val: number,
        slope: number,
        adj_beta_pval: number,
        r_squared: number
        
}

export interface Deg {
    gene: string,
    disease: string,
    celltype: string,
    base_mean: number,
    log2_fc: number,
    lfc_se: number,
    stat: number,
    pvalue: number,
    padj: number
        
}

export interface QtlSigAssoc {
    geneid: string,
    snpid: string,
    dist: number,
    npval: number,
    slope: number,
    fdr: number,
    qtltype: string
}

export interface PeDatasetValues {
    dataset: string;
    gene: string;
    celltype: string;
    avgexp: number;
    pctexp: number;
}

export interface SingleCellGeneBoxPlot {
    disease: string;
    gene: string;
    celltype: string;
    min: number;
    max: number;
    median: number;
    firstquartile: number;
    thirdquartile: number;   
    expr_frac: number;
    mean_count: number; 
};
