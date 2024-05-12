import request, { Response } from "supertest";
import { Express } from "express";

import App from "../../src/app";
let app: Express | null = null;

const query = `
query biosamples(
  $assay: [String!]
  $name: [String!]
  $assembly: String!
) {
  ccREBiosampleQuery(
    assembly: $assembly
    name: $name
    assay: $assay
  ) {
    biosamples {
      name
      dnase_experiment: experimentAccession(assay: "DNase")
      dnase_file: fileAccession(assay: "DNase")
      umap_coordinates(assay: "DNase")
      ontology
      sampleType
      lifeStage
      ldr_enrichment(studies: [ "PASS_ADHD_Demontis2018", "PASS_Alzheimers_Jansen2019" ]) {
        study
        enrichment
        conditional_p
      }
      cCREZScores(accession: "EH38E2148278") {
        cCRE
        assay
        score
      }
      zscore_histogram(
        histogram_minimum: -10
        histogram_maximum: 10
        histogram_bins: 4
        assay: "dnase"
        assembly: "grch38"
      ) {
        bin
        count
      }
    }
    specificElements(assay: "DNase") {
      element {
        accession
      }
      specificity
    }
  }
}
`;

describe("GraphQL layer", () => {

    beforeAll( async () => {
      app = await App;
    });

    test("should return one biosample with given name", async () => {
        const variables = {
            assembly: "grch38",
            name: [ "MCF-7" ]
        };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.ccREBiosampleQuery.biosamples.length).toBe(1);
        expect(response.body.data.ccREBiosampleQuery.biosamples).toEqual([{
            name: 'MCF-7',
            dnase_experiment: 'ENCSR000EPH',
            dnase_file: 'ENCFF924FJR',
            umap_coordinates: [ 0, 1 ],
            ontology: "mammary gland",
            sampleType: "cell line",
            lifeStage: "adult",
            ldr_enrichment: [{
              conditional_p: -0.8908672332763672,
              enrichment: -0.008518964052200317,
              study: "PASS_ADHD_Demontis2018",
            }, {
              conditional_p: -0.055692560970783234,
              enrichment: 6.907843589782715,
              study: "PASS_Alzheimers_Jansen2019",
            }],
            cCREZScores: [{
              assay: "dnase",
              cCRE: "EH38E2148278",
              score: -10
            }],
            zscore_histogram: [{ bin: -10, count: 10682 }, { bin: -5, count: 29008 }, { bin: 0, count: 27092 }]
        }]);
        expect(response.body.data.ccREBiosampleQuery.specificElements.length).toBe(100);
    });

    test("should return one biosample with DNase", async () => {
      const variables = {
          assembly: "grch38",
          assay: [ "DNase" ]
      };
      const response: Response = await request(app)
          .post("/graphql")
          .send({ query, variables });
      expect(response.status).toBe(200);
      expect(response.body.data.ccREBiosampleQuery.biosamples.length).toBe(1);
      expect(response.body.data.ccREBiosampleQuery.biosamples).toEqual([{
          name: 'MCF-7',
          dnase_experiment: 'ENCSR000EPH',
          dnase_file: 'ENCFF924FJR',
          umap_coordinates: [ 0, 1 ],
          ontology: "mammary gland",
          sampleType: "cell line",
          lifeStage: "adult",
          ldr_enrichment: [{
            conditional_p: -0.8908672332763672,
            enrichment: -0.008518964052200317,
            study: "PASS_ADHD_Demontis2018",
          }, {
            conditional_p: -0.055692560970783234,
            enrichment: 6.907843589782715,
            study: "PASS_Alzheimers_Jansen2019",
          }],
          cCREZScores: [{
            assay: "dnase",
            cCRE: "EH38E2148278",
            score: -10
          }],
          zscore_histogram: [{ bin: -10, count: 10682 }, { bin: -5, count: 29008 }, { bin: 0, count: 27092 }]
      }]);
    });

    test("should return no biosamples within given name", async () => {
      const variables = {
          assembly: "grch38",
          name: [ "GM12878" ]
      };
      const response: Response = await request(app)
          .post("/graphql")
          .send({ query, variables });
      expect(response.status).toBe(200);
      expect(response.body.data.ccREBiosampleQuery.biosamples.length).toBe(0);
    });
    
    test("should return no biosamples with WGBS", async () => {
      const variables = {
          assembly: "grch38",
          assay: [ "WGBS" ]
      };
      const response: Response = await request(app)
          .post("/graphql")
          .send({ query, variables });
      expect(response.status).toBe(200);
      expect(response.body.data.ccREBiosampleQuery.biosamples.length).toBe(0);
    });

});
