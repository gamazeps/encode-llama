import request, { Response } from "supertest";

import app from "../../src/app";

const query = `
query snp($assembly: String!, $snpids: [String!], $gene_id: [String!], $tissue: [String!]) {
  snpQuery(assembly: $assembly, snpids: $snpids) {
    id
    gtex_eQTLs(gene_id: $gene_id, tissue: $tissue) {
      tissue
      gene_id
      pval_nominal
    }
  }
}
`;

describe("MAF", () => {

    test("should return eQTLs in two tissues for a given SNP", async () => {
        const variables = { assembly: "hg38", snpids: [ "rs114979547" ] };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.snpQuery.length).toBe(1);
        expect(response.body.data.snpQuery).toContainEqual({
            id: "rs114979547",
            gtex_eQTLs: [{
                gene_id: "ENSG00000227232.5",
                pval_nominal: 0.0000147345,
                tissue: "Whole_Blood"
            }, {
                gene_id: "ENSG00000227232.5",
                pval_nominal: 0.0000147345,
                tissue: "Ovary"
            }]
        });
    });

    test("should return no eQTLs for a given SNP/gene combination", async () => {
      const variables = { assembly: "hg38", snpids: [ "rs114979547" ], gene_id: [ "ENSG00000227231.5" ] };
      const response: Response = await request(app)
          .post("/graphql")
          .send({ query, variables });
      expect(response.status).toBe(200);
      expect(response.body.data.snpQuery.length).toBe(1);
      expect(response.body.data.snpQuery).toContainEqual({
          id: "rs114979547",
          gtex_eQTLs: []
      });
    });

    test("should return one eQTL for a given SNP/tissue combination", async () => {
      const variables = { assembly: "hg38", snpids: [ "rs114979547" ], tissue: "Ovary" };
      const response: Response = await request(app)
          .post("/graphql")
          .send({ query, variables });
      expect(response.status).toBe(200);
      expect(response.body.data.snpQuery.length).toBe(1);
      expect(response.body.data.snpQuery).toContainEqual({
          id: "rs114979547",
          gtex_eQTLs: [{
            gene_id: "ENSG00000227232.5",
            pval_nominal: 0.0000147345,
            tissue: "Ovary"
          }]
      });
    });

});
