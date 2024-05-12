import { selectCellType } from "../../src/postgres/celltype";
import { db } from "./../../src/postgres/connection";
import { CelltypeQueryParameters, FactorQueryParameters, FactorDetails, CelltypeDetails } from "../../src/types";
import { selectFactor,selectFactorByName } from "../../src/postgres/factor";

describe("celltype details query", () => {
    test("should return celltype details for given ct", async () => {
        const params: CelltypeQueryParameters = { name: ["stomach"], assembly: "grch38" };

        const result: CelltypeDetails[] = await selectCellType(params, db);
        expect(result[0].celltype).toEqual("stomach");
        expect(result[0].ct_image_url).not.toBeNull();
        expect(result[0].wiki_desc).not.toBeNull();
    });
});

describe("factor details query", () => {
    test("should return factor details for given tf", async () => {
        const params: any = { name: "EP300", assembly: "grch38" };
        const result: FactorDetails = await selectFactorByName(params, db);

        expect(result.name).toEqual("EP300");
        expect(result.gene_id).toEqual("ENSG00000100393");
        expect(result.coordinates).toMatchObject({
            chromosome: "chr22",
            start: 41092592,
            end: 41180077
        });
        expect(result.ensemble_data).toMatchObject({
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
        expect(result.hgnc_data).toMatchObject({
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
        expect(result.uniprot_data).not.toBeNull();
        expect(result.ncbi_data).not.toBeNull();
        expect(result.factor_wiki).not.toBeNull();
        expect(result.pdbids).not.toBeNull();
        expect(result.color).toEqual("#523e442a");
    });
});
