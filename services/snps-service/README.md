# SNP Service
The SNP Service is a GraphQL service for retrieving metadata related to SNPs, including SNP coordinates, allele frequency, linkage
disequilibrium, and identification in genome-wide association studies. The service compiles data from several external sources:

* SNP coordinates for hg19 and hg38 from dbSNP
* LD blocks for five populations from HaploReg
* Minor allele frequencies for five populations from 1,000 Genomes
* GWAS information from the NHGRI catalog
* Cell type specific regulatory element enrichment for each GWAS, computed using ENCODE data
* eQTLs from PsychENCODE

## API
The API provides three root-level queries. The `snpQuery` filters SNPs according to provided criteria and returns metadata about them.
The `genomeWideAssociationQuery` filters GWAS by provided criteria and returns metadata about each study along with metadata for identified
lead SNPs. The `eQTLQuery` searches for eQTLs using provided criteria.

The following example query retrieves information for all hg38 SNPs within a given region on chromosome 1:

```graphql
query snp($assembly: String!, $coordinates: GenomicRangeInput) {
  snpQuery(assembly: $assembly, coordinates: $coordinates) {
    rsId
    coordinates {
      chromosome
      start
      end
    }
    refAllele {
      sequence
      frequency
    }
  }
}
```

Variables will look like this:
```json
{ 
  "assembly": "hg38",
  "coordinates": {
    "chromosome": "chr1",
    "start": 1000000,
    "end": 1100000
  }
}
```

You can return LD, MAF, and GWAS information for returned SNPs. The following query searches for a known SNP
with rsID `rs3794102`, then returns:

* all GWAS associated with the matching SNP
* all other SNPs in LD in the American population (r-squared > 0.7)
* all minor alleles for the SNP and their frequencies in the American population

```graphql
query snp($assembly: String!, $coordinates: GenomicRangeInput) {
  snpQuery(assembly: $assembly, coordinates: $coordinates) {
    rsId
    genomeWideAssociation {
      pubMedId
      name
      author
    }
    linkageDisequilibrium(population: "AMR", rSquaredThreshold: 0.7) {
      rsId,
      rSquared
    }
    minorAlleleFrequency {
      sequence
      frequency
      amr_af
    }
  }
}
```

variables:
```json
{ 
  "assembly": "hg38", 
  "snpids": [ "rs3794102" ]
}
```

Alternatively, you can search by GWAS. The following query returns all GWAS associated with a known
PubMed ID (21130836). The result contains:
* study metadata, including the traits studied and the author
* all identified SNPs, their coordinates, and all SNPs in LD with them in the European population (r-squared > 0.7)
* datasets from ENCODE with regulatory element enrichment for SNPs identified in the study

```graphql
query gwas($assembly: String!, $pmIds: [Int]) {
  genomeWideAssociationQuery(assembly: $assembly, pmIds: $pmIds) {
    pubMedId
    name
    author
    cellTypeEnrichment {
      encodeId
      fdr
    }
    leadSNPs {
      rsId
      coordinates {
        chromosome
	start
	end
      }
      linkageDisequilibrium(population: "EUR", rSquaredThreshold: 0.7) {
        rsId
      }
    }
  }
}
```

variables:
```json
{
  "assembly": "hg38",
  "pmIds": [ 21130836 ]
}
```

## For contributors

### Building
* Run `yarn install` to install dependencies.

### Testing
You must have Node.js and docker-compose installed. Run the below scripts in the graphqlservice folder:
* `scripts/test.sh` to spin up dependences and run automated tests.
* `yarn test` to run tests without spinning up dependencies.
* `scripts/run-dependencies.sh` to stand up Postgres with dummy data. `scripts/test.sh` runs this for you.
* `scripts/stop-dependencies.sh` to stop bring down Postgres.
