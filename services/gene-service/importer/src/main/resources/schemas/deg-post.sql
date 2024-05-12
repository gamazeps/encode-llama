CREATE INDEX deg_gene_index ON deg (gene);
CREATE INDEX deg_disease_gene_index ON deg (disease,gene);
CREATE INDEX deg_disease_gene_celltype_index ON deg (disease,gene,celltype);