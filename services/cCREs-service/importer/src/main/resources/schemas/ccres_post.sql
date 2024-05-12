CREATE index $ASSEMBLY_ccres_accession_idx on $ASSEMBLY_ccres(accession);
CREATE index $ASSEMBLY_ccres_rdhs_idx on $ASSEMBLY_ccres(rdhs);
CREATE index $ASSEMBLY_ccres_group_idx on $ASSEMBLY_ccres(ccre_group);
CREATE index $ASSEMBLY_ccres_coordinate_idx on $ASSEMBLY_ccres(chromosome, start, stop);

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX $ASSEMBLY_ccres_acci ON $ASSEMBLY_ccres USING gist (accession gist_trgm_ops);
