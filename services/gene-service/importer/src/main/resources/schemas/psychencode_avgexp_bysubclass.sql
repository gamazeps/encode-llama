CREATE TABLE IF NOT EXISTS avgexp_bysubclass (
    dataset TEXT NOT NULL,
    featurekey TEXT NOT NULL,
    celltype TEXT NOT NULL,
    avgexp FLOAT
);