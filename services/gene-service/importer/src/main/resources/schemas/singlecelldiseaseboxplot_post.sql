
CREATE INDEX singlecelldiseaseboxplot_disease_index ON singlecelldiseaseboxplot (disease);
CREATE INDEX singlecelldiseaseboxplot_gene_index ON singlecelldiseaseboxplot (gene);
CREATE INDEX singlecelldiseaseboxplot_celltype_index ON singlecelldiseaseboxplot (celltype);
CREATE INDEX singlecelldiseaseboxplot_gene_celltype_index ON singlecelldiseaseboxplot (gene,celltype);
CREATE INDEX singlecelldiseaseboxplot_disease_gene_celltype_index ON singlecelldiseaseboxplot (disease,gene,celltype);
