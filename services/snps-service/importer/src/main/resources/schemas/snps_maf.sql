CREATE TABLE snps_maf (
    snp TEXT NOT NULL,
    refAllele TEXT NOT NULL,
    altAllele TEXT NOT NULL,
    af DOUBLE PRECISION,
    eas_af DOUBLE PRECISION,
    amr_af DOUBLE PRECISION,
    afr_af DOUBLE PRECISION,
    eur_af DOUBLE PRECISION,
    sas_af DOUBLE PRECISION,
    chrom TEXT NOT NULL,
    start INT
);
