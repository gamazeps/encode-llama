CREATE INDEX gene_$ASSEMBLY_id ON gene_$ASSEMBLY(id);
CREATE INDEX gene_$ASSEMBLY_name ON gene_$ASSEMBLY(name);
CREATE INDEX gene_$ASSEMBLY_idPrefix ON gene_$ASSEMBLY(idPrefix);
CREATE INDEX gene_$ASSEMBLY_chrom_idx ON gene_$ASSEMBLY(chromosome, start, stop);

CREATE INDEX exon_$ASSEMBLY_id ON exon_$ASSEMBLY(id);
CREATE INDEX exon_$ASSEMBLY_idPrefix ON exon_$ASSEMBLY(idPrefix);
CREATE INDEX exon_$ASSEMBLY_name ON exon_$ASSEMBLY(name);
CREATE INDEX exon_$ASSEMBLY_chrom_idx ON exon_$ASSEMBLY(chromosome, start, stop);

CREATE INDEX transcript_$ASSEMBLY_id ON transcript_$ASSEMBLY(id);
CREATE INDEX transcript_$ASSEMBLY_idPrefix ON transcript_$ASSEMBLY(idPrefix);
CREATE INDEX transcript_$ASSEMBLY_name ON transcript_$ASSEMBLY(name);
CREATE INDEX transcript_$ASSEMBLY_chrom_idx ON transcript_$ASSEMBLY(chromosome, start, stop);

CREATE INDEX cds_$ASSEMBLY_id ON cds_$ASSEMBLY(id);
CREATE INDEX cds_$ASSEMBLY_idPrefix ON cds_$ASSEMBLY(idPrefix);
CREATE INDEX cds_$ASSEMBLY_chrom_idx ON cds_$ASSEMBLY(chromosome, start, stop);

CREATE INDEX utr_$ASSEMBLY_id ON utr_$ASSEMBLY(id);
CREATE INDEX utr_$ASSEMBLY_idPrefix ON utr_$ASSEMBLY(idPrefix);
CREATE INDEX utr_$ASSEMBLY_chrom_idx ON utr_$ASSEMBLY(chromosome, start, stop);
