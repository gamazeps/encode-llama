CREATE INDEX $ASSEMBLY_snp_idx ON $ASSEMBLY_snp_coords_ref (snp);
----
CREATE INDEX $ASSEMBLY_common_coordinates_idx ON $ASSEMBLY_common_snps USING gist (chrom, coordinates);
