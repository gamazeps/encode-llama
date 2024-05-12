INSERT INTO $ASSEMBLY_cellTypeEnrichment (encodeId, PM_ID, name, RefName, $VAL_TYPE) (
    SELECT encodeId, t1.PM_ID, t2.Name, t2.RefName, $VAL_TYPE
    FROM $ASSEMBLY_cellTypeEnrichment_$VAL_TYPE AS t1
    JOIN $ASSEMBLY_studies AS t2 ON t1.RefName = t2.RefName AND t1.Name = t2.Name  AND t1.PM_ID = t2.PM_ID
);
DROP TABLE $ASSEMBLY_cellTypeEnrichment_$VAL_TYPE;

CREATE INDEX $ASSEMBLY_cellTypeEnrichment_index_encodeId ON $ASSEMBLY_cellTypeEnrichment (encodeId);
