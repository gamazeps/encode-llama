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

until docker exec graphqlservice_postgrestest_1 psql -c "select 1" --user postgres > /dev/null 2>&1; do
    sleep 2;
done

# Run Importer
echo "Running importer..."
chmod 755 ../importer/build/snps-importer-*.jar
java -jar ../importer/build/snps-importer-*.jar \
    --db-url jdbc:postgresql://$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB \
    --db-username $POSTGRES_USER \
    --db-schema $POSTGRES_SCHEMA \
    --replace-schema \
    --snps-files test-resources/hg19_bed_chr_1_subset.bed.gz \
    --ldblocks-files test-resources/ld_afr_testdata.tsv.gz \
    --density-resolution 100000 \
    --local-ld-populations afr \
    --snps-assemblies hg38 \
    --maf-files test-resources/snps_maf_testdata.tsv.gz \
    --study-enrichment-files test-resources/GWAS.v7.Matrix.hg19.FDR.txt \
    --study-enrichment-assemblies hg38\;fdr \
    --study-snp-files test-resources/GWAS.v7.sorted.hg38.bed \
    --study-snp-assemblies hg38 \
    --gtex-eqtl-files test-resources/GTEx_Analysis_v8_eQTL_test.tar \
    --snp-assoc-files test-resources/PASS_AgeFirstBirth.sumstats.gz \
    --gwassnp-assoc-files test-resources/YearsEducation_gwassnp.bed \
    --gwas-intersectingsnp-withccres-files test-resources/ASD_gwassnp_ccre.bed \
    --gwas-intersectingsnp-withbcres-files test-resources/ASD_adult_gwassnp_bcre.bed \
    --gwas-intersectingsnp-withbcres-files test-resources/ASD_fetal_gwassnp_bcre.bed


echo "Dependencies started successfully!"
