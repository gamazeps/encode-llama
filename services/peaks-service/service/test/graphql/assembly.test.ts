import request, { Response } from "supertest";

import app from "../../src/app";

const query = `
  query Assemblies($species: String) {
    assemblies(species: $species) {
        name,
        species
    }
  }
`;

describe("assembly query", () => {
    test("should return two genomic assemblies", async () => {
        const variables = {};
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.assemblies.length).toBe(4);
        expect(response.body.data.assemblies).toContainEqual({ name: "hg19", species: "Homo sapiens" });
        expect(response.body.data.assemblies).toContainEqual({ name: "GRCh38", species: "Homo sapiens" });
        expect(response.body.data.assemblies).toContainEqual({ name: "mm10", species: "Mus musculus" });
    });

    test("should return no genomic assemblies for mouse", async () => {
        const variables = { species: "Mus musculus" };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.assemblies.length).toBe(2);
    });

    test("should return two genomic assemblies for human", async () => {
        const variables = { species: "Homo sapiens" };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.assemblies.length).toBe(2);
        expect(response.body.data.assemblies).toContainEqual({ name: "hg19", species: "Homo sapiens" });
        expect(response.body.data.assemblies).toContainEqual({ name: "GRCh38", species: "Homo sapiens" });
    });
});
