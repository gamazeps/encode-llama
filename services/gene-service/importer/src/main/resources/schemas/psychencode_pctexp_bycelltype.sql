CREATE TABLE IF NOT EXISTS pctexp_bycelltype (
    dataset TEXT NOT NULL,
    featurekey TEXT NOT NULL,
    celltype TEXT NOT NULL,
    pctexp FLOAT
);