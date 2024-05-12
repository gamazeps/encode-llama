import { select_cCREs, select_linkedGenes } from '../../src/postgres/ccre';
import { db } from '../../src/postgres/connection';

const EH38E2148200 = {
    accession: "EH38E2148200",
    ccre_group: "CTCF-only",
    chromosome: "chr22",
    ctcf_bound: true,
    rdhs: "EH38D2203240",
    start: 11055994,
    stop: 11056321
}

const C1 = { chromosome: "chr22", start: 11055994, end: 11285909 };
const C2 = { chromosome: "chr22", start: 11355994, end: 11385909 };

describe("database layer cCRE selection", () => {

    test("should select linked genes by ccre accession ", async ()=>{
        const results = await select_linkedGenes({ accession: [ "EH38D0372911" ] }, db);
        expect(results).toEqual([ {
            accession: "EH38D0372911",
            assay: "CTCF-ChIAPET",
            assembly: "GRCh38",
            gene: "ENSG00000154127.10",
            celltype: "Caco-2",
            experiment_accession: "ENCSR185PEE"
        } ]);

    })
    test("should select by accession", async () => {
        const results = await select_cCREs({ assembly: "grch38", accession: [ "EH38E2148200" ] }, db);
        expect(results).toEqual([ EH38E2148200 ]);
    });

    test("should select by rDHS accession", async () => {
        const results = await select_cCREs({ assembly: "grch38", rDHS: [ "EH38D2203240" ] }, db);
        expect(results).toEqual([ EH38E2148200 ]);
    });

    test("should select by group", async () => {
        const results = await select_cCREs({ assembly: "grch38", group: [ "CTCF-only" ] }, db);
        expect(results.length).toBe(615);
    });

    test("should select by presence of CTCF binding", async () => {
        let results = await select_cCREs({ assembly: "grch38", ctcf_bound: true }, db);
        expect(results.length).toBe(8004);
        results = await select_cCREs({ assembly: "grch38", ctcf_bound: false }, db);
        expect(results.length).toBe(16784 - 8004);
    });

    test("should select by coordinates", async () => {
        let results = await select_cCREs({ assembly: "grch38", coordinates: [ C1 ] }, db);
        expect(results.length).toBe(7);
        results = await select_cCREs({ assembly: "grch38", coordinates: [ C1, C2 ] }, db);
        expect(results.length).toBe(9);
    });

});
