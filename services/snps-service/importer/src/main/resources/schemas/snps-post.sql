CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE MATERIALIZED VIEW $ASSEMBLY_snp_coords_ref AS (
    SELECT A.chrom, A.start, stop, A.snp, B.refallele, B.af
    FROM $ASSEMBLY_snp_coords AS A
    LEFT JOIN (SELECT chrom,start, refallele, MAX(af) AS af FROM snps_maf GROUP BY chrom, start, refallele) AS B
    ON B.chrom = A.chrom and B.start= A.start
);
----
CREATE MATERIALIZED VIEW $ASSEMBLY_common_snps AS (
    SELECT A.chrom, A.start, stop, A.snp, int4range(A.start,stop,'[]') AS coordinates, B.refallele, B.af
    FROM $ASSEMBLY_snp_coords AS A
    LEFT JOIN (SELECT chrom, start, refallele, MAX(af) AS af FROM snps_maf GROUP BY chrom, start, refallele) AS B
    ON B.chrom = A.chrom and B.start= A.start WHERE af > 0.05
    ORDER BY A.chrom, A.start ASC, stop DESC
);
