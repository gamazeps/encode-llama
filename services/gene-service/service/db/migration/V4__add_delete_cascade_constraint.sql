
SET search_path TO gene_user_data;

ALTER TABLE user_datasets
DROP CONSTRAINT user_datasets_user_collection_accession_fkey,
ADD CONSTRAINT user_datasets_user_collection_accession_fkey
  FOREIGN KEY (user_collection_accession)
  REFERENCES user_collections(accession)
  ON DELETE CASCADE;


ALTER TABLE user_gene_quantification_files
DROP CONSTRAINT user_gene_quantification_files_dataset_accession_fkey,
ADD CONSTRAINT user_gene_quantification_files_dataset_accession_fkey
  FOREIGN KEY (dataset_accession)
  REFERENCES user_datasets(accession)
  ON DELETE CASCADE;

ALTER TABLE user_transcript_quantification_files
DROP CONSTRAINT user_transcript_quantification_files_dataset_accession_fkey,
ADD CONSTRAINT user_transcript_quantification_files_dataset_accession_fkey
  FOREIGN KEY (dataset_accession)
  REFERENCES user_datasets(accession)
  ON DELETE CASCADE;  