CREATE TABLE IF NOT EXISTS qtlsigassoc (
      geneid TEXT,
      snpid TEXT,
    dist DOUBLE PRECISION,
    npval DOUBLE PRECISION,
    slope  DOUBLE PRECISION,
    fdr DOUBLE PRECISION,    
    qtltype TEXT
);