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

# this was causing in infinite loop - temp solution below
until docker exec graphqlservice_postgrestest_1 psql -c "select 1" --user postgres > /dev/null 2>&1; do
    sleep 2;
done

# run with this uncommented, then comment it out and run again
docker exec graphqlservice_postgrestest_1 psql -c "select 1" --user postgres > /dev/null 2>&1

# Run Importer
echo "Running importer..."
chmod 755 ../importer/build/ccre-importer-*.jar
java -jar ../importer/build/ccre-importer-*.jar \
    --db-url jdbc:postgresql://$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB \
    --db-username $POSTGRES_USER \
    --db-schema $POSTGRES_SCHEMA \
    --replace-schema \
    --rdhs-local-paths test-resources/GRCh38-rDHSs.subset.bed.gz \
    --rdhs-local-assemblies GRCh38 \
    --ccre-local-paths test-resources/GRCh38-cCREs-subset.bed.gz \
    --ccre-local-assemblies GRCh38 \
    --biosample-local-paths test-resources/dnase-list.1.txt.gz \
    --biosample-local-assemblies GRCh38 \
    --biosample-local-assays DNase \
    --versioning-files test-resources/2020_01_GRCh38.tsv \
    --linkedgenes-files test-resources/GRCh38_Gene-Links.BETA.txt \
    --ortholog-files test-resources/hg38-mm10-Homologous.txt
 
echo "Dependencies started successfully!"
