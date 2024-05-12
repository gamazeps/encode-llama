CREATE TABLE chip_seq_datasets (
    accession TEXT PRIMARY KEY,
    target TEXT,
    released DATE,
    project TEXT NOT NULL,
    source TEXT NOT NULL,
    biosample TEXT NOT NULL,
    lab_name TEXT,
    lab_friendly_name TEXT,
    species TEXT NOT NULL,
    investigated_as TEXT[],
    isTreated BOOLEAN,
    biosample_summary TEXT,
    developmental_slims TEXT[],
    cell_slims TEXT[],
    organ_slims TEXT[],
    system_slims TEXT[]
);

CREATE TABLE chip_seq_sequence_reads (
    accession TEXT PRIMARY KEY,
    dataset_accession TEXT NOT NULL REFERENCES chip_seq_datasets(accession),
    paired_end BOOLEAN,
    read_id INT,
    biorep INT,
    techrep INT,
    archived BOOLEAN,
    url TEXT
);

CREATE TABLE chip_seq_unfiltered_alignments (
    accession TEXT PRIMARY KEY,
    dataset_accession TEXT NOT NULL REFERENCES chip_seq_datasets(accession),
    assembly TEXT,
    biorep INT,
    techrep INT,
    archived BOOLEAN,
    url TEXT
);

CREATE TABLE chip_seq_filtered_alignments (
    accession TEXT PRIMARY KEY,
    dataset_accession TEXT NOT NULL REFERENCES chip_seq_datasets(accession),
    assembly TEXT NOT NULL,
    biorep INT,
    techrep INT,
    archived BOOLEAN,
    url TEXT
);

CREATE TABLE chip_seq_unreplicated_peaks (
    accession TEXT PRIMARY KEY,
    dataset_accession TEXT NOT NULL REFERENCES chip_seq_datasets(accession),
    assembly TEXT NOT NULL,
    biorep INT,
    techrep INT,
    archived BOOLEAN,
    url TEXT
);

CREATE TABLE chip_seq_bigbed_unreplicated_peaks (
    accession TEXT PRIMARY KEY,
    dataset_accession TEXT NOT NULL REFERENCES chip_seq_datasets(accession),
    assembly TEXT NOT NULL,
    biorep INT,
    techrep INT,
    archived BOOLEAN,
    url TEXT
);

CREATE TABLE chip_seq_replicated_peaks (
    accession TEXT PRIMARY KEY,
    dataset_accession TEXT NOT NULL REFERENCES chip_seq_datasets(accession),
    assembly TEXT NOT NULL,
    archived BOOLEAN,
    url TEXT
);

CREATE TABLE chip_seq_bigbed_replicated_peaks (
    accession TEXT PRIMARY KEY,
    dataset_accession TEXT NOT NULL REFERENCES chip_seq_datasets(accession),
    assembly TEXT NOT NULL,
    archived BOOLEAN,
    url TEXT
);

CREATE TABLE chip_seq_normalized_signal (
    accession TEXT PRIMARY KEY,
    dataset_accession TEXT NOT NULL REFERENCES chip_seq_datasets(accession),
    assembly TEXT NOT NULL,
    biorep INT,
    techrep INT,
    archived BOOLEAN,
    url TEXT
);