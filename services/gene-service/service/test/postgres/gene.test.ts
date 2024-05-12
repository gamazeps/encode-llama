import { db, selectGenes, GeneParameters, selectGeneAssociations } from "../../src/postgres";
import { selectSingleCellBoxPlot } from "../../src/postgres/genes";
import { GeneAssociation, SingleCellGeneBoxPlot } from "../../src/postgres/types";

describe("gene queries", () => {

    test("should select one gene", async () => {
        const parameters: GeneParameters = {
            coordinates: {
                chromosome: "chr1",
                start: 60000,
                stop: 65000
            }
        };
        const results = await selectGenes("GRCh38", parameters, db);
        expect(results.length).toBe(1);
        expect(results).toContainEqual({
            id: "ENSG00000240361.2",
            name: "OR4G11P",
            chromosome: "chr1",
            start: 57598,
            stop: 64116,
            project: "HAVANA",
            score: 0,
            strand: "+",
            gene_type: "transcribed_unprocessed_pseudogene",
            havana_id: "OTTHUMG00000001095.3"
        });
    });

    test("should select two genes from chr1", async () => {
        const parameters: GeneParameters = {
            coordinates: {
            chromosome: "chr1",
            start: 60000,
            stop: 70000
            }
        };
        const results = await selectGenes("GRCh38", parameters, db);
        expect(results.length).toBe(2);
        expect(results).toContainEqual({
            id: 'ENSG00000186092.6',
                name: 'OR4F5',
                chromosome: 'chr1',
                start: 65419,
                stop: 71585,
                project: 'HAVANA',
                score: 0,
                strand: '+',
                gene_type: 'protein_coding',
                havana_id: 'OTTHUMG00000001094.4'
        });
        expect(results).toContainEqual({
            id: "ENSG00000240361.2",
            name: "OR4G11P",
            chromosome: "chr1",
            start: 57598,
            stop: 64116,
            project: "HAVANA",
            score: 0,
            strand: '+',
            gene_type: "transcribed_unprocessed_pseudogene",
            havana_id: "OTTHUMG00000001095.3"
        });
    });

    test("should suggest 1 gene for prefix DDX", async () => {
        const parameters: GeneParameters = {
            name_prefix: [ "DDX" ]
        };
        const results = await selectGenes("GRCh38", parameters, db);
        expect(results.length).toBe(1);
        expect(results).toContainEqual({
            id: 'ENSG00000223972.5',
            name: 'DDX11L1',
            chromosome: 'chr1',
            start: 11869,
            stop: 14409,
            project: 'HAVANA',
            score: 0,
            strand: '+',
            gene_type: 'transcribed_unprocessed_pseudogene',
            havana_id: 'OTTHUMG00000000961.2'
        });
    });

    test("should select 2 genes with offset", async () => {
        const parameters: GeneParameters = {
            limit: 2,
            offset: 2
        };
        const results = await selectGenes("GRCh38", parameters, db);
        expect(results.length).toBe(2);
        expect(results).toEqual([{
            chromosome: "chr12",
            gene_type: "protein_coding",
            havana_id: "OTTHUMG00000169998.7",
            id: "ENSG00000011465.17",
            name: "DCN",
            project: "HAVANA",
            score: 0,
            start: 91140484,
            stop: 91182824,
            strand: "-",
        },    
        {
            chromosome: "chr1",
            gene_type: "protein_coding",
            havana_id: "OTTHUMG00000001094.4",
            id: "ENSG00000186092.6",
            name: "OR4F5",
            project: "HAVANA",
            score: 0,
            start: 65419,
            stop: 71585,
            strand: "+",
        }]);
    });

    

});


describe("genes association queries by disease", () => {

    test("should return gene associations for given disease", async () => {
        const results: GeneAssociation[] = await selectGeneAssociations({ disease: "Autism" }, db);
        expect(results.length).toEqual(25);
    });

});

describe("single cell gene box plot queries by disease", () => {

    test("should return single cell gene box for given disease", async () => {
        const results: SingleCellGeneBoxPlot[] = await selectSingleCellBoxPlot({ disease: "Urban-DLPFC" }, db);
        expect(results.length).toEqual(99);
    });

    test("should return single cell gene box for given disease, gene,celltype", async () => {
        const results: SingleCellGeneBoxPlot[] = await selectSingleCellBoxPlot({ disease: "Urban-DLPFC", gene:["AL627309.1"], celltype:["Pvalb"] }, db);
        expect(results.length).toEqual(1);
    });

});
