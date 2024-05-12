CREATE TABLE IF NOT EXISTS $ASSEMBLY_cellTypeEnrichment (
    encodeId TEXT,
    PM_ID INT,
    Name TEXT,
    RefName TEXT,
    FDR double precision NULL,
    FE double precision NULL,
    pValue double precision NULL,
    PRIMARY KEY (encodeId, PM_ID, Name, RefName),
    FOREIGN KEY (PM_ID, Name, RefName) REFERENCES $ASSEMBLY_studies (PM_ID, Name, RefName)
);

CREATE TABLE $ASSEMBLY_cellTypeEnrichment_$VAL_TYPE (
    encodeId TEXT,
    PM_ID INT,
    name TEXT,
    refName TEXT,
    $VAL_TYPE double precision NULL
);
