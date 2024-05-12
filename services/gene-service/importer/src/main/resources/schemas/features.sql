CREATE TABLE IF NOT EXISTS gene_$ASSEMBLY (
    id TEXT NOT NULL,
    idPrefix TEXT NOT NULL,
    name TEXT,
    chromosome TEXT NOT NULL,
    start INT NOT NULL,
    stop INT NOT NULL,
    project TEXT NOT NULL,
    score REAL,
    strand CHAR NOT NULL,
    phase INT NOT NULL,
    gene_type TEXT,
    havana_id TEXT
);

CREATE TABLE IF NOT EXISTS exon_$ASSEMBLY (
    id TEXT NOT NULL,
    idPrefix TEXT NOT NULL,
    name TEXT,
    chromosome TEXT NOT NULL,
    start INT NOT NULL,
    stop INT NOT NULL,
    project TEXT NOT NULL,
    score REAL,
    strand CHAR NOT NULL,
    phase INT,
    exon_number INT,
    parent_transcript TEXT
);

CREATE TABLE IF NOT EXISTS transcript_$ASSEMBLY (
    id TEXT NOT NULL,
    idPrefix TEXT NOT NULL,
    name TEXT,
    chromosome TEXT NOT NULL,
    start INT NOT NULL,
    stop INT NOT NULL,
    project TEXT NOT NULL,
    score REAL,
    strand CHAR NOT NULL,
    phase INT,
    transcript_type TEXT,
    havana_id TEXT,
    support_level INT,
    tag TEXT,
    parent_gene TEXT
);


CREATE TABLE IF NOT EXISTS cds_$ASSEMBLY (
    id TEXT NOT NULL,
    idPrefix TEXT NOT NULL,
    chromosome TEXT NOT NULL,
    start INT NOT NULL,
    stop INT NOT NULL,
    project TEXT NOT NULL,
    score REAL,
    strand CHAR NOT NULL,
    phase INT,
    parent_exon TEXT,
    parent_protein TEXT,
    tag TEXT
);

CREATE TABLE IF NOT EXISTS utr_$ASSEMBLY (
    id TEXT NOT NULL,
    idPrefix TEXT NOT NULL,
    direction INT NOT NULL,
    chromosome TEXT NOT NULL,
    start INT NOT NULL,
    stop INT NOT NULL,
    project TEXT NOT NULL,
    score REAL,
    strand CHAR NOT NULL,
    phase INT,
    parent_exon TEXT,
    parent_protein TEXT,
    tag TEXT
);
