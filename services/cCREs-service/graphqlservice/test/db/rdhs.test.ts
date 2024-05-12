import { select_rDHSs } from '../../src/postgres/rdhs';
import { db } from '../../src/postgres/connection';

const EH38D2203235 = {
    accession: "EH38D2203235",
    chromosome: "chr1",
    start: 100037647,
    stop: 100037818
}

const C1 = { chromosome: "chr1", start: 110952071, end: 110960000 };
const C2 = { chromosome: "chr1", start: 110960000, end: 110970000 };

describe("database layer rDHS selection", () => {

    test("should select by accession", async () => {
        const results = await select_rDHSs({ assembly: "grch38", accession: [ "EH38D2203235" ] }, db);
        expect(results).toEqual([ EH38D2203235 ]);
    });

    test("should select by coordinates", async () => {
        let results = await select_rDHSs({ assembly: "grch38", coordinates: [ C1 ] }, db);
        expect(results.length).toBe(4);
        results = await select_rDHSs({ assembly: "grch38", coordinates: [ C1, C2 ] }, db);
        expect(results.length).toBe(11);
    });

});
