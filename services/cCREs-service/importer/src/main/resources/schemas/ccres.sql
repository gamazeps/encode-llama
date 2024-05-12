CREATE TABLE $ASSEMBLY_ccres (
    id SERIAL,
    accession TEXT,
    rDHS TEXT,
    chromosome TEXT,
    start INT,
    stop INT,
    ccre_group TEXT,
    ctcf_bound BOOLEAN
);
