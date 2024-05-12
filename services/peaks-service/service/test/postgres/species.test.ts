import { db, selectAllSpecies, selectSpeciesFromDatasets } from "../../src/postgres";

describe("species queries", () => {
    test("can select all species", async () => {
        const results = await selectAllSpecies(db, "chip_seq");
        expect(results.length).toBe(2);
        expect(results).toContainEqual({ name: "Homo sapiens" });
        expect(results).toContainEqual({ name: "Mus musculus" });
    });

    describe("can select species for specific projects", () => {
        test("will select species for a project that exists", async () => {
            const results = await selectSpeciesFromDatasets({ project: "ENCODE", assay: "chip_seq" }, db);
            expect(results.length).toBe(2);
            expect(results).toContainEqual({ name: "Homo sapiens", expcount: 5 });
            expect(results).toContainEqual({ name: "Mus musculus", expcount: 1 });
        });

        test("will not select species for a project that doesn't exist", async () => {
            const results = await selectSpeciesFromDatasets({ project: "Cistrome", assay: "chip_seq" }, db);
            expect(results.length).toBe(0);
        });
    });
});
