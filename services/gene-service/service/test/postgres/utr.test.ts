import {
    db,
    selectUTRsByExon,
    UTRParameters,
    ExonParameters,
    UTRResult
} from "../../src/postgres";

describe("transcript queries", () => {
    test("should select two UTRs for ENSE00003812156.1", async () => {
        const parameters: ExonParameters = {
            name: ["ENSE00003812156.1"]
        };
        const uparameters: UTRParameters = {};
        const results: UTRResult[] = await selectUTRsByExon("GRCh38", parameters, uparameters, db);
        expect(results.length).toBe(2);
        expect(results).toContainEqual({
            id: "UTR5:ENST00000641515.2",
            chromosome: "chr1",
            start: 65419,
            stop: 65433,
            project: "HAVANA",
            score: 0,
            strand: "+",
            direction: 5,
            phase: -1,
            parent_exon: "ENSE00003812156.1",
            parent_protein: "ENSP00000493376.2",
            tag: "RNA_Seq_supported_partial,basic"
        });
        expect(results).toContainEqual({
            id: "UTR5:ENST00000641515.2",
            chromosome: "chr1",
            start: 65419,
            stop: 65433,
            project: "HAVANA",
            score: 0,
            strand: "+",
            direction: 5,
            phase: -1,
            parent_exon: "ENSE00003812156.1",
            parent_protein: "ENSP00000493376.2",
            tag: "RNA_Seq_supported_partial,basic"
        });
    });

    test("should select two 5' UTRs for ENSE00002319515.2", async () => {
        const parameters: ExonParameters = {
            name: ["ENSE00002319515.2"]
        };
        const uparameters: UTRParameters = {
            direction: 5
        };
        const results: UTRResult[] = await selectUTRsByExon("GRCh38", parameters, uparameters, db);
        expect(results.length).toBe(2);
        expect(results).toContainEqual({
            id: "UTR5:ENST00000335137.4",
            chromosome: "chr1",
            start: 69055,
            stop: 69090,
            project: "ENSEMBL",
            score: 0,
            strand: "+",
            direction: 5,
            phase: -1,
            parent_exon: "ENSE00002319515.2",
            parent_protein: "ENSP00000334393.3",
            tag: "basic,appris_principal_1,CCDS"
        });
        expect(results).toContainEqual({
            id: "UTR5:ENST00000335137.4",
            chromosome: "chr1",
            start: 69055,
            stop: 69090,
            project: "ENSEMBL",
            score: 0,
            strand: "+",
            direction: 5,
            phase: -1,
            parent_exon: "ENSE00002319515.2",
            parent_protein: "ENSP00000334393.3",
            tag: "basic,appris_principal_1,CCDS"
        });
    });
});
