import request, { Response } from "supertest";
import { Express } from "express";

import App from "../../src/app";
let app: Express | null = null;

const linkedgeneQuery = `
query ccrelinkedGenesQuery(
  $assembly: String
  $accession: [String!]) {
  linkedGenesQuery(
    assembly:  $assembly
    accession: $accession
  ) {
    assembly
    accession
    experiment_accession
    celltype
    gene
    assay

  }
}
`

const query = `
query ccres(
  $assembly: String!
  $coordinates: [GenomicRangeInput!]
  $accession: [String!]
  $group: [String!]
  $rDHS: [String!]
  $ctcf_bound: Boolean
) {
  cCREQuery(
    assembly: $assembly
    coordinates: $coordinates
    accession: $accession
    rDHS: $rDHS
    group: $group
    ctcf_bound: $ctcf_bound
  ) {
    accession
    coordinates {
      chromosome
      start
      end
    }
  }
}
`;

const screenquery = `
query {
  cCRESCREENSearch(
      accessions: ["EH38E2148200"]
      assembly: "GRCh38"
      coord_chrom: "chr22"
      coord_end: 11056322
      coord_start: 11055993
      rank_ctcf_end: 10
      rank_ctcf_start: -10
      rank_dnase_end: 10
      rank_dnase_start: -10
      rank_enhancer_end: 10
      rank_enhancer_start: -10
      rank_promoter_end: 10
      rank_promoter_start: -10
  ) {
    chrom
    start
    len
    pct
    dnase_zscore
    info {
      accession
    }
  }
}`;

const screenqueryct = `
query($t: Int!) {
  cCRESCREENSearch(
      accessions: ["EH38E2148200"]
      assembly: "GRCh38"
      coord_chrom: "chr22"
      coord_end: 11056322
      coord_start: 11055993
      rank_ctcf_end: 10
      rank_ctcf_start: -10
      rank_dnase_end: 10
      rank_dnase_start: $t
      rank_enhancer_end: 10
      rank_enhancer_start: -10
      rank_promoter_end: 10
      rank_promoter_start: -10
      cellType: "MCF-7"
  ) {
    chrom
    start
    len
    pct
    dnase_zscore
    info {
      accession
    }
    rfacets
    ctspecific {
      ct
      dnase_zscore
      h3k27ac_zscore
    }
  }
}`;

const gquery = `
query ccres(
  $assembly: String!
  $accession: [String!]
) {
  cCREQuery(
    assembly: $assembly
    accession: $accession
  ) {
    accession
    gtex_decorations {
      state
      proximal
      ctcf_bound
      tissue
      allele_specific
    }
  }
}
`;

const zquery = `
query ccres(
  $assembly: String!
  $accession: [String!]
  $zscore_experiments: [String!]
) {
  cCREQuery(
    assembly: $assembly
    accession: $accession
  ) {
    accession
    zScores(experiments: $zscore_experiments) {
      score
      experiment
    }
    dnaseZ: maxZ(assay: "DNase")
  }
}
`;

const squery = `
query ccres(
  $assembly: String!
  $id: String!
) {
  suggest(
    assembly: $assembly
    id: $id
  ) {
    id
  }
}
`;

const aquery = `
query ccres(
  $assembly: String!
  $active_experiments: [String!]
) {
  cCREQuery(
    assembly: $assembly
    activeInBiosamples: $active_experiments
  ) {
    accession
  }
}
`;

const C1 = { chromosome: "chr22", start: 11055994, end: 11285909 };
const C2 = { chromosome: "chr22", start: 11355994, end: 11385909 };

describe("GraphQL layer", () => {

    beforeAll( async () => {
      app = await App;
    });

    test("should return cCREs within given coordinates", async () => {
        const variables = {
            assembly: "grch38",
            coordinates: [ C1, C2 ]
        };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.cCREQuery.length).toBe(9);
    });

    test("should return cCREs active in a given experiment", async () => {
      const variables = {
          assembly: "grch38",
          active_experiments: [ "ENCSR000EPH" ]
      };
      const response: Response = await request(app)
          .post("/graphql")
          .send({ query: aquery, variables });
      expect(response.status).toBe(200);
      expect(response.body.data.cCREQuery.length).toBe(0);
  });

    test("should return cCREs for given accessions", async () => {
      const variables = {
          assembly: "grch38",
          accession: [ "EH38E2148200", "EH38E2148231", "EH38E0000000" ]
      };
      const response: Response = await request(app)
          .post("/graphql")
          .send({ query, variables });
      expect(response.status).toBe(200);
      expect(response.body.data.cCREQuery.length).toBe(2);
    });

    test("should return cCREs for given accessions with Z-scores", async () => {
      const variables = {
          assembly: "grch38",
          accession: [ "EH38E0000000", "EH38E2148278" ],
          zscore_experiments: [ "ENCSR000EPH" ]
      };
      const response: Response = await request(app)
          .post("/graphql")
          .send({ query: zquery, variables });
      expect(response.status).toBe(200);
      expect(response.body.data.cCREQuery.length).toBe(1);
      expect(response.body.data.cCREQuery[0].dnaseZ).toBe(-10);
    });

    test("should return cCREs for a given group", async () => {
      const variables = {
          assembly: "grch38",
          group: [ "CTCF-only" ]
      };
      const response: Response = await request(app)
          .post("/graphql")
          .send({ query, variables });
      expect(response.status).toBe(200);
      expect(response.body.data.cCREQuery.length).toBe(615);
    });

    test("should return cCREs for given rDHS accessions", async () => {
      const variables = {
          assembly: "grch38",
          rDHS: [ "EH38D2203240", "EH38D3350329", "EH38D0000000" ]
      };
      const response: Response = await request(app)
          .post("/graphql")
          .send({ query, variables });
      expect(response.status).toBe(200);
      expect(response.body.data.cCREQuery.length).toBe(2);
    });

    test("should return cCREs where CTCF is present", async () => {
      const variables = {
          assembly: "grch38",
          ctcf_bound: true
      };
      const response: Response = await request(app)
          .post("/graphql")
          .send({ query, variables });
      expect(response.status).toBe(200);
      expect(response.body.data.cCREQuery.length).toBe(8004);
    });

    test("should return cCREs where CTCF is present", async () => {
      const variables = {
          assembly: "grch38",
          id: "EH38E214820"
      };
      const response: Response = await request(app)
          .post("/graphql")
          .send({ query: squery, variables });
      expect(response.status).toBe(200);
      expect(response.body.data.suggest.length).toBe(6);
    });

    test("should return cCREs with GTEx annotations", async () => {
      const variables = {
          assembly: "grch38",
          accession: "EH38E2148200"
      };
      const response: Response = await request(app)
          .post("/graphql")
          .send({ query: gquery, variables });
      expect(response.status).toBe(200);
      expect(response.body.data.cCREQuery.length).toBe(1);
      expect(response.body.data.cCREQuery[0]).toEqual({"accession": "EH38E2148200", "gtex_decorations": [{"allele_specific": false, "ctcf_bound": false, "proximal": false, "state": "ACTIVE", "tissue": "adrenal_gland"}, {"allele_specific": false, "ctcf_bound": false, "proximal": false, "state": "ACTIVE", "tissue": "body_of_pancreas"}, {"allele_specific": false, "ctcf_bound": false, "proximal": false, "state": "BIVALENT", "tissue": "adrenal_gland"}, {"allele_specific": false, "ctcf_bound": false, "proximal": false, "state": "REPRESSED", "tissue": "adrenal_gland"}, {"allele_specific": false, "ctcf_bound": false, "proximal": false, "state": "REPRESSED", "tissue": "esophagus_muscularis_mucosa"}, {"allele_specific": false, "ctcf_bound": false, "proximal": false, "state": "REPRESSED", "tissue": "gastrocnemius_medialis"}, {"allele_specific": false, "ctcf_bound": false, "proximal": false, "state": "REPRESSED", "tissue": "Peyers_patch"}, {"allele_specific": false, "ctcf_bound": false, "proximal": false, "state": "REPRESSED", "tissue": "stomach"}, {"allele_specific": false, "ctcf_bound": false, "proximal": false, "state": "REPRESSED", "tissue": "tibial_nerve"}, {"allele_specific": false, "ctcf_bound": false, "proximal": false, "state": "ACTIVE", "tissue": "adrenal_gland"}, {"allele_specific": false, "ctcf_bound": false, "proximal": false, "state": "ACTIVE", "tissue": "body_of_pancreas"}, {"allele_specific": false, "ctcf_bound": false, "proximal": false, "state": "REPRESSED", "tissue": "esophagus_muscularis_mucosa"}, {"allele_specific": false, "ctcf_bound": false, "proximal": false, "state": "REPRESSED", "tissue": "gastrocnemius_medialis"}, {"allele_specific": false, "ctcf_bound": false, "proximal": false, "state": "REPRESSED", "tissue": "Peyers_patch"}, {"allele_specific": false, "ctcf_bound": false, "proximal": false, "state": "REPRESSED", "tissue": "stomach"}, {"allele_specific": false, "ctcf_bound": false, "proximal": false, "state": "REPRESSED", "tissue": "tibial_nerve"}]});
    });

    test("should perform a SCREEN search", async () => {
      const response: Response = await request(app)
          .post("/graphql")
          .send({ query: screenquery });
      expect(response.status).toBe(200);
      expect(response.body.data.cCRESCREENSearch).toEqual([
        {
          chrom: 'chr22',
          start: 11055994,
          len: 327,
          pct: 'CTCF-only',
          dnase_zscore: -0.2808300852775574,
          info: {
            accession: "EH38E2148200"
          }
        }
      ]);
    });

    test("should perform a SCREEN search with cell type specificity", async () => {
      const response: Response = await request(app)
          .post("/graphql")
          .send({ query: screenqueryct, variables: { t: -10 } });
      expect(response.status).toBe(200);
      expect(response.body.data.cCRESCREENSearch).toEqual([
        {
          chrom: 'chr22',
          start: 11055994,
          len: 327,
          pct: 'CTCF-only',
          dnase_zscore: -0.2808300852775574,
          info: {
            accession: "EH38E2148200"
          },
          ctspecific: {
            ct: "MCF-7",
            dnase_zscore: -0.2808300852775574,
            h3k27ac_zscore: null
          },
          rfacets: [ "dnase" ]
        }
      ]);
      const rresponse: Response = await request(app)
          .post("/graphql")
          .send({ query: screenqueryct, variables: { t: 3 } });
      expect(rresponse.status).toBe(200);
      expect(rresponse.body.data.cCRESCREENSearch).toEqual([]);
    });

    test("should linked genes for given cCRE", async () => {
      const variables = {
          accession: ["EH38D0372911"]
      };
      const response: Response = await request(app)
          .post("/graphql")
          .send({ query: linkedgeneQuery, variables });
      expect(response.status).toBe(200);
      expect(response.body.data.linkedGenesQuery.length).toBe(1);
    });

});
