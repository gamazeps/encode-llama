
export interface UserCollection {
    accession: string;
    owner_uid: string;
    name: string;
    is_public: boolean;
    quant_data_schema?: string;
    quant_data_schema_in_progress?: string;
    import_status?: string;
    queued_time?: Date
}

export interface InsertUserCollectionArgs {
    owner_uid: string;
    name: string;
    is_public: boolean;
}

export interface UpdateUserCollectionArgs {
    accession: string;
    name?: string;
    is_public?: boolean;
    quant_data_schema?: string;
    quant_data_schema_in_progress?: string|null;
    import_status?: string;
    queued_time?: string|null;
}