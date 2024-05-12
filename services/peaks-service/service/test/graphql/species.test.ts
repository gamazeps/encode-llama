import request, { Response } from "supertest";

import app from "../../src/app";
import { db } from "../../src/postgres/connection";

const query = `
  query Species($project: String, $lab: String, $target: String, $biosample: String) {
    species(project: $project, lab: $lab, target: $target, biosample: $biosample) {
      name
    }
  }
`;

const querywithexpcount = `
  query Species($project: String, $lab: String, $target: String, $biosample: String) {
    species(project: $project, lab: $lab, target: $target, biosample: $biosample) {
      name
      datasets {
        counts {
          total
        }
      }
    }
  }
`;

describe("species query", () => {
    test("can return all species", async () => {
        const variables = {};
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.species.length).toBe(2);
        expect(response.body.data.species).toContainEqual({ name: "Homo sapiens" });
        expect(response.body.data.species).toContainEqual({ name: "Mus musculus" });
    });

    describe("can return species by project", () => {
        test("should return one species for ENCODE", async () => {
            const variables = { project: "ENCODE" };
            const response: Response = await request(app)
                .post("/graphql")
                .send({ query: querywithexpcount, variables });
            expect(response.status).toBe(200);
            expect(response.body.data.species.length).toBe(2);
            expect(response.body.data.species).toContainEqual({ name: "Homo sapiens", datasets: { counts: { total: 5 } } });
            expect(response.body.data.species).toContainEqual({ name: "Mus musculus", datasets: { counts: { total: 1 } } });
        });

        test("should return species for Cistrome", async () => {
            const variables = { project: "Cistrome" };
            const response: Response = await request(app)
                .post("/graphql")
                .send({ query: querywithexpcount, variables });
            expect(response.status).toBe(200);
            expect(response.body.data.species.length).toBe(2);
        });
    });
});
