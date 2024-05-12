#!/bin/bash
set -e

# cd to project root directory
cd "$(dirname "$(dirname "$0")")"

source scripts/setup-environment.sh

# Build the importer executable
echo "Building importer..."
../importer/scripts/build.sh

# delete existing postgres volume
echo "Deleting existing volume..."
docker volume inspect service_db-data > /dev/null 2>&1 && docker volume rm service_db-data

# Run Postgres
echo "Running docker-compose dependencies..."
docker-compose -f docker-compose.deps.yml up -d

echo "waiting for flyway..."
docker wait `docker ps -aq -f "ancestor=flyway/flyway" --latest`

docker-compose -f docker-compose.deps.yml logs flyway

chmod 755 ../importer/build/genes-importer-*.jar

echo "Running importer for gencode data..."
java -jar ../importer/build/genes-importer-*.jar \
    --db-url jdbc:postgresql://$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB \
    --db-username $POSTGRES_USER \
    --db-schema $POSTGRES_GENCODE_SCHEMA \
    --replace-schema \
    --gff3-files "GRCh38_30;test-resources/grch38.subset.gff3.gz" 

echo "Running importer for encode data..."
java -jar ../importer/build/genes-importer-*.jar \
    --db-url jdbc:postgresql://$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB \
    --db-username $POSTGRES_USER \
    --db-schema $POSTGRES_ENCODE_SCHEMA \
    --replace-schema \
    --encode-metadata-files test-resources/test-encode-metadata-1.json \
    --local-gene-quantification-files "GRCh38;ENCSR969JYY;ENCFF951YSP;test-resources/gene-quant-subset.tsv" \
    --local-transcript-quantification-files "GRCh38;ENCSR969JYY;ENCFF543WLD;test-resources/transcript-quant-subset.tsv" \
    --genes-assoc-files test-resources/Autism.tsv \
    --single-cell-box-plot-files test-resources/Urban-DLPFC-snRNAseq_processed_display.txt

echo "Running importer for psych-encode data..."
java -jar ../importer/build/genes-importer-*.jar \
    --db-url jdbc:postgresql://$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB \
    --db-username $POSTGRES_USER \
    --db-schema $POSTGRES_PSYCHENCODE_SCHEMA \
    --replace-schema \
    --psychencode-clinical-metadata-file test-resources/psychencode-clinical-metadata-sample.tsv \
    --psychencode-dataset-metadata-file test-resources/psychencode-dataset-metadata-sample.tsv \
    --local-gene-quantification-files "hg19;HSB132_STCrnaSeq;HSB132_STC.RSEM_Quant.genes.results;test-resources/psychencode-gene-quant-sample.tsv" \
    --local-transcript-quantification-files "hg19;HSB132_STCrnaSeq;HSB132_STC.RSEM_Quant.isoforms.results;test-resources/psychencode-transcript-quant-sample.tsv" 

echo "Dependencies started successfully!"
