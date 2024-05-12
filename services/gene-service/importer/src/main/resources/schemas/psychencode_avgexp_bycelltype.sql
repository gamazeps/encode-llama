CREATE TABLE IF NOT EXISTS avgexp_bycelltype (
    dataset TEXT NOT NULL,
    featurekey TEXT NOT NULL,
    celltype TEXT NOT NULL,
    avgexp FLOAT
);