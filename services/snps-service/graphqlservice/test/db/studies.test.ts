import { db, selectStudies } from "../../src/postgres";

describe("studies by assembly", () => {
    test("should select studies for given assembly", async () => {
        const results = await selectStudies({ assembly: "hg38" }, db);
        expect(results.length).toEqual(1470);
    });
});
