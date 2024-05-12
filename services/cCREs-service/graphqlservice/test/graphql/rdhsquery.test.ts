import request, { Response } from "supertest";
import { Express } from "express";

import App from "../../src/app";
let app: Express | null = null;

const zquery = `
query rdhss(
  $assembly: String!
  $accession: [String!]
  $zscore_experiments: [String!]
) {
  rDHSQuery(
    assembly: $assembly
    accession: $accession
  ) {
    zScores(experiments: $zscore_experiments) {
      experiment
    }
    dnaseZ: maxZ(assay: "DNase")
  }
}
`;

const query = `
query rdhss(
  $assembly: String!
  $coordinates: [GenomicRangeInput!]
  $accession: [String!]
) {
  rDHSQuery(
    assembly: $assembly
    coordinates: $coordinates
    accession: $accession
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

const squery = `
query rdhss(
  $assembly: String!
  $coordinates: [GenomicRangeInput!]
  $accession: [String!]
  $half_width: Int
) {
  rDHSQuery(
    assembly: $assembly
    coordinates: $coordinates
    accession: $accession
  ) {
    accession
    sequence(half_width: $half_width)
  }
}
`;

const C1 = { chromosome: "chr1", start: 110952071, end: 110960000 };
const C2 = { chromosome: "chr1", start: 110960000, end: 110970000 };

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
        expect(response.body.data.rDHSQuery.length).toBe(11);
    });

    test("should return cCREs for given accessions", async () => {
      const variables = {
          assembly: "grch38",
          accession: [ "EH38D2203235", "EH38D0000000" ]
      };
      const response: Response = await request(app)
          .post("/graphql")
          .send({ query, variables });
      expect(response.status).toBe(200);
      expect(response.body.data.rDHSQuery.length).toBe(1);
    });

    test("should return rDHSs for given accessions with Z-scores", async () => {
      const variables = {
          assembly: "grch38",
          accession: [ "EH38D2203235", "EH38D0000000" ]
      };
      const response: Response = await request(app)
          .post("/graphql")
          .send({ query: zquery, variables });          
      expect(response.status).toBe(200);
      expect(response.body.data.rDHSQuery[0].zScores).toContainEqual({
        experiment: "ENCSR000EPH"
      });
      expect(response.body.data.rDHSQuery[0].dnaseZ).toBeCloseTo(0.43849111);
    });

    test("should return rDHSs for given accessions with sequence", async () => {
      const variables = {
          assembly: "grch38",
          accession: [ "EH38D2203240" ]
      };
      const response: Response = await request(app)
          .post("/graphql")
          .send({ query: squery, variables });          
      expect(response.status).toBe(200);
      expect(response.body.data.rDHSQuery[0].sequence).toEqual("NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN");
    });

    test("should return rDHSs for given accessions with sequence", async () => {
      const variables = {
          assembly: "grch38",
          accession: [ "EH38D2203240" ],
          half_width: 400
      };
      const response: Response = await request(app)
          .post("/graphql")
          .send({ query: squery, variables });          
      expect(response.status).toBe(200);
      expect(response.body.data.rDHSQuery[0].sequence.length).toBe(800);
   });

});
