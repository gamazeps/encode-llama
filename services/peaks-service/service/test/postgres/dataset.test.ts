import { db, selectDatasets } from "../../src/postgres";

const FIRSTDATASET = {
    accession: "ENCSR411SUC",
    target: "EP300",
    released: null,
    project: "ENCODE",
    source: "ENCODE",
    biosample: "stomach",
    species: "Homo sapiens",
    lab_name: "richard-myers",
    lab_friendly_name: "Richard Myers",
    cell_slims: [],
    developmental_slims: ["endoderm"],
    organ_slims: ["stomach"],
    system_slims: ["digestive system"],
    investigated_as: ["transcription factor"]
};

const SECONDDATASET = {
    accession: "ENCSR841NDX",
    target: "ELF1",
    released: new Date(2017, 5, 26),
    project: "ENCODE",
    source: "ENCODE",
    biosample: "GM12878",
    species: "Homo sapiens",
    lab_name: "michael-snyder",
    lab_friendly_name: "Michael Snyder",
    cell_slims: ["lymphoblast"],
    developmental_slims: [],
    organ_slims: ["blood","bodily fluid"],
    system_slims: [],
    investigated_as: ["transcription factor"]
};

describe("dataset queries", () => {
    test("should select one dataset by accession", async () => {
        const results = await selectDatasets({ accession: ["ENCSR411SUC"], assay: "chip_seq" }, db);
        expect(results.length).toBe(1);
        expect(results[0]).toEqual(FIRSTDATASET);
    });

    test("should select one dataset by accession and organ_slims", async () => {
        const results = await selectDatasets({ accession: ["ENCSR411SUC"], assay: "chip_seq", organ_slims:["stomach"] }, db);
        expect(results.length).toBe(1);
        expect(results[0]).toEqual(FIRSTDATASET);
    });

    test("should select one dataset by peak accession", async () => {
        const results = await selectDatasets({ replicated_peak_accession: "ENCFF948CPI", assay: "chip_seq" }, db);
        expect(results.length).toBe(1);
        expect(results[0]).toEqual(SECONDDATASET);
    });

    test("should select one dataset by accession and cell_slims", async () => {
        const results = await selectDatasets({ accession: ["ENCSR841NDX"], assay: "chip_seq", cell_slims: ["lymphoblast"] }, db);
        expect(results.length).toBe(1);
        expect(results[0]).toEqual(SECONDDATASET);
    });
    
    test("can select datasets by target", async () => {
        const results = await selectDatasets({ target: "EP300", assay: "chip_seq" }, db);
        expect(results.length).toBe(1);
        expect(results).toContainEqual(FIRSTDATASET);
    });

    test("should select zero datasets for CTCF", async () => {
        const results = await selectDatasets({ target: "CTCF", assay: "chip_seq" }, db);
        expect(results.length).toBe(0);
    });

    test("can select datasets by biosample", async () => {
        const results = await selectDatasets({ biosample: "stomach", assay: "chip_seq" }, db);
        expect(results.length).toBe(1);
        expect(results).toContainEqual(FIRSTDATASET);
    });

    test("should select zero datasets for HeLa-S3", async () => {
        const results = await selectDatasets({ biosample: "HeLa-S3", assay: "chip_seq" }, db);
        expect(results.length).toBe(0);
    });

    test("can select datasets by lab name", async () => {
        const results = await selectDatasets({ lab: "richard-myers", assay: "chip_seq" }, db);
        expect(results.length).toBe(2);
        expect(results).toContainEqual(FIRSTDATASET);
    });

    test("can select datasets by lab friendly name", async () => {
        const results = await selectDatasets({ lab: "Richard Myers", assay: "chip_seq" }, db);
        expect(results.length).toBe(2);
        expect(results).toContainEqual(FIRSTDATASET);
    });

    test("should select zero datasets for zhiping-weng", async () => {
        const results = await selectDatasets({ lab: "zhiping-weng", assay: "chip_seq" }, db);
        expect(results.length).toBe(0);
    });

    test("should select six datasets for ENCODE", async () => {
        const results = await selectDatasets({ project: "ENCODE", assay: "chip_seq" }, db);
        expect(results.length).toBe(6);
        expect(results).toContainEqual(FIRSTDATASET);
    });

    test("should select zero datasets for Cistrome", async () => {
        const results = await selectDatasets({ project: "Cistrome", assay: "chip_seq" }, db);
        expect(results.length).toBe(0);
    });

    test("should select one dataset for mouse", async () => {
        const results = await selectDatasets({ species: "Mus musculus", assay: "chip_seq" }, db);
        expect(results.length).toBe(1);
    });

    test("should select six datasets for human", async () => {
        const results = await selectDatasets({ species: "Homo sapiens", assay: "chip_seq" }, db);
        expect(results.length).toBe(6);
        expect(results).toContainEqual(FIRSTDATASET);
    });
});
