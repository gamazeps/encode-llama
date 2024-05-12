--biosample type ='tissue'
CREATE TABLE IF NOT EXISTS psychencode_datasets (
    individualID TEXT,
    specimenID TEXT,
    species TEXT,
    study TEXT,
    Contributor TEXT, -- lab_name
    grantId TEXT,
    assay TEXT, --assay term name
    assayTarget TEXT,
    diagnosis TEXT,
    organ TEXT, --organ=tissue, --organ + specimen id +hemisphere= biosample
    tissue TEXT,
    BrodmannArea TEXT,
    tissueAbbr TEXT,
    cellType TEXT,
    hemisphere TEXT,
    PMI double precision,
    pH double precision,
    libraryPrep TEXT,
    RIN double precision,
    platform TEXT,
    readLength INT,
    runType TEXT,
    freezeId TEXT,
    Clone TEXT,
    Passage TEXT,
    terminalDifferentiationPoint TEXT,
    notes TEXT,
    Capstone_4 TEXT,
    Capstone_1 TEXT,
    createdBy INT,
    accession TEXT PRIMARY KEY,
    biosample TEXT NOT NULL,
    cell_compartment TEXT,
    lab_name TEXT,
    lab_friendly_name TEXT,
    assay_term_name TEXT,
    biosample_type TEXT
);

CREATE TABLE IF NOT EXISTS psychencode_gene_quantification_files (
    row_id INT,
    row_version INT,
    row_etag TEXT,
    accession TEXT  PRIMARY KEY,
    name TEXT,
    fileFormat TEXT,
    isStranded BOOLEAN,
    iPSC_intergrative_analysis BOOLEAN,
    currentVersion INT,
    dataFileHandleId INT,
    dataset_accession TEXT  NOT NULL REFERENCES psychencode_datasets(accession),
      assembly TEXT NOT NULL,
    biorep INT, -- 1
    techrep INT --1
);

CREATE TABLE IF NOT EXISTS psychencode_transcript_quantification_files (
    row_id INT,
    row_version INT,
    row_etag TEXT,
    accession TEXT  PRIMARY KEY,
    name TEXT,
    fileFormat TEXT,
    isStranded BOOLEAN,
    iPSC_intergrative_analysis BOOLEAN,
    currentVersion INT,
    dataFileHandleId INT,
    dataset_accession TEXT  NOT NULL REFERENCES psychencode_datasets(accession),
      assembly TEXT NOT NULL,
    biorep INT, -- 1
    techrep INT --1
);

CREATE TABLE IF NOT EXISTS psychencode_transcriptome_alignments_files (
    row_id INT,
    row_version INT,
    row_etag TEXT,
    accession TEXT  PRIMARY KEY,
    name TEXT,
    fileFormat TEXT,
    isStranded BOOLEAN,
    iPSC_intergrative_analysis BOOLEAN,
    currentVersion INT,
    dataFileHandleId INT,
    dataset_accession TEXT  NOT NULL REFERENCES psychencode_datasets(accession)
);

CREATE TABLE IF NOT EXISTS psychencode_sortedByCoord_alignments_files (
    row_id INT,
    row_version INT,
    row_etag TEXT,
    accession TEXT  PRIMARY KEY,
    name TEXT,
    fileFormat TEXT,
    isStranded BOOLEAN,
    iPSC_intergrative_analysis BOOLEAN,
    currentVersion INT,
    dataFileHandleId INT,
    dataset_accession TEXT NOT NULL REFERENCES psychencode_datasets(accession)
);

CREATE TABLE IF NOT EXISTS psychencode_signal_files (
    row_id INT,
    row_version INT,
    row_etag TEXT,
    accession TEXT  PRIMARY KEY,
    name TEXT,
    fileFormat TEXT,
    isStranded BOOLEAN,
    iPSC_intergrative_analysis BOOLEAN,
    currentVersion INT,
    dataFileHandleId INT,
    dataset_accession TEXT NOT NULL REFERENCES psychencode_datasets(accession),
    strand CHAR,
    assembly TEXT NOT NULL,
    biorep INT, --set to 1
    techrep INT,
    unique_reads BOOLEAN NOT NULL
);
