import request, { Response } from "supertest";
import app from "../../src/app";

const query = `
  query Biosamples($species: String, $lab: String, $project: String, $target: String,$searchterm: [String]) {
    biosamples(species: $species, lab: $lab, project: $project, target: $target,searchterm:$searchterm) {
      name
    }
  }
`;
const querywithexpcount = `
  query Biosamples($species: String, $lab: String, $project: String, $target: String,$searchterm: [String]) {
    biosamples(species: $species, lab: $lab, project: $project, target: $target,searchterm:$searchterm) {
      name
      datasets {
        counts {
          total
        }
      }
    }
  }
`;

describe("biosample query", () => {
    test("should return the correct biosamples", async () => {
        const variables = { searchterm: ["chip-seq"] };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.biosamples.length).toBe(6);
        expect(response.body.data.biosamples).toContainEqual({ name: "GM12878" });
        expect(response.body.data.biosamples).toContainEqual({ name: "A549" });
        expect(response.body.data.biosamples).toContainEqual({ name: "MCF-7" });
    });
    test("should return one biosample for mouse", async () => {
        const variables = { species: "Mus musculus", searchterm: ["chip-seq"] };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: querywithexpcount, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.biosamples.length).toBe(1);
    });
    test("should return counts biosamples", async () => {
        const variables = { searchterm: ["chip-seq"] };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: querywithexpcount, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.biosamples.length).toBe(6);
        expect(response.body.data.biosamples).toContainEqual({ name: "A549", datasets: { counts: { total: 2 } } });
    });
});
