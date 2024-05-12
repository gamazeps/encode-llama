CREATE TABLE $ASSEMBLY_studies_temp (
    PM_ID INT NOT NULL,
    Author TEXT,
    NAME TEXT,
    RefName TEXT
);

CREATE TABLE $ASSEMBLY_studies (
    PM_ID INT,
    Author TEXT,
    Name TEXT,
    RefName TEXT,
    PRIMARY KEY (PM_ID, Name, RefName)
);
