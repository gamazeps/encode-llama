import request, { Response } from "supertest";

import app from "../../src/app";

const query = `
query Peaks($experiment_accession: String, $file_accession: String, $range:[ChromosomeRangeInput]!,
         $assembly:String!,$target:String) {
    peaks(experiment_accession: $experiment_accession, file_accession: $file_accession, range:$range,
       assembly:$assembly,target:$target) {
      peaks {       
        file_accession, chrom, chrom_start, chrom_end, name, 
        score, strand, signal_value, p_value, q_value, peak, experiment_accession        
      }      
    }
  }
`;

const peaksQueryWithDataset = `
query Peaks($experiment_accession: String, $file_accession: String, $range:[ChromosomeRangeInput]!,
         $assembly:String!,$target:String) {
    peaks(experiment_accession: $experiment_accession, file_accession: $file_accession, range:$range,
       assembly:$assembly,target:$target) {
      peaks {       
        file_accession, chrom, chrom_start, chrom_end, name, 
        score, strand, signal_value, p_value, q_value, peak, experiment_accession , dataset {
            accession,
            sequence_reads: files(assembly:$assembly,types: ["sequence_reads"]) {
                accession,
                ... on SequenceReads {
                    paired_end, read_id, biorep, techrep
                  }

              }
        }        
      }      
    }
  }
`;

const countQuery = `
query Peaks {
    peakCount(assembly: "GRCh38", assay: "chip-seq") {
        count
    }
  }
`;

const PEAK_1 = {
    experiment_accession: "ENCSR411SUC",
    file_accession: "test-file",
    chrom: "chr19",
    chrom_start: 10000229,
    chrom_end: 10002431,
    name: "Peak_172",
    score: 45,
    strand: ".",
    signal_value: 1.98551,
    p_value: 4.5765,
    q_value: 0.68414,
    peak: 326
};
const PEAK_2 = {
    experiment_accession: "ENCSR411SUC",
    file_accession: "test-file",
    chrom: "chr19",
    chrom_start: 10012431,
    chrom_end: 10036488,
    name: "Peak_174",
    score: 45,
    strand: ".",
    signal_value: 1.98551,
    p_value: 4.5765,
    q_value: 0.68414,
    peak: 4427
};
describe("peaks query", () => {
    test("should return peaks valid request", async () => {
        const variables = { assembly: "hg19", range: [{ chrom: "chr19", chrom_start: 10_000_000, chrom_end: 10_020_000 }] };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.peaks.peaks.length).toBe(3);
        expect(response.body.data.peaks.peaks).toContainEqual(PEAK_2);
    });
    test("should return peaks with datasets ", async () => {
        const variables = { assembly: "hg19", range: [{ chrom: "chr19", chrom_start: 10_000_000, chrom_end: 10_020_000 }] };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: peaksQueryWithDataset, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.peaks.peaks[0].dataset.sequence_reads.length).toBe(2)        
    });

    test("should return peak counts for GRCh38", async () => {
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: countQuery });
        expect(response.status).toBe(200);
        expect(response.body.data.peakCount.count).toBe(5168);
    });

    test("should return peaks request filtered by experiment accession", async () => {
        const variables = {
            assembly: "hg19",
            range: [{ chrom: "chr19", chrom_start: 10_000_000, chrom_end: 10_020_000 }],
            experiment_accession: "ENCSR411SUC"
        };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.peaks.peaks.length).toBe(3);
        expect(response.body.data.peaks.peaks).toContainEqual(PEAK_1);
    });

    test("should return peaks request filtered by file accession", async () => {
        const variables = { assembly: "hg19", range: [{ chrom: "chr19", chrom_start: 10_000_000, chrom_end: 10_020_000 }], file_accession: "test-file" };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.peaks.peaks.length).toBe(3);
        expect(response.body.data.peaks.peaks).toContainEqual(PEAK_1);
    });

    test("should stream peaks", async done => {
        const variables = { assay: "chip_seq", assembly: "hg19", dataformat: "bed", range: [{ chrom: "chr19", chrom_start: 10_000_000, chrom_end: 10_020_000 }] };
        const r = request(app).post("/streampeaks").send(variables);
        r.end((_, y) => {
            expect(y.text).toEqual("chr19	10000229	10002431	test-file	.	0	.	-1	4.577e+0	6.841e-1");
            done();
        });
    });

});
