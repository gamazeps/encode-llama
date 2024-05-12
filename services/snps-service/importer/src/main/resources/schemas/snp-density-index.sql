CREATE INDEX $ASSEMBLY_snp_density_$RESOLUTION_index ON $ASSEMBLY_snp_density_$RESOLUTION (
    chrom ASC, start ASC, stop DESC
);
