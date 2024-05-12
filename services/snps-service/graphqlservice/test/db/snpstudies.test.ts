import { db, selectStudySNPAssociations, selectStudyCellTypeEnrichment } from "../../src/postgres";

describe("studies paired with SNPs and cell types", () => {

    test("should select one matching study for rs74344531", async () => {
        const results = await selectStudySNPAssociations({ assembly: "hg38", snp_ids: [ "rs74344531" ] }, db);
        expect(results.length).toBe(1);
        expect(results[0]).toEqual({
            pm_id: 21130836,
            author: 'Luciano',
            name: 'Information processing speed',
            refname: 'Luciano-21130836-Information_processing_speed',
            leadid: 'rs11542478',
            snpid: "rs74344531"
        })
    });

    test("should select one matching study and two SNPs for lead SNP rs11542478", async () => {
        const results = await selectStudySNPAssociations({ assembly: "hg38", lead_ids: [ "rs11542478" ] }, db);
        expect(results.length).toBe(1);
        expect(results).toContainEqual({
            pm_id: 21130836,
            author: 'Luciano',
            name: 'Information processing speed',
            refname: 'Luciano-21130836-Information_processing_speed',
            leadid: 'rs11542478',
            snpid: "rs74344531"
        });
    });

    test("should select 5285 study / cell type enrichment pairs", async () => {
        const results = await selectStudyCellTypeEnrichment({ assembly: "hg38" }, db);
        expect(results.length).toBe(3944);
    });

    test("should select study / enrichment pairs for ENCSR729ENO", async () => {
        const results = await selectStudyCellTypeEnrichment({ assembly: "hg38", encodeid: "ENCSR729ENO" }, db);
        expect(results.length).toBe(29);
    });

    test("should select study / enrichment pairs for ENCSR729ENO with low FDR", async () => {
        const results = await selectStudyCellTypeEnrichment({
            assembly: "hg38", encodeid: "ENCSR729ENO", "fdr_threshold": 0.01
        }, db);
        expect(results.length).toBe(2);
        expect(results).toContainEqual({
            pm_id: 25282103,
            author: 'Wood',
            name: 'Height',
            refname: 'Wood-25282103-Height',
            encodeid: 'ENCSR729ENO',
            fdr: 0.000004747452,
            fe: null,
            pvalue: null
        });
        expect(results).toContainEqual({
            pm_id: 25429064,
            author: 'He',
            name: 'Height',
            refname: 'He-25429064-Height',
            encodeid: 'ENCSR729ENO',
            fdr: 0.005327285,
            fe: null,
            pvalue: null
        });
    });

});
