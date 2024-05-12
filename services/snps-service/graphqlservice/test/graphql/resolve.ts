import request, { Response } from "supertest";

import app from "../../src/app";

const query = `
query snp($assembly: String!, $id: String!) {
  resolve(assembly: $assembly, id: $id) {
    id
    coordinates {
      chromosome
      start
      end
    }
  }
}
`;

describe("resolve SNPs by ID", () => {

    test("should resolve rs114979547", async () => {
        const variables = {
            assembly: "hg38",
            id: "rs171"
        };
        const response: Response = await request(app).post("/graphql").send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.resolve.length).toBe(1);
        expect(response.body.data.resolve).toContainEqual({
            coordinates: {
                chromosome: "chr1",
                end: 175261679,
                start: 175261678
            },
            id: "rs171"
        });
    });

});
