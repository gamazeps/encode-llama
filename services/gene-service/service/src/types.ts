export interface GenomicRange {
    chromosome: string;
    start: number;
    end: number;
}

export interface GeneInputParameters {
    id?: string;
    name?: string;
    strand?: string;
    chromosome?: string;
    start?: number;
    end?: number;
    gene_type?: string;
    havana_id?: string;
    name_prefix?: string;
    limit?: number;
    assembly: string;
    distance?: number;
    version?: number;
}

export interface TranscriptInputParameters {
    id?: string;
    name?: string;
    strand?: string;
    chromosome?: string;
    start?: number;
    end?: number;
    name_prefix?: string;
    limit?: number;
    assembly: string;
    distance?: number;
    version?: number;
}
