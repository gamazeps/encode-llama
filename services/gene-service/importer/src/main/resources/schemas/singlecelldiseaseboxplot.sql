CREATE TABLE IF NOT EXISTS singlecelldiseaseboxplot (
    disease TEXT,
    gene TEXT,
    celltype TEXT,    
    min FLOAT, 
    firstquartile FLOAT, 
    median FLOAT,
    thirdquartile FLOAT, 
    max FLOAT,
    expr_frac FLOAT,
    mean_count FLOAT
);