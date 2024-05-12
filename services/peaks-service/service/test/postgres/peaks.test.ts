import { db, selectPeaks, selectPeakCount } from "../../src/postgres";

const PEAK_1 = {
    experiment_accession: "ENCSR411SUC",
    file_accession: "test-file",
    chrom: "chr19",
    assay: "chip_seq",
    assembly: "hg19",
    chrom_start: 10000229,
    chrom_end: 10002431,
    name: "Peak_172",
    score: 45,
    strand: ".",
    signal_value: 1.98551,
    p_value: 4.5765,
    q_value: 0.68414,
    peak: 326,
    dataset: {
        accession: "ENCSR411SUC",
        biosample: "stomach",
        assay: "chip_seq",
        lab: {
            friendly_name: "Richard Myers",
            name: "richard-myers"
        },
        project: "ENCODE",
        released: null,
        source: "ENCODE",
        species: "Homo sapiens",
        target: "EP300",
        cell_slims: [], 
        developmental_slims: ["endoderm"],
        organ_slims: ["stomach"], 
        system_slims: ["digestive system"]
    }
};

const PEAK_2 = {
    experiment_accession: "ENCSR411SUC",
    file_accession: "test-file",
    chrom: "chr19",
    assay: "chip_seq",
    assembly: "hg19",    
    chrom_start: 10012431,
    chrom_end: 10036488,
    name: "Peak_174",
    score: 45,
    strand: ".",
    signal_value: 1.98551,
    p_value: 4.5765,
    q_value: 0.68414,
    peak: 4427,
    dataset: {
        accession: "ENCSR411SUC",
        assay: "chip_seq",
        biosample: "stomach",
        lab: {
            friendly_name: "Richard Myers",
            name: "richard-myers"
        },
        project: "ENCODE",
        released: null,
        source: "ENCODE",
        species: "Homo sapiens",
        target: "EP300",
        cell_slims: [], 
        developmental_slims: ["endoderm"],
        organ_slims: ["stomach"],
        system_slims: ["digestive system"]
    }
};
describe("peaks queries", () => {
    test("should select peaks for just range", async () => {
        let params = { assembly: "hg19", assay: "chip_seq", range: [{ chrom: "chr19", chrom_start: 10_000_000, chrom_end: 10_020_000 }] };
        const results = await selectPeaks(params, db);
        expect(results.length).toBe(3);
        expect(results).toContainEqual(PEAK_2);
    });

    test("should select peaks for range and accessions", async () => {
        let params = {
            assembly: "hg19",
            range: [{ chrom: "chr19", chrom_start: 10_000_000, chrom_end: 10_020_000 }],
            experiment_accession: "ENCSR411SUC",
            file_accession: "test-file",
            assay: "chip_seq"
        };
        const results = await selectPeaks(params, db);
        expect(results.length).toBe(3);
        expect(results).toContainEqual(PEAK_1);
    });

    test("should select peak count for GRCh38", async () => {
        const result = await selectPeakCount("chip-seq", "GRCh38", db);
        expect(result).toEqual(5168);
    });
});
