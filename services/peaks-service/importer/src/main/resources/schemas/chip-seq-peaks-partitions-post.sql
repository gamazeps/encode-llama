CREATE TABLE chip_seq_peaks_$ASSEMBLY_partitions (
    experiment_accession TEXT,
    file_accession TEXT,
    chrom TEXT,
    chrom_start INT,
    chrom_end INT,
    name TEXT,
    score INT,
    strand CHAR(1),
    signal_value DOUBLE PRECISION,
    p_value DOUBLE PRECISION,
    q_value DOUBLE PRECISION,
    peak INT,
	coordinates int4range,
	target TEXT,
	biosample TEXT
) PARTITION BY LIST (chrom);

CREATE TABLE chip_seq_peaks_$ASSEMBLY_partitions_chr1 PARTITION OF chip_seq_peaks_$ASSEMBLY_partitions
    FOR VALUES IN ('chr1');
CREATE TABLE chip_seq_peaks_$ASSEMBLY_partitions_chr2 PARTITION OF chip_seq_peaks_$ASSEMBLY_partitions
    FOR VALUES IN ('chr2');
CREATE TABLE chip_seq_peaks_$ASSEMBLY_partitions_chr3 PARTITION OF chip_seq_peaks_$ASSEMBLY_partitions
    FOR VALUES IN ('chr3');
CREATE TABLE chip_seq_peaks_$ASSEMBLY_partitions_chr4 PARTITION OF chip_seq_peaks_$ASSEMBLY_partitions
    FOR VALUES IN ('chr4');
CREATE TABLE chip_seq_peaks_$ASSEMBLY_partitions_chr5 PARTITION OF chip_seq_peaks_$ASSEMBLY_partitions
    FOR VALUES IN ('chr5');
CREATE TABLE chip_seq_peaks_$ASSEMBLY_partitions_chr6 PARTITION OF chip_seq_peaks_$ASSEMBLY_partitions
    FOR VALUES IN ('chr6');
CREATE TABLE chip_seq_peaks_$ASSEMBLY_partitions_chr7 PARTITION OF chip_seq_peaks_$ASSEMBLY_partitions
    FOR VALUES IN ('chr7');
CREATE TABLE chip_seq_peaks_$ASSEMBLY_partitions_chr8 PARTITION OF chip_seq_peaks_$ASSEMBLY_partitions
    FOR VALUES IN ('chr8');
CREATE TABLE chip_seq_peaks_$ASSEMBLY_partitions_chr9 PARTITION OF chip_seq_peaks_$ASSEMBLY_partitions
    FOR VALUES IN ('chr9');
CREATE TABLE chip_seq_peaks_$ASSEMBLY_partitions_chr10 PARTITION OF chip_seq_peaks_$ASSEMBLY_partitions
    FOR VALUES IN ('chr10');
CREATE TABLE chip_seq_peaks_$ASSEMBLY_partitions_chr11 PARTITION OF chip_seq_peaks_$ASSEMBLY_partitions
    FOR VALUES IN ('chr11');
CREATE TABLE chip_seq_peaks_$ASSEMBLY_partitions_chr12 PARTITION OF chip_seq_peaks_$ASSEMBLY_partitions
    FOR VALUES IN ('chr12');
CREATE TABLE chip_seq_peaks_$ASSEMBLY_partitions_chr13 PARTITION OF chip_seq_peaks_$ASSEMBLY_partitions
    FOR VALUES IN ('chr13');
CREATE TABLE chip_seq_peaks_$ASSEMBLY_partitions_chr14 PARTITION OF chip_seq_peaks_$ASSEMBLY_partitions
    FOR VALUES IN ('chr14');
CREATE TABLE chip_seq_peaks_$ASSEMBLY_partitions_chr15 PARTITION OF chip_seq_peaks_$ASSEMBLY_partitions
    FOR VALUES IN ('chr15');
CREATE TABLE chip_seq_peaks_$ASSEMBLY_partitions_chr16 PARTITION OF chip_seq_peaks_$ASSEMBLY_partitions
    FOR VALUES IN ('chr16');
CREATE TABLE chip_seq_peaks_$ASSEMBLY_partitions_chr17 PARTITION OF chip_seq_peaks_$ASSEMBLY_partitions
    FOR VALUES IN ('chr17');
CREATE TABLE chip_seq_peaks_$ASSEMBLY_partitions_chr18 PARTITION OF chip_seq_peaks_$ASSEMBLY_partitions
    FOR VALUES IN ('chr18');
CREATE TABLE chip_seq_peaks_$ASSEMBLY_partitions_chr19 PARTITION OF chip_seq_peaks_$ASSEMBLY_partitions
    FOR VALUES IN ('chr19');
CREATE TABLE chip_seq_peaks_$ASSEMBLY_partitions_chr20 PARTITION OF chip_seq_peaks_$ASSEMBLY_partitions
    FOR VALUES IN ('chr20');
CREATE TABLE chip_seq_peaks_$ASSEMBLY_partitions_chr21 PARTITION OF chip_seq_peaks_$ASSEMBLY_partitions
    FOR VALUES IN ('chr21');
CREATE TABLE chip_seq_peaks_$ASSEMBLY_partitions_chr22 PARTITION OF chip_seq_peaks_$ASSEMBLY_partitions
    FOR VALUES IN ('chr22');
CREATE TABLE chip_seq_peaks_$ASSEMBLY_partitions_chrX PARTITION OF chip_seq_peaks_$ASSEMBLY_partitions
    FOR VALUES IN ('chrX');
CREATE TABLE chip_seq_peaks_$ASSEMBLY_partitions_chrY PARTITION OF chip_seq_peaks_$ASSEMBLY_partitions
    FOR VALUES IN ('chrY');
CREATE TABLE chip_seq_peaks_$ASSEMBLY_partitions_chrMisc PARTITION OF chip_seq_peaks_$ASSEMBLY_partitions
   DEFAULT;

 CREATE INDEX chip_seq_peaks_$ASSEMBLY_partitions_target_idx ON chip_seq_peaks_$ASSEMBLY_partitions (target);

 CREATE INDEX chip_seq_peaks_$ASSEMBLY_partitions_chrom_idx ON chip_seq_peaks_$ASSEMBLY_partitions (chrom);

 CREATE INDEX chip_seq_peaks_$ASSEMBLY_partitions_gist_coords_idx ON chip_seq_peaks_$ASSEMBLY_partitions USING  GIST (coordinates);


INSERT INTO chip_seq_peaks_$ASSEMBLY_partitions
SELECT experiment_accession ,
    file_accession ,
    chrom ,
    chrom_start ,
    chrom_end ,
    name ,
    score ,
    strand ,
    signal_value  ,
    p_value  ,
    q_value  ,
    peak,
	int4range(chrom_start,chrom_end),
	B.target,
	B.biosample
FROM chip_seq_peaks_$ASSEMBLY as C
join chip_seq_datasets as B on C.experiment_accession=B.accession;
