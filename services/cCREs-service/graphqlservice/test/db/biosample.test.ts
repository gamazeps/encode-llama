import { selectBiosamples } from '../../src/postgres/biosample';
import { db } from '../../src/postgres/connection';

describe("database layer biosample selection", () => {

    test("should select by name", async () => {
        const results = await selectBiosamples({ assembly: "grch38", name: [ "MCF-7", "GM12878" ] }, db);
        expect(results).toEqual([{
            biosample_name: "MCF-7",
            dnase_experiment: "ENCSR000EPH",
            dnase_file: "ENCFF924FJR",
        }]);
    });

    test("should select one biosample with DNase-seq", async () => {
        const results = await selectBiosamples({ assembly: "grch38", assay: [ "dnase" ] }, db);
        expect(results).toEqual([{
            biosample_name: "MCF-7",
            dnase_experiment: "ENCSR000EPH",
            dnase_file: "ENCFF924FJR",
        }]);
    });

    test("should select no biosamples with WGBS", async () => {
        const results = await selectBiosamples({ assembly: "grch38", assay: [ "wbgs" ] }, db);
        expect(results).toEqual([]);
    });

});
