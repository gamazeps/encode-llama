import { db, selectMAF } from "../../src/postgres";

describe("MAF query by id", () => {

    test("should select MAF for given id", async () => {
        const results = await selectMAF({ snpids: [ "rs367896724" ] }, db);
        expect(results.length).toBe(1);
        expect(results[0]).toEqual({
            snp: 'rs367896724',
            altallele: 'AC',
            refallele: 'A',
            af: 0.425319,
            eas_af: 0.3363,
            amr_af: 0.3602,
            afr_af: 0.4909,
            eur_af: 0.4056,
            sas_af: 0.4949,
            chrom: "chr1",
            start: 10177
        })
    });

});
