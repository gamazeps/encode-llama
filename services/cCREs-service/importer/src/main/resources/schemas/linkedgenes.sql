CREATE TABLE IF NOT EXISTS linked_genes (
    accession TEXT NOT NULL,
    gene TEXT NOT NULL,
    assembly TEXT NOT NULL,
    assay TEXT NOT NULL,
    experiment_accession TEXT NOT NULL,
    celltype TEXT NOT NULL
);