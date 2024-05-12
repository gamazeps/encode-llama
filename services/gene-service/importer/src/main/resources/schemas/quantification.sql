CREATE TABLE IF NOT EXISTS gene_quantification_$ASSEMBLY (
    experiment_accession TEXT NOT NULL,
    file_accession TEXT NOT NULL,
    gene_id TEXT NOT NULL,
    gene_id_prefix TEXT,
    transcript_ids TEXT[],
    len	REAL NOT NULL,
    effective_len REAL NOT NULL,
    expected_count REAL NOT NULL,
    tpm REAL NOT NULL,
    fpkm REAL NOT NULL,
    posterior_mean_count REAL NOT NULL,
    posterior_standard_deviation_of_count REAL NOT NULL,
    pme_tpm	REAL NOT NULL,
    pme_fpkm REAL NOT NULL,
    tpm_ci_lower_bound REAL NOT NULL,
    tpm_ci_upper_bound REAL NOT NULL,
    fpkm_ci_lower_bound REAL NOT NULL,
    fpkm_ci_upper_bound REAL NOT NULL,
    tpm_coefficient_of_quartile_variation REAL,
    fpkm_coefficient_of_quartile_variation REAL
);

CREATE TABLE IF NOT EXISTS transcript_quantification_$ASSEMBLY (
    experiment_accession TEXT NOT NULL,
    file_accession TEXT NOT NULL,
    transcript_id TEXT NOT NULL,
    transcript_id_prefix TEXT,
    gene_id TEXT NOT NULL,
    gene_id_prefix TEXT,
    len INT NOT NULL,
    effective_len REAL NOT NULL,
    expected_count REAL NOT NULL,
    tpm REAL NOT NULL,
    fpkm REAL NOT NULL,
    iso_pct REAL NOT NULL,
    posterior_mean_count REAL NOT NULL,
    posterior_standard_deviation_of_count REAL NOT NULL,
    pme_tpm REAL NOT NULL,
    pme_fpkm REAL NOT NULL,
    iso_pct_from_pme_tpm REAL NOT NULL,
    tpm_ci_lower_bound REAL NOT NULL,
    tpm_ci_upper_bound REAL NOT NULL,
    fpkm_ci_lower_bound REAL NOT NULL,
    fpkm_ci_upper_bound REAL NOT NULL,
    tpm_coefficient_of_quartile_variation REAL,
    fpkm_coefficient_of_quartile_variation REAL
);

CREATE TABLE IF NOT EXISTS gene_quantification_normalized_$ASSEMBLY (
    experiment_accession TEXT NOT NULL,
    gene_id TEXT NOT NULL,
    expression_value REAL NOT NULL
);