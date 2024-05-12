import request, { Response } from "supertest";

import app from "../../src/app";

const snpAssociationQuery = `
query snpAssociation($disease: String!, $snpid: String, $limit: Int) {
    snpAssociationsQuery(disease: $disease, snpid: $snpid, limit: $limit) { 
        disease
        snpid
        a1
        a2
        n
        z
        chisq
    }
}
`

const gwassnpAssociationQuery = `
query gwassnpAssociation($disease: String!, $snpid: String, $limit: Int) {
    gwassnpAssociationsQuery(disease: $disease, snpid: $snpid, limit: $limit) { 
        disease
        snpid
        chrom 
        start
        stop
        riskallele
        associated_gene
        association_p_val
        analyses_identifying_snp
    }
}
`
const gwasintersectingSnpsWithCcreQuery =`
query gwasintersectingSnpsWithCcre($disease: String!, $snpid: String, $limit: Int) {
    gwasintersectingSnpsWithCcreQuery(disease: $disease, snpid: $snpid, limit: $limit){
        disease
        snpid
        snp_chrom 
        snp_start
        snp_stop
        riskallele
        associated_gene
        association_p_val
        ccre_chrom
        ccre_start
        ccre_stop
        rdhsid
        ccreid
        ccre_class

    }

}

`



const gwasintersectingSnpsWithBcreQuery =`
query gwasintersectingSnpsWithBcre($disease: String!, $snpid: String, $limit: Int, $bcre_group: String,) {
    gwasintersectingSnpsWithBcreQuery(disease: $disease, snpid: $snpid, limit: $limit, bcre_group: $bcre_group){
        disease
        snpid
        snp_chrom 
        snp_start
        snp_stop
        riskallele
        associated_gene
        association_p_val
        ccre_chrom
        ccre_start
        ccre_stop
        rdhsid
        ccreid
        ccre_class
        bcre_group
    }

}

`

const query = `
query snp($assembly: String!, $snpids: [String], $common: Boolean, $coordinates: [GenomicRangeInput]) {
  snpQuery(assembly: $assembly, snpids: $snpids, common: $common, coordinates: $coordinates) {
    id
    coordinates {
      chromosome
      start
      end
    }
    refAllele
    refFrequency
  }
}
`;

const densityQuery = `
query snp($assembly: String!, $coordinates: [GenomicRangeInput]) {
  snpDensityQuery(assembly: $assembly, coordinates: $coordinates, resolution: 100000) {
    total
    common
    coordinates {
      chromosome
      start
      end
    }
  }
}
`;

const snpAutocompleteQuery = `
query snp($assembly: String!, $snpid: String!) {
  snpAutocompleteQuery(assembly: $assembly, snpid: $snpid) {
    id
    coordinates {
      chromosome
      start
      end
    }
  }
}
`;

describe("SNPs", () => {

    test("should return SNPs for given SNP ids", async () => {
        const variables = { assembly: "hg38", snpids: ["rs171", "rs242"] };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.snpQuery.length).toBe(2);
        expect(response.body.data.snpQuery).toContainEqual({
            coordinates: {
                chromosome: "chr1",
                end: 175261679,
                start: 175261678
            },
            refAllele: null,
            refFrequency: null,
            id: "rs171"
        });
        expect(response.body.data.snpQuery).toContainEqual({
            coordinates: {
                chromosome: "chr1",
                end: 20869461,
                start: 20869460
            },
            refAllele: null,
            refFrequency: null,
            id: "rs242"
        });
    });

    test("should return two common SNP for chr1:100000-200000", async () => {
        const variables = {
            assembly: "hg38",
            coordinates: [{
                chromosome: "chr1",
                start: 500000,
                end: 1000000
            }],
            common: true
        };
        const response: Response = await request(app)
                .post("/graphql")
                .send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.snpQuery.length).toBe(45);
    });

    test("should return density chr1:0-200000", async () => {
        const variables = {
            assembly: "hg38",
            coordinates: [{
                chromosome: "chr1",
                start: 0,
                end: 200000
            }]
        };
        const response: Response = await request(app)
                .post("/graphql")
                .send({ query: densityQuery, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.snpDensityQuery.length).toBe(3);
        expect(response.body.data.snpDensityQuery).toContainEqual({
            coordinates: {
                chromosome: "chr1",
                start: 0,
                end: 100000
            },
            total: 467,
            common: 12
        });
        expect(response.body.data.snpDensityQuery).toContainEqual({
            coordinates: {
                chromosome: "chr1",
                start: 100000,
                end: 200000
            },
            total: 179,
            common: 2
        });
        expect(response.body.data.snpDensityQuery).toContainEqual({
            coordinates: {
                chromosome: "chr1",
                start: 200000,
                end: 300000
            },
            total: 56,
            common: 0
        });
    });

    test("should return one autocomplete result for hg38", async () => {
        const variables = {
            assembly: "hg38",
            snpid: "rs17"
        };
        const response: Response = await request(app).post("/graphql").send({ query: snpAutocompleteQuery, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.snpAutocompleteQuery.length).toBe(1);
        expect(response.body.data.snpAutocompleteQuery).toContainEqual({
            coordinates: {
                chromosome: "chr1",
                end: 175261679,
                start: 175261678
            },
            id: "rs171"
        });
    });

    test("should return snp associations for given disease and snpid", async () => {
        const variables = {
            disease: "AgeFirstBirth", snpid: "rs12562034"
        };
        const response: Response = await request(app).post("/graphql").send({ query: snpAssociationQuery, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.snpAssociationsQuery.length).toBe(1);       
        expect(response.body.data.snpAssociationsQuery).toContainEqual({
            a1: "A", a2: "G", chisq: null, disease: "AgeFirstBirth", n: 222037, snpid: "rs12562034", z: -0.4
        });
    });

    test("should return snp associations for given disease", async () => {
        const variables = {
            disease: "AgeFirstBirth",limit: 5
        };
        const response: Response = await request(app).post("/graphql").send({ query: snpAssociationQuery, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.snpAssociationsQuery.length).toBe(5);       
        
    });

    test("should return gwas snp associations for given disease", async () => {
        const variables = {
            disease: "YearsEducation"
        };
        const response: Response = await request(app).post("/graphql").send({ query: gwassnpAssociationQuery, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.gwassnpAssociationsQuery.length).toBe(193);       
        
    });

    test("should return intersecting gwas snp associations with ccres for given disease", async () => {
        const variables = {
            disease: "ASD"
        };
        const response: Response = await request(app).post("/graphql").send({ query: gwasintersectingSnpsWithCcreQuery, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.gwasintersectingSnpsWithCcreQuery.length).toBe(28);       
        
    });

    test("should return intersecting gwas snp associations with bcres for given disease", async () => {
        const variables = {
            disease: "ASD",
            bcre_group: "adult"
        };
        const response: Response = await request(app).post("/graphql").send({ query: gwasintersectingSnpsWithBcreQuery, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.gwasintersectingSnpsWithBcreQuery.length).toBe(6);       
        
    });
    
});
