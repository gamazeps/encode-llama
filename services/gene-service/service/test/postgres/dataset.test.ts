import {
    db,
    selectDatasets,
    DatasetParameters,
    Dataset,
    selectSignalFiles,
    SignalFileParameters,
    SignalFile,
    selectGeneQuantFiles,
    selectTranscriptQuantFiles,
    QuantificationFileParameters,
    QuantificationFile
} from "../../src/postgres";
import { DEFAULT_QUANT_SOURCE } from "../../src/constants";

const DATASET_1: Dataset = {
    accession: "ENCSR969JYY",
    assay_term_name: "polyA RNA-seq",
    biosample: "germinal matrix",
    biosample_type: "tissue",
    cell_compartment: null,
    lab_friendly_name: "Joseph Costello",
    lab_name: "joseph-costello",
    tissue: null,
    source: DEFAULT_QUANT_SOURCE
};

const SIGNAL_FILE_1: SignalFile = {
    accession: "ENCFF065ESF",
    dataset_accession: "ENCSR969JYY",
    assembly: "GRCh38",
    biorep: 1,
    techrep: 1,
    strand: "-",
    unique_reads: true,
    source: DEFAULT_QUANT_SOURCE
};

const QUANT_FILE_1: QuantificationFile = {
    accession: "ENCFF543WLD",
    dataset_accession: "ENCSR969JYY",
    assembly: "GRCh38",
    biorep: 1,
    techrep: 1,
    source: DEFAULT_QUANT_SOURCE
};

describe("dataset queries", () => {
    test("should select a dataset by accession", async () => {
        const parameters: DatasetParameters = {
            accession: ["ENCSR969JYY"]
        };
        const results = await selectDatasets(parameters);
        expect(results.length).toBe(1);
        expect(results).toContainEqual(DATASET_1);
    });

    test("should select a Signal File by accession", async () => {
        const parameters: SignalFileParameters = {
            accession: ["ENCFF065ESF"]
        };
        const results = await selectSignalFiles(parameters);
        expect(results.length).toBe(1);
        expect(results).toContainEqual(SIGNAL_FILE_1);
    });

    test("should select a Quantification File by accession", async () => {
        const parameters: QuantificationFileParameters = {
            accession: ["ENCFF543WLD"]
        };
        const results = await selectTranscriptQuantFiles(parameters);
        expect(results.length).toBe(1);
        expect(results).toContainEqual(QUANT_FILE_1);
    });

});
