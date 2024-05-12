CREATE INDEX pctexp_bysubclass_dataset_index ON pctexp_bysubclass (dataset);
CREATE INDEX pctexp_bysubclass_featurekey_index ON pctexp_bysubclass (featurekey);
CREATE INDEX pctexp_bysubclass_dataset_featurekey_index ON pctexp_bysubclass (dataset,featurekey);

