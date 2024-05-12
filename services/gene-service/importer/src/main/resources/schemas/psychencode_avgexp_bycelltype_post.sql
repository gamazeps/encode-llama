
CREATE INDEX avgexp_bycelltype_dataset_index ON avgexp_bycelltype (dataset);
CREATE INDEX avgexp_bycelltype_featurekey_index ON avgexp_bycelltype (featurekey);
CREATE INDEX avgexp_bycelltype_dataset_featurekey_index ON avgexp_bycelltype (dataset,featurekey);

