CREATE TABLE IF NOT EXISTS encode_datasets (
    accession TEXT PRIMARY KEY,
    biosample TEXT NOT NULL,
    tissue TEXT,
    cell_compartment TEXT,
    lab_name TEXT,
    lab_friendly_name TEXT,
    assay_term_name TEXT,
    biosample_type TEXT
);

CREATE TABLE IF NOT EXISTS encode_signal_files (
    accession TEXT PRIMARY KEY,
    dataset_accession TEXT NOT NULL REFERENCES encode_datasets(accession),
    assembly TEXT NOT NULL,
    biorep INT, --set to 1
    techrep INT,
    strand CHAR NOT NULL,
    unique_reads BOOLEAN NOT NULL --true
);



CREATE TABLE IF NOT EXISTS encode_gene_quantification_files (
    accession TEXT PRIMARY KEY,
    dataset_accession TEXT NOT NULL REFERENCES encode_datasets(accession),
    assembly TEXT NOT NULL,
    biorep INT, -- 1
    techrep INT --1
);

CREATE TABLE IF NOT EXISTS encode_transcript_quantification_files (
    accession TEXT PRIMARY KEY,
    dataset_accession TEXT NOT NULL REFERENCES encode_datasets(accession),
    assembly TEXT NOT NULL,
    biorep INT, -- 1
    techrep INT --1
);