CREATE INDEX pctexp_bycelltype_dataset_index ON pctexp_bycelltype (dataset);
CREATE INDEX pctexp_bycelltype_featurekey_index ON pctexp_bycelltype (featurekey);
CREATE INDEX pctexp_bycelltype_dataset_featurekey_index ON pctexp_bycelltype (dataset,featurekey);

