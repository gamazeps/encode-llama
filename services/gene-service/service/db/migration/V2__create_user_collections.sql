CREATE SCHEMA IF NOT EXISTS gene_user_data;
SET search_path TO gene_user_data;

CREATE SEQUENCE IF NOT EXISTS accession_sequence;

CREATE TABLE IF NOT EXISTS user_collections(
    accession TEXT PRIMARY KEY,
    owner_uid TEXT NOT NULL,
    name TEXT NOT NULL,
    is_public BOOLEAN NOT NULL,
    quant_data_schema TEXT UNIQUE,
    quant_data_schema_in_progress TEXT UNIQUE,
    import_status TEXT,
    queued_time TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_datasets(
    accession TEXT PRIMARY KEY,
    user_collection_accession TEXT NOT NULL REFERENCES user_collections(accession),
    biosample TEXT NOT NULL,
    biosample_type TEXT,
    tissue TEXT,
    cell_compartment TEXT,
    lab_name TEXT,
    lab_friendly_name TEXT,
    assay_term_name TEXT
);

CREATE TABLE IF NOT EXISTS user_gene_quantification_files(
    accession TEXT PRIMARY KEY,
    dataset_accession TEXT NOT NULL REFERENCES user_datasets(accession),
    assembly TEXT NOT NULL,
    biorep INT,
    techrep INT,
    uploaded_file_path TEXT,
    uploaded_file_size INT
);

CREATE TABLE IF NOT EXISTS user_transcript_quantification_files(
    accession TEXT PRIMARY KEY,
    dataset_accession TEXT NOT NULL REFERENCES user_datasets(accession),
    assembly TEXT NOT NULL,
    biorep INT,
    techrep INT,
    uploaded_file_path TEXT,
    uploaded_file_size INT
);