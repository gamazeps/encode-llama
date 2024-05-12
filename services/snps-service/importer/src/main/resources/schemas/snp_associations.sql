CREATE TABLE IF NOT EXISTS snp_associations (
    disease TEXT,
    snpid TEXT,
    a1 TEXT,
    a2 TEXT,
    n FLOAT ,
    z FLOAT,
    chisq FLOAT,
    PRIMARY KEY (disease,snpid)
);