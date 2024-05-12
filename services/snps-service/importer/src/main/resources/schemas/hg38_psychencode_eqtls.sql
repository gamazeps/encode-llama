CREATE TABLE IF NOT EXISTS hg38_psychencode_eQTLs (
    gene_id TEXT NOT NULL,
    strand CHAR NOT NULL,
    n_tested_snps INT NOT NULL,
    distance_to_tss INT NOT NULL,
    snp_id TEXT NOT NULL,
    chromosome TEXT NOT NULL,
    start INT NOT NULL,
    stop INT NOT NULL,
    pval REAL NOT NULL,
    regression_slope REAL NOT NULL,
    is_top_snp INT NOT NULL,
    fdr REAL NOT NULL
);
