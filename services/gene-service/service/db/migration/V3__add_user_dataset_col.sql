SET search_path TO gene_user_data;
ALTER TABLE user_datasets ADD COLUMN metadata jsonb;