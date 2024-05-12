import { Md5 } from 'ts-md5/dist/md5';

import { db, selectLD } from "../../src/postgres";

describe("LD block queries by ID", () => {
    test("should select LD blocks for given ID", async () => {
        const results = await selectLD({ population: "afr", snpids: [ "rs10864440" ] }, db);
        expect(results.length).toBe(1);
        expect(results[0].snp1).toEqual("rs10864440");
        expect(Md5.hashStr(results[0].ldlinks)).toEqual("a07a7c7221f9f66604b69abd54ea585e");
    });
});
