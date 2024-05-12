import "jest";
import { db } from "../../src/postgres/connection";
import { selectOrtholog } from "../../src/postgres/ortholog/select";

describe("database layer ortholog selection", () => {
    test("should select by hg38 and mm10", async () => {
        const results = await selectOrtholog({ assembly: "grch38", accession: "EH38E3031186" }, db);

        // check response
        // console.info(results);

        // grch38
        expect(results[0].grch38).toEqual("EH38E3031186");

        // mm10
        expect(results[0].mm10).toEqual("EM10E0487046");
    });
});
