CREATE TABLE IF NOT EXISTS factor_descriptions_$ASSEMBLY(
    gene_id TEXT ,
    chromosome TEXT ,
    start INT ,
    stop INT ,
    name TEXT,
    uniprot_data TEXT,
    ncbi_data TEXT,
    hgnc_data JSONB,
    ensemble_data JSONB,
    modifications JSONB,
    pdbids TEXT,
    factor_wiki TEXT,
    ensembl_id TEXT,
    dbd TEXT[],
    isTF BOOLEAN,
    color TEXT
);
