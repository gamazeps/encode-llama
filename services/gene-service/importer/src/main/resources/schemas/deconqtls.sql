CREATE TABLE IF NOT EXISTS deconqtls (
    geneid TEXT,
    snpid TEXT,
    snp_chrom  TEXT,
    snp_start INT,
    nom_val FLOAT,
    slope FLOAT,
    adj_beta_pval FLOAT,
    r_squared FLOAT,
    celltype TEXT
);