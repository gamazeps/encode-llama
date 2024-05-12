#!/bin/bash
set -e

# cd to project root directory
cd "$(dirname "$(dirname "$0")")"

source ./scripts/setup-environment.sh

# Build the importer executable
echo "Building importer..."
../importer/scripts/build.sh

# Run Postgres
echo "Running docker-compose dependencies..."
docker-compose -f docker-compose.deps.yml up -d

# TODO: Add something that waits for postgres to be up.
until docker exec db psql -c "select 1" --user postgres > /dev/null 2>&1; do
    sleep 2;
done

# Run Importer
echo "Running importer..."
chmod 755 ../importer/build/factor-importer-*.jar
java -jar ../importer/build/factor-importer-*.jar \
    --db-url jdbc:postgresql://$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB \
    --db-username $POSTGRES_USER \
    --db-password $POSTGRES_PASS \
    --db-schema $POSTGRES_SCHEMA \
    --replace-schema \
    --gff3-files "GRCh38;test-resources/gencode.subset.v32.annotation.gff3.gz" \
    --encode-files test-resources/test-encode-metadata-2.json \
    --encode-celltype-files "GRCh38;test-resources/test-encode-metadata-2.json"  \
    --tfdbd-files test-resources/humantf_dbd_subset.csv 


echo "Dependencies started successfully!"
