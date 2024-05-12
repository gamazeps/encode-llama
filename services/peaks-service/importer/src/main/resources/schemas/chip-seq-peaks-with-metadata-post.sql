CREATE TABLE chip_seq_peaks_with_metadata_$ASSEMBLY (
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
);

INSERT INTO chip_seq_peaks_with_metadata_$ASSEMBLY
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
join chip_seq_datasets as B on C.experiment_accession=B.accession
ORDER BY chrom_start ASC;


create index chip_seq_peaks_with_metadata_$ASSEMBLY_chrom_start_end_idx ON chip_seq_peaks_with_metadata_$ASSEMBLY(chrom, chrom_start, chrom_end);

create index chip_seq_peaks_with_metadata_$ASSEMBLY_start_end_idx ON chip_seq_peaks_with_metadata_$ASSEMBLY(chrom_start, chrom_end);