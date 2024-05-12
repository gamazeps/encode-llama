
CREATE TABLE IF NOT EXISTS psychencode_datasets_metadata (
    row_id TEXT,
    row_version INT,
    study TEXT,
    individualID TEXT,
    individualIDSource TEXT,
    diagnosis TEXT,
    sex TEXT,
    ethnicity TEXT,
    age_death double precision,
    fetal BOOLEAN,
    ageOnset TEXT,
    yearAutopsy TEXT,
    causeDeath TEXT,
    brainWeight TEXT,
    height TEXT,
    weight TEXT,
    ageBiopsy TEXT,
    smellTestScore TEXT,
    smoker TEXT,
    notes TEXT,
    Capstone_4 BOOLEAN
);
