/* human (hg38) */
CREATE INDEX grch38_mm10_orthology_grch38_index ON grch38_mm10_ortholog(grch38);

/* mouse (mm10) */
CREATE INDEX grch38_mm10_orthology_mm10_index ON grch38_mm10_ortholog(mm10);