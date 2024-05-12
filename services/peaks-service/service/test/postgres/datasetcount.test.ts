import { db, selectDatasetCounts } from "../../src/postgres";

describe("dataset count queries", () => {
    test("should count one of each feature", async () => {
        const results = await selectDatasetCounts(["ENCSR428BSK"], db, ["chip_seq"]);
        expect(results).toEqual({
            total: 1,
            targets: 0,
            biosamples: 1,
            species: 1,
            projects: 1,
            labs: 1
        });
    });
});
