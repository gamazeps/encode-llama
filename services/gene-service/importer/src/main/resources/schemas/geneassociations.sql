CREATE TABLE IF NOT EXISTS gene_associations (
    disease TEXT,
    gene_name TEXT,
    gene_id TEXT, 
    twas_p FLOAT, 
    twas_bonferroni FLOAT, 
    hsq FLOAT,
    dge_fdr FLOAT, 
    dge_log2fc FLOAT,
    PRIMARY KEY (disease,gene_id)
);