import request, { Response } from "supertest";

import app from "../../src/app";

const query = `
query snp($assembly: String!, $snpids: [String!]) {
  snpQuery(assembly: $assembly, snpids: $snpids) {
    id
    minorAlleleFrequency {
      sequence
      frequency
      eas_af
      eur_af
      sas_af
      afr_af
      amr_af
    }
  }
}
`;

const mquery = `
query maf($positions: [PositionInput!]!) {
  maf(positions: $positions) {
    refAllele
    minorAlleles {
      sequence
      frequency
      eas_af
    }
    position {
      chromosome
      position
    }
    snp
  }
}
`;

describe("MAF", () => {

    test("should return SNPs for given SNP ids", async () => {
        const variables = { assembly: "hg38", snpids: [ "rs10267" ] };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.snpQuery.length).toBe(1);
        expect(response.body.data.snpQuery).toContainEqual({
            id: "rs10267",
            minorAlleleFrequency: [{
                afr_af: 0.5151,
                amr_af: 0.9035,
                eas_af: 0.999,
                eur_af: 0.9205,
                frequency: 0.835863,
                sas_af: 0.9663,
                sequence: "C"
            }]
        });
    });

    test("should return SNPs with MAF for a coordinate", async () => {
      const variables = { positions: [{ chromosome: "chr1", position: 56594 }] };
      const response: Response = await request(app).post("/graphql").send({ query: mquery, variables });
      expect(response.status).toBe(200);
      expect(response.body.data.maf.length).toBe(1);
      expect(response.body.data.maf).toContainEqual({
        refAllele: "G",
        snp: "rs562146900",
        minorAlleles: [{
          frequency: 0.000199681,
          sequence: "A",
          eas_af: 0.001
        }],
        position: {
          chromosome: "chr1",
          position: 56594
        }
      });
    });

});
