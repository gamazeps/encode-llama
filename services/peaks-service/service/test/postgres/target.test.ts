import { db, selectAllTargets, selectTargetsFromDatasets } from "../../src/postgres";

describe("target queries", () => {
    test("can select all targets", async () => {
        const results = await selectAllTargets(db, "chip_seq");
        expect(results.length).toBe(4);
        expect(results).toContainEqual({ name: "KDM5A" });
    });

    describe("can select targest for a specific project", () => {
        test("will select targets for a project that exists", async () => {
            const results = await selectTargetsFromDatasets({ project: "ENCODE", assay: "chip_seq" }, db);
            expect(results.length).toBe(3);
            expect(results).toContainEqual({ name: "KDM5A", expcount: 2 });
            expect(results).toContainEqual({ name: "EP300", expcount: 1 });
            expect(results).toContainEqual({ name: "ELF1", expcount: 2 });
        });

        test("will not select targets for a project that doesn't exist", async () => {
            const results = await selectTargetsFromDatasets({ project: "Cistrome", assay: "chip_seq" }, db);
            expect(results.length).toBe(0);
        });
    });
});
