import request, { Response } from "supertest";
import { Express } from "express";

import App from "../../src/app";
let app: Express | null = null;

const query = `
  query resolve($id: String!, $assembly: String!) {
    resolve(id: $id, assembly: $assembly) {
      id
      coordinates {
        chromosome
        start
        end
      }
    }
  }
`;

describe("gene query", () => {
    beforeAll( async () => {
        app = await App;
      });
    test("should return one gene with name DDX11L1", async () => {
        const variables = {
            id: "DDX11L1",
            assembly: "GRCh38"
        };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.resolve.length).toBe(1);
        expect(response.body.data.resolve).toContainEqual({
            id: "ENSG00000223972.5",
            coordinates: {
                chromosome: "chr1",
                start: 11869,
                end: 14409
            }
        });
    });

    test("should return one gene with id ENSG00000223972.5", async () => {
        const variables = {
            id: "ENSG00000223972.5",
            assembly: "GRCh38"
        };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.resolve.length).toBe(1);
        expect(response.body.data.resolve).toContainEqual({
            id: "ENSG00000223972.5",
            coordinates: {
                chromosome: "chr1",
                start: 11869,
                end: 14409
            }
        });
    });

    test("should return one transcript with id ENST00000456328.2", async () => {
        const variables = {
            id: "ENST00000456328.2",
            assembly: "GRCh38"
        };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.resolve.length).toBe(1);
        expect(response.body.data.resolve).toContainEqual({
            id: "ENST00000456328.2",
            coordinates: {
                chromosome: "chr1",
                start: 11869,
                end: 14409
            }
        });
    });
    
});
