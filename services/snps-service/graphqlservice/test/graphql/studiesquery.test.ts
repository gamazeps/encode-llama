import request, { Response } from "supertest";
import app from "../../src/app";

const query = `
query gwas($assembly: String!) {
  genomeWideAssociationQuery(assembly: $assembly) {
    pubMedId
    name
    author
  }
}
`;

const cte_query = `
query gwas($assembly: String!, $pmIds: [Int]) {
  genomeWideAssociationQuery(assembly: $assembly, pmIds: $pmIds) {
    pubMedId
    name
    author
    cellTypeEnrichment {
      encodeid
      fdr
    }
  }
}
`;

const cte_query_with_filters = `
query gwas($assembly: String!, $pmIds: [Int]) {
  genomeWideAssociationQuery(assembly: $assembly, pmIds: $pmIds) {
    pubMedId
    name
    author
    cellTypeEnrichment(encodeid: "ENCSR000AKC") {
      encodeid
      fdr
    }
  }
}
`;

const snp_query = `
query gwas($assembly: String!, $pmIds: [Int]) {
  genomeWideAssociationQuery(assembly: $assembly, pmIds: $pmIds) {
    pubMedId
    name
    author
    leadSNPs {
      id
    }
  }
}
`;

const snp_query_with_rs538 = `
query gwas($assembly: String!, $pmIds: [Int]) {
  genomeWideAssociationQuery(assembly: $assembly, pmIds: $pmIds) {
    pubMedId
    name
    author
    leadSNPs(linkedSNP: "rs538") {
      id
    }
  }
}
`;

const snp_query_with_rs537 = `
query gwas($assembly: String!, $pmIds: [Int]) {
  genomeWideAssociationQuery(assembly: $assembly, pmIds: $pmIds) {
    pubMedId
    name
    author
    leadSNPs(linkedSNP: "rs537") {
      id
    }
  }
}
`;

const studies_by_snp_query = `
query gwas($assembly: String!, $snpIds: [String]) {
  snpQuery(assembly: $assembly, snpids: $snpIds) {
    id
    genomeWideAssociation {
      pubMedId
      name
      author
    }
  }
}
`;

describe("GWAS", () => {

    test("should return GWAS for hg38", async () => {
        const variables = { assembly: "hg38" };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.genomeWideAssociationQuery.length).toEqual(1470);
    });

    test("should return GWAS with cell type enrichment for hg38", async () => {
        const variables = { assembly: "hg38", pmIds: [ 27182965 ] };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: cte_query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.genomeWideAssociationQuery.length).toEqual(17);
        expect(response.body.data.genomeWideAssociationQuery).toContainEqual({
            pubMedId: 27182965,
            name: 'Menarche (age at onset)',
            author: 'Pickrell',
            cellTypeEnrichment: []
        });
        expect(response.body.data.genomeWideAssociationQuery).toContainEqual({
            pubMedId: 27182965,
            name: 'Tonsillectomy',
            author: 'Pickrell',
            cellTypeEnrichment: [
                  { encodeid: 'ENCSR714TJD', fdr: 0.8159422 }, { encodeid: 'ENCSR059MVB', fdr: 0.9139192 },
                  { encodeid: 'ENCSR177QFY', fdr: 0.8295658 }, { encodeid: 'ENCSR847AIA', fdr: 0.7602438 },
                  { encodeid: 'ENCSR430RVP', fdr: 0.8159422 }, { encodeid: 'ENCSR107PPJ', fdr: 0.8675551 },
                  { encodeid: 'ENCSR519CFV', fdr: 0.8295658 }, { encodeid: 'ENCSR000AOQ', fdr: 0.8295658 },
                  { encodeid: 'ENCSR191ZQT', fdr: 0.8159422 }, { encodeid: 'ENCSR905TYC', fdr: 0.9924993 },
                  { encodeid: 'ENCSR520BIM', fdr: 0.8159422 }, { encodeid: 'ENCSR012JBT', fdr: 0.9166994 },
                  { encodeid: 'ENCSR000NPF', fdr: 0.8295658 }, { encodeid: 'ENCSR200EJX', fdr: 0.8331378 },
                  { encodeid: 'ENCSR012PII', fdr: 0.7602438 }, { encodeid: 'ENCSR222DSV', fdr: 0.8295658 },
                  { encodeid: 'ENCSR023TCY', fdr: 0.8295658 }, { encodeid: 'ENCSR327XTS', fdr: 0.7602438 },
                  { encodeid: 'ENCSR970ENS', fdr: 0.8159422 }, { encodeid: 'ENCSR000AQW', fdr: 0.8331378 },
                  { encodeid: 'ENCSR741STU', fdr: 0.8295658 }, { encodeid: 'ENCSR680KPO', fdr: 0.8295658 },
                  { encodeid: 'ENCSR324JDC', fdr: 0.8295658 }, { encodeid: 'ENCSR000ALB', fdr: 0.8159422 },
                  { encodeid: 'ENCSR679OVD', fdr: 0.6728996 }, { encodeid: 'ENCSR007YOT', fdr: 0.8159422 },
                  { encodeid: 'ENCSR000APN', fdr: 0.8159422 }, { encodeid: 'ENCSR000AMR', fdr: 0.8295658 },
                  { encodeid: 'ENCSR000DPL', fdr: 0.8159422 }, { encodeid: 'ENCSR108NVQ', fdr: 0.8295658 },
                  { encodeid: 'ENCSR666TFS', fdr: 0.8295658 }, { encodeid: 'ENCSR227FYJ', fdr: 0.7602438 },
                  { encodeid: 'ENCSR736ALU', fdr: 0.8159422 }, { encodeid: 'ENCSR801IPH', fdr: 0.825345 },
                  { encodeid: 'ENCSR948YYZ', fdr: 0.8159422 }, { encodeid: 'ENCSR000AKC', fdr: 0.7602438 },
                  { encodeid: 'ENCSR013KEC', fdr: 0.8331378 }, { encodeid: 'ENCSR000ANP', fdr: 0.8331378 },
                  { encodeid: 'ENCSR876RGF', fdr: 0.8675551 }, { encodeid: 'ENCSR566DVZ', fdr: 0.8159422 },
                  { encodeid: 'ENCSR661KMA', fdr: 0.8295658 }, { encodeid: 'ENCSR028NXO', fdr: 0.8159422 },
                  { encodeid: 'ENCSR000AOC', fdr: 0.825345 }, { encodeid: 'ENCSR507UDH', fdr: 0.8295658 },
                  { encodeid: 'ENCSR000AMO', fdr: 0.8295658 }, { encodeid: 'ENCSR223UPC', fdr: 0.8159422 },
                  { encodeid: 'ENCSR430AFL', fdr: 0.8235082 }, { encodeid: 'ENCSR909ZPT', fdr: 0.8649686 },
                  { encodeid: 'ENCSR377PMZ', fdr: 0.9828885 }, { encodeid: 'ENCSR596VTT', fdr: 0.8159422 },
                  { encodeid: 'ENCSR729ENO', fdr: 0.8295658 }, { encodeid: 'ENCSR505OPZ', fdr: 0.8295658 },
                  { encodeid: 'ENCSR875QDS', fdr: 0.8331378 }, { encodeid: 'ENCSR429YAE', fdr: 0.9166994 },
                  { encodeid: 'ENCSR729GQT', fdr: 0.8331378 }, { encodeid: 'ENCSR000AKP', fdr: 0.8159422 },
                  { encodeid: 'ENCSR660IQS', fdr: 0.9239772 }, { encodeid: 'ENCSR000ALK', fdr: 0.8295658 },
                  { encodeid: 'ENCSR955IXZ', fdr: 0.8295658 }, { encodeid: 'ENCSR719FEJ', fdr: 0.8295658 },
                  { encodeid: 'ENCSR659RHV', fdr: 0.8295658 }, { encodeid: 'ENCSR114GMF', fdr: 0.8295658 },
                  { encodeid: 'ENCSR000FYQ', fdr: 0.8295658 }, { encodeid: 'ENCSR566GSO', fdr: 0.8159422 },
                  { encodeid: 'ENCSR540ADS', fdr: 0.6728996 }, { encodeid: 'ENCSR000ALW', fdr: 0.8331378 },
                  { encodeid: 'ENCSR752UOD', fdr: 0.8159422 }, { encodeid: 'ENCSR880UFN', fdr: 0.8295658 },
                  { encodeid: 'ENCSR153XET', fdr: 0.8159422 }, { encodeid: 'ENCSR092TTO', fdr: 0.8295658 },
                  { encodeid: 'ENCSR528DQE', fdr: 0.8295658 }, { encodeid: 'ENCSR758OEC', fdr: 0.8295658 },
                  { encodeid: 'ENCSR305ISQ', fdr: 0.7602438 }, { encodeid: 'ENCSR447OHF', fdr: 0.6728996 },
                  { encodeid: 'ENCSR004EKY', fdr: 0.8331378 }, { encodeid: 'ENCSR694RCH', fdr: 0.7602438 },
                  { encodeid: 'ENCSR687ZCM', fdr: 0.8159422 }, { encodeid: 'ENCSR775FTU', fdr: 0.8295658 },
                  { encodeid: 'ENCSR000ANV', fdr: 0.8331378 }, { encodeid: 'ENCSR391EQV', fdr: 0.8159422 },
                  { encodeid: 'ENCSR124VOE', fdr: 0.8331378 }, { encodeid: 'ENCSR449AXO', fdr: 0.8295658 },
                  { encodeid: 'ENCSR842NGQ', fdr: 0.8295658 }, { encodeid: 'ENCSR539JGB', fdr: 0.8295658 },
                  { encodeid: 'ENCSR267YXV', fdr: 0.7602438 }, { encodeid: 'ENCSR597UDW', fdr: 0.912345 },
                  { encodeid: 'ENCSR857GMX', fdr: 0.8159422 }, { encodeid: 'ENCSR447ZGY', fdr: 0.8159422 },
                  { encodeid: 'ENCSR000APH', fdr: 0.9161818 }, { encodeid: 'ENCSR268JQE', fdr: 0.8295658 },
                  { encodeid: 'ENCSR000EXK', fdr: 0.7602438 }, { encodeid: 'ENCSR612BWE', fdr: 0.8295658 },
                  { encodeid: 'ENCSR826UTD', fdr: 0.8295658 }, { encodeid: 'ENCSR769FOC', fdr: 0.8295658 },
                  { encodeid: 'ENCSR841LMD', fdr: 0.8159422 }, { encodeid: 'ENCSR227QNS', fdr: 0.8159422 },
                  { encodeid: 'ENCSR701EOS', fdr: 0.6728996 }, { encodeid: 'ENCSR829UDX', fdr: 0.825345 },
                  { encodeid: 'ENCSR656ZEQ', fdr: 0.8295658 }, { encodeid: 'ENCSR074ECR', fdr: 0.7602438 },
                  { encodeid: 'ENCSR981UJA', fdr: 0.8295658 }, { encodeid: 'ENCSR752LMU', fdr: 0.7602438 },
                  { encodeid: 'ENCSR835MMN', fdr: 0.8295658 }, { encodeid: 'ENCSR564IGJ', fdr: 0.8611246 },
                  { encodeid: 'ENCSR329FXI', fdr: 0.8159422 }, { encodeid: 'ENCSR000ANF', fdr: 0.6728996 },
                  { encodeid: 'ENCSR454VRA', fdr: 0.7602438 }, { encodeid: 'ENCSR892XFG', fdr: 0.8159422 },
                  { encodeid: 'ENCSR210ZPC', fdr: 0.9161818 }, { encodeid: 'ENCSR235ZBF', fdr: 0.6728996 },
                  { encodeid: 'ENCSR743DDX', fdr: 0.825345 }, { encodeid: 'ENCSR001SHB', fdr: 0.8295658 },
                  { encodeid: 'ENCSR971ETA', fdr: 0.8159422 }, { encodeid: 'ENCSR011MGQ', fdr: 0.8295658 },
                  { encodeid: 'ENCSR374BLY', fdr: 0.8159422 }, { encodeid: 'ENCSR307DQT', fdr: 0.8159422 },
                  { encodeid: 'ENCSR810EPZ', fdr: 0.7602438 }, { encodeid: 'ENCSR465PPP', fdr: 0.8295658 },
                  { encodeid: 'ENCSR431JKJ', fdr: 0.8159422 }, { encodeid: 'ENCSR041UZZ', fdr: 0.8159422 },
                  { encodeid: 'ENCSR546SDM', fdr: 0.8159422 }, { encodeid: 'ENCSR832UFG', fdr: 0.8159422 },
                  { encodeid: 'ENCSR314BEX', fdr: 0.8295658 }, { encodeid: 'ENCSR658KLY', fdr: 0.7602438 },
                  { encodeid: 'ENCSR227NHZ', fdr: 0.8543699 }, { encodeid: 'ENCSR674VPA', fdr: 0.825345 },
                  { encodeid: 'ENCSR577GVS', fdr: 0.8295658 }, { encodeid: 'ENCSR222QLW', fdr: 0.825345 },
                  { encodeid: 'ENCSR234PGX', fdr: 0.9166994 }, { encodeid: 'ENCSR015GFK', fdr: 0.8331419 },
                  { encodeid: 'ENCSR776KLS', fdr: 0.8159422 }, { encodeid: 'ENCSR303IKJ', fdr: 0.6728996 },
                  { encodeid: 'ENCSR597BWL', fdr: 0.825345 }, { encodeid: 'ENCSR203KCB', fdr: 0.8159422 },
                  { encodeid: 'ENCSR297HCQ', fdr: 0.9166994 }, { encodeid: 'ENCSR718BTD', fdr: 0.6728996 }
            ]
        });
    });

    test("should return GWAS with filtered cell type enrichment for hg38", async () => {
        const variables = { assembly: "hg38", pmIds: [ 27182965 ] };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: cte_query_with_filters, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.genomeWideAssociationQuery.length).toBe(17);
        expect(response.body.data.genomeWideAssociationQuery).toContainEqual({
            pubMedId: 27182965,
            name: 'Myopia',
            author: 'Pickrell',
            cellTypeEnrichment: [{ encodeid: 'ENCSR000AKC', fdr: 0.9875451 }]
        });
    });

    test("should return GWAS with lead SNPs for hg38", async () => {
        const variables = { assembly: "hg38", pmIds: [ 21130836 ] };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: snp_query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.genomeWideAssociationQuery.length).toBe(1);
        expect(response.body.data.genomeWideAssociationQuery).toContainEqual({
            author: "Luciano",
            leadSNPs: [{
                id: "rs171"
            }],
            name: "Information processing speed",
            pubMedId: 21130836
        });
    });

    test("should return GWAS with lead SNPs for hg38", async () => {
        const variables = { assembly: "hg38", pmIds: [ 21130836 ] };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: snp_query_with_rs538, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.genomeWideAssociationQuery.length).toBe(1);
        expect(response.body.data.genomeWideAssociationQuery).toContainEqual({
            author: "Luciano",
            leadSNPs: [{
                id: "rs171"
            }],
            name: "Information processing speed",
            pubMedId: 21130836
        });
    });

    test("should return GWAS with lead SNPs for hg38", async () => {
        const variables = { assembly: "hg38", pmIds: [ 21130836 ] };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: snp_query_with_rs537, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.genomeWideAssociationQuery.length).toBe(1);
        expect(response.body.data.genomeWideAssociationQuery).toContainEqual({
            author: "Luciano",
            leadSNPs: [],
            name: "Information processing speed",
            pubMedId: 21130836
        });
    });

    test("should return GWAS matching rs171", async () => {
        const variables = { assembly: "hg38", snpIds: [ "rs171" ] };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: studies_by_snp_query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.snpQuery.length).toBe(1);
        expect(response.body.data.snpQuery).toContainEqual({
            genomeWideAssociation: [{
                author: "Luciano",
                name: "Information processing speed",
                pubMedId: 21130836
            }],
            id: "rs171"
        });
    });

});
