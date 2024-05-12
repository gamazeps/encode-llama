UPDATE hg38_psychencode_cqtls SET snp_id = COALESCE((
    SELECT snp FROM hg38_snp_coords
     WHERE chrom = hg38_psychencode_cqtls.chromosome
       AND hg38_snp_coords.start = hg38_psychencode_cqtls.start
       AND hg38_snp_coords.stop = hg38_psychencode_cqtls.stop
), snp_id);
CREATE INDEX hg38_psychencode_cqtls_snpid ON hg38_psychencode_cqtls(snp_id);
CREATE INDEX hg38_psychencode_cqtls_geneid ON hg38_psychencode_cqtls(peak_id);
