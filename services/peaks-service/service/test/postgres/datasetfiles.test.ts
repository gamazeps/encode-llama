import { db } from "../../src/postgres";
import { selectFiles } from "../../src/postgres/dataset/selectfiles";

const FASTQ1 = {
    datasetaccession: "ENCSR428BSK",
    fileaccession: "ENCFF583HWE",
    fileassembly: null,
    paired_end: false,
    read_id: 0,
    biorep: 2,
    techrep: 1,
    filetype: "sequence_reads",
    url: "https://encode-files.s3.amazonaws.com/2015/10/09/06d4c71a-d160-4059-b112-1320c54cfed2/ENCFF583HWE.fastq.gz"
};

const FASTQ2 = {
    datasetaccession: "ENCSR428BSK",
    fileaccession: "ENCFF455RDD",
    fileassembly: null,
    paired_end: false,
    read_id: 0,
    biorep: 1,
    techrep: 1,
    filetype: "sequence_reads",
    url: "https://encode-files.s3.amazonaws.com/2015/10/09/0af22478-097a-4811-bbe0-e9cf98fba206/ENCFF455RDD.fastq.gz"
};

describe("dataset file queries", () => {
    test("should select two files associated with ENCODE datasets for mm10", async () => {
        const results = await selectFiles({ assembly: "mm10" }, ["sequence_reads", "replicated_peaks"], "chip_seq", db, ["ENCSR428BSK"]);
        expect(results.length).toBe(3);
        expect(results).toContainEqual(FASTQ1);
        expect(results).toContainEqual(FASTQ2);
    });

    test("should select two FASTQ files associated with ENCODE datasets for mm9", async () => {
        const results = await selectFiles({}, ["sequence_reads"], "chip_seq", db, ["ENCSR428BSK"]);
        expect(results.length).toBe(2);
        expect(results).toContainEqual(FASTQ1);
        expect(results).toContainEqual(FASTQ2);
    });
});
