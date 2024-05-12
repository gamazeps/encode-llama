import { db, selectGeneQuantifications, GeneQuantParameters, selectTranscriptQuantifications, TranscriptQuantParameters } from "../../src/postgres";
import { removeNullFields } from "../testUtils";

const GENE_QUANT_1 = {
    experiment_accession: "ENCSR969JYY",
    file_accession: "ENCFF951YSP",
    gene_id: "ENSG00000011465.16",
    transcript_ids: [
        "ENST00000052754.9",
        "ENST00000393155.5",
        "ENST00000420120.6",
        "ENST00000425043.5",
        "ENST00000441303.6",
        "ENST00000456569.2",
        "ENST00000546370.5",
        "ENST00000546391.5",
        "ENST00000546745.5",
        "ENST00000547568.6",
        "ENST00000547937.5",
        "ENST00000548218.1",
        "ENST00000548768.1",
        "ENST00000549513.5",
        "ENST00000550099.5",
        "ENST00000550563.5",
        "ENST00000550758.1",
        "ENST00000551354.1",
        "ENST00000552145.5",
        "ENST00000552962.5"
    ],
    len: 1399.67,
    effective_len: 1364.67,
    expected_count: 40469,
    tpm: 1006.87,
    fpkm: 615.19,
    posterior_mean_count: 40469,
    posterior_standard_deviation_of_count: 0,
    pme_tpm: 990.27,
    pme_fpkm: 616.19,
    tpm_ci_lower_bound: 973.154,
    tpm_ci_upper_bound: 1008.49,
    fpkm_ci_lower_bound: 605.695,
    fpkm_ci_upper_bound: 627.688
};

const TRANSCRIPT_QUANT_1 = {
    experiment_accession: "ENCSR969JYY",
    file_accession: "ENCFF543WLD",
    gene_id: "26266",
    gene_id_prefix: "26266",
    transcript_id: "26266",
    transcript_id_prefix: "26266",
    len: 75,
    effective_len: 40,
    expected_count: 138.5,
    tpm: 117.56,
    fpkm: 71.83,
    iso_pct: 100,
    posterior_mean_count: 130.16,
    posterior_standard_deviation_of_count: 86.57,
    pme_tpm: 108.86,
    pme_fpkm: 67.74,
    iso_pct_from_pme_tpm: 100,
    tpm_ci_lower_bound: 0.00972143,
    tpm_ci_upper_bound: 221.554,
    fpkm_ci_lower_bound: 0.00230814,
    fpkm_ci_upper_bound: 137.931
};

describe("quantification queries", () => {
    test("should select many gene quantifications by experiment accession", async () => {
        const parameters: GeneQuantParameters = {
            assembly: "grch38",
            experiment_accession: ["ENCSR969JYY", "SOME_JUNK_VALUE"]
        };

        const results = await selectGeneQuantifications(parameters, db);
        expect(results.length).toBe(999);
        expect(results.map(r => removeNullFields(r))).toContainEqual(GENE_QUANT_1);
    });

    test("should select many gene quantifications by file accession", async () => {
        const parameters: GeneQuantParameters = {
            assembly: "grch38",
            file_accession: ["ENCFF951YSP"]
        };

        const results = await selectGeneQuantifications(parameters, db);
        expect(results.length).toBe(999);
        expect(results.map(r => removeNullFields(r))).toContainEqual(GENE_QUANT_1);
    });

    test("should select gene quantifications with limits and offsets", async () => {
        const parameters1: GeneQuantParameters = {
            assembly: "grch38",
            file_accession: ["ENCFF951YSP"],
            limit: 50
        };

        const results1 = await selectGeneQuantifications(parameters1, db);
        expect(results1.length).toBe(50);

        const parameters2: GeneQuantParameters = {
            assembly: "grch38",
            file_accession: ["ENCFF951YSP"],
            limit: 50,
            offset: 50
        };

        const results2 = await selectGeneQuantifications(parameters2, db);
        expect(results2.length).toBe(50);

        expect(results1[0].gene_id).not.toBe(results2[0].gene_id);
    });

    test("should select one gene quantification by tpm range", async () => {
        const parameters: GeneQuantParameters = {
            assembly: "grch38",
            tpm_range: {
                low: 1000,
                high: 1010
            }
        };

        const results = await selectGeneQuantifications(parameters, db);
        expect(results.length).toBe(1);
        expect(removeNullFields(results[0])).toEqual(GENE_QUANT_1);
    });

    test("should select one gene quantification by fpkm range", async () => {
        const parameters: GeneQuantParameters = {
            assembly: "grch38",
            fpkm_range: {
                low: 600,
                high: 620
            }
        };

        const results = await selectGeneQuantifications(parameters, db);
        expect(results.length).toBe(1);
        expect(removeNullFields(results[0])).toEqual(GENE_QUANT_1);
    });

    test("should select one gene quantification by gene id", async () => {
        const parameters: GeneQuantParameters = {
            assembly: "grch38",
            gene_id: ["ENSG00000011465.16"]
        };

        const results = await selectGeneQuantifications(parameters, db);
        expect(results.length).toBe(1);
        expect(removeNullFields(results[0])).toEqual(GENE_QUANT_1);
    });

    test("should select many transcript quantifications by experiment accession", async () => {
        const parameters: TranscriptQuantParameters = {
            assembly: "grch38",
            experiment_accession: ["ENCSR969JYY"]
        };

        const results = await selectTranscriptQuantifications(parameters, db);
        expect(results.length).toBe(999);
        expect(removeNullFields(results[0])).toEqual(TRANSCRIPT_QUANT_1);
    });

    test("should select many transcript quantifications by file accession", async () => {
        const parameters: TranscriptQuantParameters = {
            assembly: "grch38",
            file_accession: ["ENCFF543WLD"]
        };

        const results = await selectTranscriptQuantifications(parameters, db);
        expect(results.length).toBe(999);
        expect(removeNullFields(results[0])).toEqual(TRANSCRIPT_QUANT_1);
    });

    test("should select one transcript quantification by tpm range", async () => {
        const parameters: TranscriptQuantParameters = {
            assembly: "grch38",
            tpm_range: {
                low: 110,
                high: 120
            }
        };

        const results = await selectTranscriptQuantifications(parameters, db);
        expect(results.length).toBe(1);
        expect(removeNullFields(results[0])).toEqual(TRANSCRIPT_QUANT_1);
    });

    test("should select one transcript quantification by fpkm range", async () => {
        const parameters: TranscriptQuantParameters = {
            assembly: "grch38",
            fpkm_range: {
                low: 70,
                high: 75
            }
        };

        const results = await selectTranscriptQuantifications(parameters, db);
        expect(results.length).toBe(1);
        expect(removeNullFields(results[0])).toEqual(TRANSCRIPT_QUANT_1);
    });

    test("should select one transcript quantification by transcript id", async () => {
        const parameters: TranscriptQuantParameters = {
            assembly: "grch38",
            transcript_id: ["26266"]
        };

        const results = await selectTranscriptQuantifications(parameters, db);
        expect(results.length).toBe(1);
        expect(removeNullFields(results[0])).toEqual(TRANSCRIPT_QUANT_1);
    });

    test("should select one transcript quantification by gene id", async () => {
        const parameters: TranscriptQuantParameters = {
            assembly: "grch38",
            gene_id: ["26266"]
        };

        const results = await selectTranscriptQuantifications(parameters, db);
        expect(results.length).toBe(1);
        expect(removeNullFields(results[0])).toEqual(TRANSCRIPT_QUANT_1);
    });
});
