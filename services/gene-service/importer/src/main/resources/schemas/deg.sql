CREATE TABLE IF NOT EXISTS deg (
    gene TEXT,
    base_mean DOUBLE PRECISION,
    log2_fc DOUBLE PRECISION,
    lfc_se  DOUBLE PRECISION,
    stat DOUBLE PRECISION,
    pvalue DOUBLE PRECISION,
    padj DOUBLE PRECISION,
    disease TEXT,
    celltype TEXT
);