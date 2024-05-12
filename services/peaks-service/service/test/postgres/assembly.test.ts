import { db, selectAssemblies } from "../../src/postgres";

describe("assembly queries", () => {
    test("should select three assemblies", async () => {
        const results = await selectAssemblies({ assay: "chip_seq" }, db);
        expect(results.length).toBe(4);
        expect(results).toContainEqual({ name: "hg19", species: "Homo sapiens" });
        expect(results).toContainEqual({ name: "GRCh38", species: "Homo sapiens" });
        expect(results).toContainEqual({ name: "mm10", species: "Mus musculus" });
    });

    test("should select two assemblies for human", async () => {
        const results = await selectAssemblies({ species: "Homo sapiens", assay: "chip_seq" }, db);
        expect(results.length).toBe(2);
        expect(results).toContainEqual({ name: "hg19", species: "Homo sapiens" });
        expect(results).toContainEqual({ name: "GRCh38", species: "Homo sapiens" });
    });

    test("should select one assembly for GRCh38", async () => {
        const results = await selectAssemblies({ assembly: [ "GRCh38" ], assay: "chip_seq" }, db);
        expect(results.length).toBe(1);
        expect(results).toContainEqual({ name: "GRCh38", species: "Homo sapiens" });
    });

    test("should select one assembly for GRCh38 and human", async () => {
        const results = await selectAssemblies({ assembly: [ "GRCh38" ], species: "Homo sapiens", assay: "chip_seq" }, db);
        expect(results.length).toBe(1);
        expect(results).toContainEqual({ name: "GRCh38", species: "Homo sapiens" });
    });

    test("should select no assemblies for GRCh38 and mouse", async () => {
        const results = await selectAssemblies({ assembly: [ "GRCh38" ], species: "Mus musculus", assay: "chip_seq" }, db);
        expect(results.length).toBe(0);
    });

    test("should select one assemblies for mouse", async () => {
        const results = await selectAssemblies({ species: "Mus musculus", assay: "chip_seq" }, db);
        expect(results.length).toBe(2);
        expect(results).toContainEqual({ name: "mm10", species: "Mus musculus" });
    });

    test("should select no assemblies for dog", async () => {
        const results = await selectAssemblies({ species: "dog", assay: "chip_seq" }, db);
        expect(results.length).toBe(0);
    });
});
