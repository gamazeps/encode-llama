import { db, selectTranscriptsByGene, GeneParameters, TranscriptParameters, TranscriptResult } from "../../src/postgres";

describe("transcript queries", () => {
    test("should select two transcripts for DDX11L1", async () => {
        const parameters: GeneParameters = {
            name: ["DDX11L1"]
        };
        const tparameters: TranscriptParameters = {};
        const results: TranscriptResult[] = await selectTranscriptsByGene("GRCh38", parameters, tparameters, db);
        expect(results.length).toBe(2);
        expect(results).toContainEqual({
            id: "ENST00000456328.2",
            name: "DDX11L1-202",
            parent_gene: "ENSG00000223972.5",
            chromosome: "chr1",
            start: 11869,
            stop: 14409,
            project: "HAVANA",
            score: 0,
            strand: "+",
            transcript_type: "processed_transcript",
            havana_id: "OTTHUMT00000362751.1",
            support_level: 1,
            tag: "basic"
        });
        expect(results).toContainEqual({
            id: "ENST00000450305.2",
            name: "DDX11L1-201",
            parent_gene: "ENSG00000223972.5",
            chromosome: "chr1",
            start: 12010,
            stop: 13670,
            project: "HAVANA",
            score: 0,
            strand: "+",
            transcript_type: "transcribed_unprocessed_pseudogene",
            havana_id: "OTTHUMT00000002844.2",
            support_level: 0,
            tag: "basic"
        });
    });

    test("should select unprocessed pseudogenes", async () => {
        const parameters: GeneParameters = {};
        const tparameters: TranscriptParameters = {
            transcript_type: "transcribed_unprocessed_pseudogene"
        };
        const results: TranscriptResult[] = await selectTranscriptsByGene("GRCh38", parameters, tparameters, db);
        expect(results.length).toBe(2);
        expect(results).toContainEqual({
            id: "ENST00000450305.2",
            name: "DDX11L1-201",
            parent_gene: "ENSG00000223972.5",
            chromosome: "chr1",
            start: 12010,
            stop: 13670,
            project: "HAVANA",
            score: 0,
            strand: "+",
            transcript_type: "transcribed_unprocessed_pseudogene",
            havana_id: "OTTHUMT00000002844.2",
            support_level: 0,
            tag: "basic"
        });
        expect(results).toContainEqual({
            id: "ENST00000492842.2",
            name: "OR4G11P-201",
            parent_gene: "ENSG00000240361.2",
            chromosome: "chr1",
            start: 62949,
            stop: 63887,
            project: "HAVANA",
            score: 0,
            strand: "+",
            transcript_type: "transcribed_unprocessed_pseudogene",
            havana_id: "OTTHUMT00000003224.3",
            support_level: 0,
            tag: "basic"
        });
    });
});
