import request, { Response } from "supertest";
import { Express } from "express";

import App from "../../src/app";
let app: Express | null = null;

const query = `
query zscores(
  $experiment: [String!]
  $rDHS: [String!]
  $minimum_score: Float
  $maximum_score: Float
  $assembly: String!
) {
  zScoreQuery(
    experiment: $experiment
    rDHS: $rDHS
    minimum_score: $minimum_score
    maximum_score: $maximum_score
    assembly: $assembly
  ) {
    experiment
    rDHS
    score
  }
}
`;

describe("GraphQL layer", () => {

    beforeAll( async () => {
      app = await App;
    });

    test("should return Z-scores above a minimum", async () => {
        const variables = {
            assembly: "grch38",
            minimum_score: 2
        };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.zScoreQuery.length).toBe(3294);
    });

    test("should stream Z-scores for a given experiment accession", async (done) => {
      const variables = {
        assembly: "grch38",
        experiment: [ "ENCSR000EPH" ]
      };
      const r = request(app).post("/stream-active-rdhss").send(variables);
      r.end((_, y) => {
        expect(y.text.split("\n").length).toBe(4989);
        done();
      });
    });

    test("should return Z-scores below a maximum", async () => {
      const variables = {
          assembly: "grch38",
          maximum_score: -9.9
      };
      const response: Response = await request(app)
          .post("/graphql")
          .send({ query, variables });
      expect(response.status).toBe(200);
      expect(response.body.data.zScoreQuery.length).toBe(10682);
    });

    test("should return Z-scores for a given experiment accession", async () => {
      const variables = {
          assembly: "grch38",
          experiment: "ENCSR000EPH"
      };
      const response: Response = await request(app)
          .post("/graphql")
          .send({ query, variables });
      expect(response.status).toBe(200);
      expect(response.body.data.zScoreQuery.length).toBe(66784);
    });

    test("should return Z-scores for a given experiment accession", async () => {
      const variables = {
          assembly: "grch38",
          experiment: "ENCSR000AAA"
      };
      const response: Response = await request(app)
          .post("/graphql")
          .send({ query, variables });
      expect(response.status).toBe(200);
      expect(response.body.data.zScoreQuery.length).toBe(0);
    });

    test("should return Z-scores for a given rDHS", async () => {
      const variables = {
          assembly: "grch38",
          rDHS: "EH38D2203235"
      };
      const response: Response = await request(app)
          .post("/graphql")
          .send({ query, variables });
      expect(response.status).toBe(200);
      expect(response.body.data.zScoreQuery.length).toBe(1);
    });

});
