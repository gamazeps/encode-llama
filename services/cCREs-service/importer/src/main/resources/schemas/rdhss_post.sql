CREATE index $ASSEMBLY_rdhss_accession_idx on $ASSEMBLY_rdhss(accession);
CREATE index $ASSEMBLY_rdhss_coordinate_idx on $ASSEMBLY_rdhss(chromosome, start, stop);

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX $ASSEMBLY_rdhss_acci ON $ASSEMBLY_rdhss USING gist (accession gist_trgm_ops);
