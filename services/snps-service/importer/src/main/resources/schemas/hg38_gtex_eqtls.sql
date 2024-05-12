CREATE TABLE IF NOT EXISTS hg38_gtex_eQTLs (
    chromosome TEXT NOT NULL,
    position INT NOT NULL,
    gene_id TEXT NOT NULL,
    tss_distance INT NOT NULL,
    ma_samples INT NOT NULL,
    ma_count INT NOT NULL,
    maf FLOAT NOT NULL,
    pval_nominal FLOAT NOT NULL,
    slope FLOAT NOT NULL,
    slope_se FLOAT NOT NULL,
    pval_nominal_threshold FLOAT NOT NULL,
    min_pval_nominal FLOAT NOT NULL,
    pval_beta FLOAT NOT NULL,
    tissue TEXT NOT NULL
);
