CREATE TABLE IF NOT EXISTS gwas_snp_associations (
    disease TEXT,
    snpid TEXT,
    chrom TEXT NOT NULL,
    start INT,
    stop INT,
    riskallele TEXT,
    associated_gene TEXT,    
    analyses_identifying_snp INT,
    association_p_val DOUBLE PRECISION[]
);
