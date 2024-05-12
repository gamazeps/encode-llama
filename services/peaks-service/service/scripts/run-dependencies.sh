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
    echo "waiting for db..."
    sleep 2;
done

# Run Importer
echo "Running importer..."
chmod 755 ../importer/build/peaks-importer-*.jar
java -jar ../importer/build/peaks-importer-*.jar \
    --db-url jdbc:postgresql://$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB \
    --db-username $POSTGRES_USER \
    --db-schema $POSTGRES_SCHEMA \
    --replace-schema \
    --peaks-files hg19:ENCSR411SUC:test-file:test-resources/test-peaks-sample.bfilt.narrowPeak.gz \
    --peaks-files GRCh38:test-experiment2:test-file2:test-resources/test-peaks-sample.bfilt.narrowPeak.gz \
    --encode-metadata-files test-resources/test-encode-metadata.json \
    --encode-metadata-files test-resources/test-encode-metadata-2.json \
    --encode-metadata-files test-resources/test-encode-metadata-3.json \
    --encode-metadata-files test-resources/test-encode-metadata-4.json \
    --encode-metadata-files test-resources/test-encode-metadata-5.json \
    --encode-metadata-files test-resources/test-encode-metadata-6.json \
    --encode-metadata-files test-resources/test-encode-metadata-7.json

echo "Dependencies started successfully!"
