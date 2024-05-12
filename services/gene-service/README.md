# Gene Service

The gene Service is a GraphQL service for retrieving data and metadata related to genes, including coordinates,
transcript, exon, and UTR information, and expression data. The service compiles data from several external sources:

* gene, transcript, exon, UTR, and CDS information from GENCODE for hg19, GRCh38, and mm10
* RNA-seq metadata and gene and transcript expression data from ENCODE
* RNA-seq metadata and gene and transcript expression data from PsychENCODE

## Sub-projects
For GraphQL Service and documentation, see service directory.
For importer project, a standalone application that imports data necessary for our service into a Postgres database, see importer directory.

## API

The API provides four root level queries. The `gene` query returns genes and associated annotations from GENCODE
according to provided search criteria. The `gene_quantification` and `transcript_quantification` queries return
expression data from ENCODE or PsychENCODE for genes and transcripts, respectively. The `dataset` query returns metadata
describing RNA-seq experiments from ENCODE and PsychENCODE.

The following example returns all genes, their coordinates, and a list of their associated transcripts and exons from a
region on chromosome 1 in the GRCh38 genome:

```graphql
query gene($assembly: String!, $chromosome: String, $start: Int, $end: Int) {
  gene(assembly: $assembly, chromosome: $chromosome, start: $start, end: $end) {
    id
    strand
    coordinates {
      chromosome
      start
      end
    }
    transcripts {
      id
      exons {
        id
      }
    }
  }
}
```

Variables will look like this:
```json
{
  "assembly": "GRCh38",
  "chromosome": "chr1",
  "start": 10000000,
  "end": 20000000
}
```

You can return gene expression information for a given gene from ENCODE or PsychENCODE. The `source` argument to the
`gene_quantification` selects a project; use either `ENCODE` or `PsychENCODE`. The following example returns all gene
expression information from ENCODE for the genes `PRDM15` and `SOX2`:

```graphql
query gene($assembly: String!, $name: String) {
  gene(assembly: $assembly, name: $name) {
    name
    gene_quantification(assembly: $assembly, source: "ENCODE") {
      file_accession
      tpm
    }
  }
}
```

Variables will look like this:
```json
{
  "assembly": "GRCh38",
  "name": [ "SOX2", "PRDM15" ]
}
```

If you prefer, you can search for gene expression information directly. This is useful if you want to view expression
levels for all genes within a particular cell type, for example. The following returns expression levels for all genes
from `ENCFF429QPJ`, which is a Poly-A-enriched RNA-seq experiment in the K562 cell line from ENCODE:

```graphql
query gene_quantification($assembly: String!, $file_accession: [String]) {
  gene_quantification(assembly: $assembly, file_accession: $file_accession) {
    gene {
      name
    }
    tpm
  }
}
```

variables:
```json
{
  "assembly": "GRCh38",
  "file_accession": [ "ENCFF429QPJ" ]
}
```

You can also filter datasets from ENCODE or PsychENCODE according to various metadata fields and return associated gene
and transcript expression data. The following selects all GM12878 RNA-seq datasets from ENCODE and returns expression
data for transcripts which have a TPM value of at least 100 in each dataset:

```graphql
query datasets(biosample: [String], source: String, assembly: String, $tpm_range: QuantificationRange) {
  dataset(biosample: $biosample, source: $source) {
    accession
    transcript_quantification_files(assembly: $assembly) {
      accession
      quantifications(tpm_range: $tpm_range) {
        gene {
          name
        }
        transcript {
          id
        }
        tpm
      }
    }
  }
}
```

variables:
```json
{
  "biosample": [ "GM12878" ],
  "source": "ENCODE",
  "assembly": "GRCh38",
  "tpm_range": {
    "low": 100,
    "high": 1000000
  }
}
```

## Scripts
Scripts for developement and testing can be found in importer/scripts and service/scripts
Scripts for building and pushing containers as well as deployment for both the service and importer, see scripts directory

## Infrastructure
Since this service is backed by a postgres database, you will need to set one up for each environment. 
For more on that, see the gcp-infrastructure project.

Both the importer and service will run in kubernetes. We only need one cluster per environment.

Building and Pushing Images
To build the importer and service, use

scripts/build-importer-image.sh $TAG_NAME
scripts/build-service-image.sh $TAG_NAME
The image will be tagged with TAG_NAME, usually we put a version here. ie. v1.0.0

To push these build importer and service images to GCR, use

scripts/build-importer-image.sh $TAG_NAME
scripts/build-service-image.sh $TAG_NAME

## One-time Deploy Prep
Besides setting up the infrastructure (k8s cluster and postgres instance), there is one other one-time operation required before running the importer and deploying the service.
- `scripts/create-secrets.sh`

This will add the username and password for the postgres database to the kubernetes cluster as a secret.

## Running the Importer
The importer runs as a "job" in kubernetes. It will take hours. How many depends on the configuration. It does not remove itself upon completion, so make sure to check the logs to see the status of the import and remove upon completion.
- `scripts/run-importer.sh $ENV_NAME $SCHEMA_NAME`

ENV_NAME is the name of the environment (ie. "staging") corresponding to the k8s configuration filename for that environment. A good naming convention is "import_DAY_MONTH_YEAR".
SCHEMA_NAME is the name of the schema you're importing to. This should NEVER be a schema the service is currently pointing at. We don't want to wipe out a schema that's currently in use.

## Deploying the Service
After every successful import against a new schema you should deploy the service. To do so, run
- `scripts/deploy-service.sh $ENV_NAME $SCHEMA_NAME`

ENV_NAME is the name of the environment (ie. "staging") corresponding to the k8s configuration filename for that environment.
SCHEMA_NAME is the name of the schema you want to point the service at.

## Deleting the old schema
After pointing the service at a new schema, you'll need to delete the old one. You can do this by connecting to the db using 
- `scripts/connect-to-db.sh $ENV_NAME`

After running this script and following it's instructions you should see a psql repl. The following sql commands will come in handy:
- `select nspname from pg_catalog.pg_namespace;` Gets all schemas in the database.
- `drop schema $SCHEMA_NAME cascade;` Drops the given SCHEMA_NAME.
