CREATE TABLE atac_seq_peaks_$ASSEMBLY(
    experiment_accession TEXT,
    file_accession TEXT,
    chrom TEXT,
    chrom_start INT,
    chrom_end INT,
    name TEXT,
    score INT,
    strand CHAR(1),
    signal_value DOUBLE PRECISION,
    p_value DOUBLE PRECISION,
    q_value DOUBLE PRECISION,
    peak INT
);

CREATE TABLE IF NOT EXISTS atac_seq_peak_counts(
    assembly TEXT PRIMARY KEY,
    count INT NOT NULL
);
