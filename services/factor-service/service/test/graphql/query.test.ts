import request, { Response } from "supertest";

import app from "../../src/app";
import { FactorQueryParameters, CelltypeQueryParameters } from "../../src/types";

const celltypequery = `
query test($name: [String], $assembly: String! ) {
  celltype(name: $name, assembly: $assembly) {
    celltype
    wiki_desc
    ct_image_url
  }
}
`;

const factorquery = `
query test($id: [String], $name: [String], $assembly: String!) {
    factor(id: $id, name: $name, assembly: $assembly){
        gene_id
        name
        assembly
        coordinates {
            chromosome
            start
            end   
        }
        uniprot_data
        ncbi_data
        hgnc_data {
            hgnc_id
            symbol
            name
            uniprot_ids
            locus_type          
            location
            entrez_id
            gene_group
            gene_group_id
            ccds_id
            locus_group
            alias_symbol
        }
        ensemble_data {
            id
            display_name
            biotype
            description
            hgnc_synonyms
            hgnc_primary_id
            version
            ccds_id
            uniprot_synonyms
            uniprot_primary_id
        }
        modifications {
            name
            title
            symbol
            modification {
                position
                modification
                amino_acid_code

            }
        }
        pdbids
        factor_wiki
        dbd
        isTF
        color
  }
}
`;

describe("celltype details query", () => {
    test("should return celltype details for given ct", async () => {
        const variables: CelltypeQueryParameters = { name: ["stomach"], assembly: "grch38" };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: celltypequery, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.celltype[0].celltype).toEqual("stomach");
        expect(response.body.data.celltype[0].ct_image_url).not.toBeNull();
        expect(response.body.data.celltype[0].wiki_desc).not.toBeNull();
    });
});

describe("factor details query", () => {
    test("should return factor details for given tf", async () => {
        const variables: FactorQueryParameters = { name: ["EP300"], assembly: "grch38" };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: factorquery, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.factor[0].name).toEqual("EP300");
        expect(response.body.data.factor[0].gene_id).toEqual("ENSG00000100393");
        expect(response.body.data.factor[0].coordinates).toMatchObject({
            chromosome: "chr22",
            start: 41092592,
            end: 41180077
        });
        expect(response.body.data.factor[0].ensemble_data).toMatchObject({
            id: "ENSG00000100393",
            display_name: "EP300",
            biotype: "protein_coding",
            description: "E1A binding protein p300 [Source:HGNC Symbol;Acc:HGNC:3373]",
            hgnc_synonyms: ["KAT3B", "p300"],
            hgnc_primary_id: "HGNC:3373",
            version: "14",
            ccds_id: ["CCDS14010"],
            uniprot_synonyms: [],
            uniprot_primary_id: "Q09472"
        });
        expect(response.body.data.factor[0].hgnc_data).toMatchObject({
            hgnc_id: "HGNC:3373",
            symbol: "EP300",
            name: "E1A binding protein p300",
            uniprot_ids: ["Q09472"],
            locus_type: "gene with protein product",
            location: "22q13.2",
            entrez_id: "2033",
            gene_group: ["Zinc fingers ZZ-type", "Lysine acetyltransferases", "Bromodomain containing"],
            gene_group_id: ["91", "486", "1232"],
            ccds_id: ["CCDS14010"],
            locus_group: "protein-coding gene",
            alias_symbol: ["p300", "KAT3B"]
        });
        expect(response.body.data.factor[0].uniprot_data).not.toBeNull();
        expect(response.body.data.factor[0].ncbi_data).not.toBeNull();
        expect(response.body.data.factor[0].factor_wiki).not.toBeNull();
        expect(response.body.data.factor[0].pdbids).not.toBeNull();
        expect(response.body.data.factor[0].color).toEqual("#523e442a");
    });
});
