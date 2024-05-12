import { db, selectExonsByTranscript, selectExonsByGene, ExonParameters, TranscriptParameters, GeneParameters, ExonResult } from "../../src/postgres";

describe("transcript queries", () => {
    test("should select two exons for DDX11L1-202", async () => {
        const parameters: TranscriptParameters = {
            name: ["DDX11L1-202"]
        };
        const eparameters: ExonParameters = {};
        const results: ExonResult[] = await selectExonsByTranscript("GRCh38", parameters, eparameters, db);
        expect(results.length).toBe(3);
        expect(results).toContainEqual({
            id: "exon:ENST00000456328.2:1",
            name: "ENSE00002234944.1",
            chromosome: "chr1",
            start: 11869,
            stop: 12227,
            project: "HAVANA",
            score: 0,
            strand: "+",
            exon_number: 1,
            parent_transcript: "ENST00000456328.2"
        });
        expect(results).toContainEqual({
            id: "exon:ENST00000456328.2:2",
            name: "ENSE00003582793.1",
            chromosome: "chr1",
            start: 12613,
            stop: 12721,
            project: "HAVANA",
            score: 0,
            strand: "+",
            exon_number: 2,
            parent_transcript: "ENST00000456328.2"
        });
        expect(results).toContainEqual({
            id: "exon:ENST00000456328.2:3",
            name: "ENSE00002312635.1",
            chromosome: "chr1",
            start: 13221,
            stop: 14409,
            project: "HAVANA",
            score: 0,
            strand: "+",
            exon_number: 3,
            parent_transcript: "ENST00000456328.2"
        });
    });

    test("should select two transcripts for DDX11L1", async () => {
        const parameters: GeneParameters = {
            name: ["DDX11L1"]
        };
        const eparameters: ExonParameters = {};
        const results: ExonResult[] = await selectExonsByGene("GRCh38", parameters, eparameters, db);
        expect(results.length).toBe(9);
        expect(results).toContainEqual({
            id: "exon:ENST00000456328.2:1",
            name: "ENSE00002234944.1",
            chromosome: "chr1",
            start: 11869,
            stop: 12227,
            project: "HAVANA",
            score: 0,
            strand: "+",
            exon_number: 1,
            parent_transcript: "ENST00000456328.2"
        });
        expect(results).toContainEqual({
            id: "exon:ENST00000456328.2:2",
            name: "ENSE00003582793.1",
            chromosome: "chr1",
            start: 12613,
            stop: 12721,
            project: "HAVANA",
            score: 0,
            strand: "+",
            exon_number: 2,
            parent_transcript: "ENST00000456328.2"
        });
        expect(results).toContainEqual({
            id: "exon:ENST00000456328.2:3",
            name: "ENSE00002312635.1",
            chromosome: "chr1",
            start: 13221,
            stop: 14409,
            project: "HAVANA",
            score: 0,
            strand: "+",
            exon_number: 3,
            parent_transcript: "ENST00000456328.2"
        });
        expect(results).toContainEqual({
            id: "exon:ENST00000450305.2:1",
            name: "ENSE00001948541.1",
            chromosome: "chr1",
            start: 12010,
            stop: 12057,
            project: "HAVANA",
            score: 0,
            strand: "+",
            exon_number: 1,
            parent_transcript: "ENST00000450305.2"
        });
        expect(results).toContainEqual({
            id: "exon:ENST00000450305.2:2",
            name: "ENSE00001671638.2",
            chromosome: "chr1",
            start: 12179,
            stop: 12227,
            project: "HAVANA",
            score: 0,
            strand: "+",
            exon_number: 2,
            parent_transcript: "ENST00000450305.2"
        });
        expect(results).toContainEqual({
            id: "exon:ENST00000450305.2:3",
            name: "ENSE00001758273.2",
            chromosome: "chr1",
            start: 12613,
            stop: 12697,
            project: "HAVANA",
            score: 0,
            strand: "+",
            exon_number: 3,
            parent_transcript: "ENST00000450305.2"
        });
        expect(results).toContainEqual({
            id: "exon:ENST00000450305.2:4",
            name: "ENSE00001799933.2",
            chromosome: "chr1",
            start: 12975,
            stop: 13052,
            project: "HAVANA",
            score: 0,
            strand: "+",
            exon_number: 4,
            parent_transcript: "ENST00000450305.2"
        });
        expect(results).toContainEqual({
            id: "exon:ENST00000450305.2:5",
            name: "ENSE00001746346.2",
            chromosome: "chr1",
            start: 13221,
            stop: 13374,
            project: "HAVANA",
            score: 0,
            strand: "+",
            exon_number: 5,
            parent_transcript: "ENST00000450305.2"
        });
        expect(results).toContainEqual({
            id: "exon:ENST00000450305.2:6",
            name: "ENSE00001863096.1",
            chromosome: "chr1",
            start: 13453,
            stop: 13670,
            project: "HAVANA",
            score: 0,
            strand: "+",
            exon_number: 6,
            parent_transcript: "ENST00000450305.2"
        });
    });
});
