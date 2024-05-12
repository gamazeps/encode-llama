import request, { Response } from "supertest";

import app from "../../src/app";

const querywithexpcount = `
  query Targets($species: String, $lab: String, $project: String, $biosample: String) {
    targets(species: $species, lab: $lab, project: $project, target: $biosample) {
      name
      datasets {
        counts {
          total
        }
      }
    }
  }
`;

describe("target query", () => {
    test("can return targets with counts", async () => {
        const variables = { species: "Homo sapiens" };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: querywithexpcount, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.targets.length).toBe(4);
        expect(response.body.data.targets).toContainEqual({ name: "EP300", datasets: { counts: { total: 1 } } });
        expect(response.body.data.targets).toContainEqual({ name: "KDM5A", datasets: { counts: { total: 2 } } });
        expect(response.body.data.targets).toContainEqual({ name: "SMC3", datasets: { counts: { total: 1 } } });
        expect(response.body.data.targets).toContainEqual({ name: "ELF1", datasets: { counts: { total: 2 } } });
    });

    test("should return targets for mouse", async () => {
        const variables = { species: "Mus musculus" };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: querywithexpcount, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.targets.length).toBe(4);
    });
});
