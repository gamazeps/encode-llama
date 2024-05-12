import request, { Response } from "supertest";
import { Express } from "express";

import App from "../../src/app";
let app: Express | null = null;

const query = `
query ldr(
  $experiment: [String!]
  $study: [String!]
) {
  ldr(
    experiment: $experiment
    study: $study
  ) {
    biosample {
      name
    }
    study
    conditional_enrichment
  }
}
`;

describe("GraphQL layer", () => {

    beforeAll( async () => {
      app = await App;
    });

    test("should return all LDR results for two experiments", async () => {
        const variables = {
            experiment: [ "ENCSR000EPH" ]
        };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.ldr).toEqual([
          { biosample: { name: "MCF-7" }, conditional_enrichment: -7.334980978157546e-8, study: "PASS_ADHD_Demontis2018" },
          { biosample: { name: "MCF-7" }, conditional_enrichment: 2.317138125818019e-8, study: "PASS_AgeFirstBirth" },
          { biosample: { name: "MCF-7" }, conditional_enrichment: -6.999223978176872e-10, study: "PASS_Alzheimers_Jansen2019" }
        ]);
    });

    test("should return all LDR results for two experiments", async () => {
      const variables = {
          experiment: [ "ENCSR000EPH" ],
          study: [ "PASS_ADHD_Demontis2018", "PASS_Alzheimers_Jansen2019" ]
      };
      const response: Response = await request(app)
          .post("/graphql")
          .send({ query, variables });
      expect(response.status).toBe(200);
      expect(response.body.data.ldr).toEqual([
        { biosample: { name: "MCF-7" }, conditional_enrichment: -7.334980978157546e-8, study: "PASS_ADHD_Demontis2018" },
        { biosample: { name: "MCF-7" }, conditional_enrichment: -6.999223978176872e-10, study: "PASS_Alzheimers_Jansen2019" }
      ]);
  });

});
