CREATE INDEX qtlsigassoc_geneid_index ON qtlsigassoc (geneid);
CREATE INDEX qtlsigassoc_snpid_index ON qtlsigassoc (snpid);
CREATE INDEX qtlsigassoc_geneid_qtltype_celltype_index ON qtlsigassoc (geneid,qtltype);
CREATE INDEX qtlsigassoc_snpid_qtltype_celltype_index ON qtlsigassoc (snpid,qtltype);
