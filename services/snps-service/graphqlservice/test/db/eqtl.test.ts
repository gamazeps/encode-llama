import { db, select_GTEx_eQTLs } from "../../src/postgres";
import { GenomicRange } from "../../src/postgres/types";

const COORDINATES: GenomicRange[] = [
    { chromosome: "chr1", start: 1237010, end: 1237010 },
    { chromosome: "chr1", start: 17722, end: 17722 }
]

describe("LD block queries by ID", () => {
    
    test("should select all GTEx eQTLs", async () => {
        const results = await select_GTEx_eQTLs({ assembly: "hg38" }, db);
        expect(results.length).toBe(198);
    });

    test("should select GTEx eQTLs for variants above a MAF threshold", async () => {
        const results = await select_GTEx_eQTLs({ assembly: "hg38", maf_min: 0.26 }, db);
        expect(results.length).toBe(4);
    });

    test("should select GTEx eQTLs for variants below a MAF threshold", async () => {
        const results = await select_GTEx_eQTLs({ assembly: "hg38", maf_max: 0.01 }, db);
        expect(results.length).toBe(2);
    });

    test("should select GTEx eQTLs for variants within a coordinate range", async () => {
        const results = await select_GTEx_eQTLs({ assembly: "hg38", coordinates: [ COORDINATES[0] ] }, db);
        expect(results.length).toBe(2);
    });

    test("should select GTEx eQTLs for variants within one of two coordinate ranges", async () => {
        const results = await select_GTEx_eQTLs({ assembly: "hg38", coordinates: COORDINATES }, db);
        expect(results.length).toBe(4);
    });

});
