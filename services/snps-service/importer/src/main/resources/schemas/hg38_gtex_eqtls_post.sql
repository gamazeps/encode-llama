CREATE INDEX hg38_gtex_eQTLs_tissue ON hg38_gtex_eQTLs(tissue);
CREATE INDEX hg38_gtex_eQTLs_tissue_coordinates ON hg38_gtex_eQTLs(tissue, chromosome, position);
CREATE INDEX hg38_gtex_eQTLs_gene ON hg38_gtex_eQTLs(gene_id);
CREATE INDEX hg38_gtex_eQTLs_tss_distance ON hg38_gtex_eQTLs(tss_distance);
CREATE INDEX hg38_gtex_eQTLs_maf ON hg38_gtex_eQTLs(maf);
CREATE INDEX hg38_gtex_eQTLs_pval_beta ON hg38_gtex_eQTLs(pval_beta);
