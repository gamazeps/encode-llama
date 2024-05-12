import "jest";
import { db } from "../../src/postgres/connection";
import { selectVersions } from "../../src/postgres/versions/select";

describe("database layer ground level versions selection", () => {
    test("should select by version", async () => {
        const results = await selectVersions(db);

        // check response
        // console.info(results);

        // version
        expect(results[0].version).toEqual("2020-1");

        // biosample
        expect(results[0].biosample).toEqual("b'Homo sapiens keratinocyte female'");

        // assay
        expect(results[0].assay).toEqual("ChIP-seq");

        // experiment
        expect(results[0].accession).toEqual("ENCSR000ARN");
    });
});
