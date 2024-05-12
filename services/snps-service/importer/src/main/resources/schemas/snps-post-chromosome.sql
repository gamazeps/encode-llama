CREATE MATERIALIZED VIEW $ASSEMBLY_snp_coords_$CHROM AS (
    SELECT A.start, stop, A.snp, B.refallele, B.af
    FROM $ASSEMBLY_snp_coords AS A
    LEFT JOIN (SELECT chrom, start, refallele, MAX(af) AS af FROM snps_maf GROUP BY chrom, start, refallele) AS B
    ON B.chrom = A.chrom and B.start = A.start
    WHERE A.chrom = '$CHROM'
    ORDER BY A.start ASC, stop DESC
);
CREATE INDEX $ASSEMBLY_snp_coords_$CHROM_idx ON $ASSEMBLY_snp_coords_$CHROM (start ASC, stop DESC);
