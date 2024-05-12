INSERT INTO $ASSEMBLY_studies (
    SELECT DISTINCT PM_ID, Author, Name, RefName FROM $ASSEMBLY_studies_temp
);
DROP TABLE $ASSEMBLY_studies_temp;

CREATE INDEX $ASSEMBLY_studies_index_pm_id ON $ASSEMBLY_studies (PM_ID);
