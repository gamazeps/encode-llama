CREATE TABLE $ASSEMBLY_experiments (
    id SERIAL,
    accession TEXT,
    ontology TEXT,
    sample_type TEXT,
    life_stage TEXT
);

CREATE TABLE $ASSEMBLY_biosamples (
    biosample_name TEXT NOT NULL PRIMARY KEY,
    $ASSAY_EXPERIMENTS,
    $ASSAY_FILES
);
