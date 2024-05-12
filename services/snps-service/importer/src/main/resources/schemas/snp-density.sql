CREATE TABLE $ASSEMBLY_snp_density_$RESOLUTION (
    id SERIAL PRIMARY KEY,
    chrom TEXT,
    start INT,
    stop INT,
    total_snps INT,
    common_snps INT
);
