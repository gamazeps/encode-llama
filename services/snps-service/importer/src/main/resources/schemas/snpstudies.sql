CREATE TABLE $ASSEMBLY_snpStudies (
    snpId TEXT,
    leadId TEXT,
    PM_ID INT,
    Name TEXT,
    RefName TEXT,
    FOREIGN KEY (PM_ID, Name,RefName) REFERENCES $ASSEMBLY_studies (PM_ID, Name,RefName)
);
