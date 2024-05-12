
CREATE INDEX avgexp_bysubclass_dataset_index ON avgexp_bysubclass (dataset);
CREATE INDEX avgexp_bysubclass_featurekey_index ON avgexp_bysubclass (featurekey);
CREATE INDEX avgexp_bysubclass_dataset_featurekey_index ON avgexp_bysubclass (dataset,featurekey);

