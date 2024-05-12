CREATE TABLE IF NOT EXISTS gwas_intersectingsnp_withccres (
    disease TEXT,
    snpid TEXT,
    snp_chrom TEXT NOT NULL,
    snp_start INT,
    snp_stop INT,
    riskallele TEXT,
    associated_gene TEXT,    
    association_p_val DOUBLE PRECISION[],
    ccre_chrom TEXT NOT NULL,
    ccre_start INT,
    ccre_stop INT,
    rdhsid TEXT,
    ccreid TEXT,
    ccre_class TEXT
);
