create index atac_seq_peaks_$ASSEMBLY_experiment_accession_idx ON atac_seq_peaks_$ASSEMBLY(experiment_accession);
----
create index atac_seq_peaks_$ASSEMBLY_file_accession_idx ON atac_seq_peaks_$ASSEMBLY(file_accession);
----
create index atac_seq_peaks_$ASSEMBLY_chrom_idx ON atac_seq_peaks_$ASSEMBLY(chrom, chrom_start, chrom_end);