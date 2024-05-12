import { db, selectAllBiosamples, selectBiosamplesFromDatasets } from "../../src/postgres";

describe("biosample queries", () => {
    test("can select all biosamples", async () => {
        const results = await selectAllBiosamples(db, "chip_seq");
        expect(results.length).toBe(6);
        expect(results).toContainEqual({ name: "GM12878", species: "Homo sapiens" });
        expect(results).toContainEqual({ name: "A549", species: "Homo sapiens" });
        expect(results).toContainEqual({ name: "MCF-7", species: "Homo sapiens" });
        expect(results).toContainEqual({ name: "H1-hESC", species: "Homo sapiens" });
        expect(results).toContainEqual({ name: "stomach", species: "Homo sapiens" });
        expect(results).toContainEqual({ name: "G1E-ER4", species: "Mus musculus" });
    });

    describe("can select all biosamples for a specific species", () => {
        test("should select the correct biosamples for human", async () => {
            const results = await selectBiosamplesFromDatasets({ species: "Homo sapiens", assay: "chip_seq" }, db);
            expect(results.length).toBe(5);
            expect(results).toContainEqual({ name: "GM12878", species: "Homo sapiens", expcount: 1 });
            expect(results).toContainEqual({ name: "A549", species: "Homo sapiens", expcount: 2 });
            expect(results).toContainEqual({ name: "MCF-7", species: "Homo sapiens", expcount: 1 });
            expect(results).toContainEqual({ name: "H1-hESC", species: "Homo sapiens", expcount: 1 });
            expect(results).toContainEqual({ name: "stomach", species: "Homo sapiens", expcount: 1 });
        });

        test("should select one biosample for mouse", async () => {
            const results = await selectBiosamplesFromDatasets({ species: "Mus musculus", assay: "chip_seq" }, db);
            expect(results.length).toBe(1);
            expect(results).toContainEqual({ name: "G1E-ER4", species: "Mus musculus", expcount: 1 });
        });
    });
});
