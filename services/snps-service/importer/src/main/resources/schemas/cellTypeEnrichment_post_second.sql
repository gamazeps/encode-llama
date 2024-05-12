UPDATE $ASSEMBLY_celltypeenrichment AS ce
    SET $VAL_TYPE = valtable.$VAL_TYPE
    FROM $ASSEMBLY_celltypeenrichment_$VAL_TYPE AS valtable
    WHERE ce.encodeId = valtable.encodeId
        AND ce.PM_ID = valtable.PM_ID
        AND ce.name = valtable.name
        AND ce.RefName = valtable.RefName;

DROP TABLE $ASSEMBLY_celltypeenrichment_$VAL_TYPE;
