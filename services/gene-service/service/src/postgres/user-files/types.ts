

export interface InsertUserGeneQuantFileArgs {
    dataset_accession: string;
    assembly: string;
    biorep?: number;
    techrep?: number;
}

export interface UpdateUserGeneQuantFileArgs {
    accession: string;
    assembly?: string;
    biorep?: number;
    techrep?: number;
}

export interface InsertUserTranscriptQuantFileArgs {
    dataset_accession: string;
    assembly: string;
    biorep?: number;
    techrep?: number;
}

export interface UpdateUserTranscriptQuantFileArgs {
    accession: string;
    assembly?: string;
    biorep?: number;
    techrep?: number;
}