import request, { Response } from "supertest";

import app from "../../src/app";

const query = `
query snp($assembly: String!, $snpids: [String!]) {
  snpQuery(assembly: $assembly, snpids: $snpids) {
    id
    linkageDisequilibrium(population: AFRICAN) {
      id
      rSquared
      dPrime
      coordinates(assembly: $assembly) {
        chromosome
        start
        end
      }
      snp(assembly: $assembly) {
        id
      }
    }
  }
}
`;

describe("LD", () => {

    test("should return SNPs for given SNP ids", async () => {
        const variables = { assembly: "hg38", snpids: [ "rs171" ] };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.snpQuery.length).toBe(1);
        expect(response.body.data.snpQuery).toContainEqual({
            linkageDisequilibrium: [{
                dPrime: 0.84,
                rSquared: 0.24,
                id: "rs242",
                snp: { id: "rs242" },
                coordinates: {
                    chromosome: 'chr1',
                    start: 20869460,
                    end: 20869461
                }
              }, {
                dPrime: 0.84,
                rSquared: 0.24,
                id: "rs538",
                snp: { id: "rs538" },
                coordinates: {
                    chromosome: 'chr1',
                    start: 6160957,
                    end: 6160958
                }
              }, {
                dPrime: 0.84,
                rSquared: 0.24,
                id: "rs546",
                snp: { id: "rs546" },
                coordinates: {
                    chromosome: 'chr1',
                    start: 93617545,
                    end: 93617546
                }
            }, {
              coordinates: null,
              dPrime: 0.99,
              rSquared: 0.99,
              id: "rs999999999999",
              snp: null
            }],
          id: "rs171"
        });
    });
});
