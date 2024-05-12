import request, { Response } from "supertest";
import { Express } from "express";

import App from "../../src/app";
let app: Express | null = null;
const metadataOnlyQuery = `
    query Dataset($assembly: String, $tissue: [String], $biosample: [String], $lab: [String],
            $cell_compartment: [String], $assay_term_name: [String], $biosample_type: [String],
            $accession: [String]) {
        gene_dataset(tissue: $tissue, biosample: $biosample,
                lab: $lab, cell_compartment: $cell_compartment, assay_term_name: $assay_term_name, 
                biosample_type: $biosample_type, accession: $accession) {
            accession,
            biosample,
            biosample_type,
            tissue,
            cell_compartment,
            lab_name,
            lab_friendly_name,
            assay_term_name,
            signal_files(assembly: $assembly) {
                accession,
                assembly,
                biorep,
                techrep,
                strand,
                unique_reads
            },
            gene_quantification_files(assembly: $assembly) {
                accession,
                assembly,
                biorep,
                techrep
            }
            transcript_quantification_files(assembly: $assembly) {
                accession,
                assembly,
                biorep,
                techrep
            }
        }
    }
`;

const metadataWithGeneQuant = `
    query Dataset($gene_id: [String], $assembly: String, $gene_id_prefix: [String],
                  $tpm_range: QuantificationRange, $fpkm_range: QuantificationRange, $limit:Int) {
        gene_dataset(limit: $limit) {
            accession,
            gene_quantification_files(assembly: $assembly) {
                accession,
                assembly,
                quantifications(gene_id: $gene_id, tpm_range: $tpm_range,
                    fpkm_range: $fpkm_range, gene_id_prefix: $gene_id_prefix) {
                    gene {
                        id
                    },
                    len,
                    effective_len,
                    expected_count,
                    tpm,
                    fpkm,
                    posterior_mean_count,
                    posterior_standard_deviation_of_count,
                    pme_tpm,
                    pme_fpkm,
                    tpm_ci_lower_bound,
                    tpm_ci_upper_bound,
                    fpkm_ci_lower_bound,
                    fpkm_ci_upper_bound
                }
            }
        }
    }
`;

const psychEncodeMetadataWithGeneQuant = `
    query Dataset($source: QuantDataSourceInput, $datasetAccession: [String], 
                $gene_id: [String], $assembly: String,
                $tpm_range: QuantificationRange, $fpkm_range: QuantificationRange, $limit:Int) {
        gene_dataset(source: $source, limit: $limit, accession: $datasetAccession) {
            accession,
            gene_quantification_files(assembly: $assembly) {
                accession,
                assembly,
                quantifications(gene_id: $gene_id, tpm_range: $tpm_range, fpkm_range: $fpkm_range) {
                    len,
                    effective_len,
                    expected_count,
                    tpm,
                    fpkm,
                    posterior_mean_count,
                    posterior_standard_deviation_of_count,
                    pme_tpm,
                    pme_fpkm,
                    tpm_ci_lower_bound,
                    tpm_ci_upper_bound,
                    fpkm_ci_lower_bound,
                    fpkm_ci_upper_bound,
                    tpm_coefficient_of_quartile_variation, 
                    fpkm_coefficient_of_quartile_variation
                }
            }
        }
    }
`;

const metadataWithTranscriptQuant = `
    query Dataset($gene_id: [String], $transcript_id: [String], $assembly: String, $gene_id_prefix: [String],
                  $tpm_range: QuantificationRange, $fpkm_range: QuantificationRange, $limit: Int) {
        gene_dataset(limit: $limit) {
            accession,
            transcript_quantification_files(assembly: $assembly) {
                accession,
                assembly,
                quantifications(transcript_id: $transcript_id, gene_id: $gene_id, gene_id_prefix: $gene_id_prefix,
                                tpm_range: $tpm_range, fpkm_range: $fpkm_range) {
                    transcript {
                        id
                    },
                    gene {
                        id
                    },
                    len,
                    effective_len,
                    expected_count,
                    tpm,
                    fpkm,
                    iso_pct,
                    posterior_mean_count,
                    posterior_standard_deviation_of_count,
                    pme_tpm,
                    pme_fpkm,
                    iso_pct_from_pme_tpm,
                    tpm_ci_lower_bound,
                    tpm_ci_upper_bound,
                    fpkm_ci_lower_bound,
                    fpkm_ci_upper_bound
                }
            }
        }
    }
`;

const DATASET_1 = {
    accession: "ENCSR969JYY",
    assay_term_name: "polyA RNA-seq",
    biosample: "germinal matrix",
    biosample_type: "tissue",
    cell_compartment: null,
    lab_friendly_name: "Joseph Costello",
    lab_name: "joseph-costello",
    tissue: null,
    signal_files: [
        { accession: "ENCFF065ESF", assembly: "GRCh38", biorep: 1, strand: "-", techrep: 1, unique_reads: true },
        { accession: "ENCFF448QRY", assembly: "GRCh38", biorep: 1, strand: "-", techrep: 1, unique_reads: false },
        { accession: "ENCFF546ZPK", assembly: "GRCh38", biorep: 1, strand: "+", techrep: 1, unique_reads: true },
        { accession: "ENCFF853LNU", assembly: "GRCh38", biorep: 1, strand: "+", techrep: 1, unique_reads: false }
    ],
    transcript_quantification_files: [
        { accession: "ENCFF543WLD", assembly: "GRCh38", biorep: 1, techrep: 1 }
    ],
    gene_quantification_files: [
        { accession: "ENCFF951YSP", assembly: "GRCh38", biorep: 1, techrep: 1 }
    ]
};

const DATASET_WITH_GENE_QUANT_1 = {
    accession: "ENCSR969JYY",
    gene_quantification_files: [{
        accession: "ENCFF951YSP",
        assembly: "GRCh38",
        quantifications: [{
            effective_len: 1364.67,
            expected_count: 40469,
            fpkm: 615.19,
            fpkm_ci_lower_bound: 605.695,
            fpkm_ci_upper_bound: 627.688,
            gene: { id: "ENSG00000011465.17" },
            len: 1399.67,
            pme_fpkm: 616.19,
            pme_tpm: 990.27,
            posterior_mean_count: 40469,
            posterior_standard_deviation_of_count: 0,
            tpm: 1006.87,
            tpm_ci_lower_bound: 973.154,
            tpm_ci_upper_bound: 1008.49
        }]
    }]
};

const PSYCH_ENCODE_DATASET_1 = {
    accession: "HSB132_STCrnaSeq",
    gene_quantification_files: [{
        accession: "syn8254669",
        assembly: "hg19",
        quantifications: [{
            effective_len: 2326.62,
            expected_count: 1218,
            fpkm: 40.47,
            fpkm_ci_lower_bound: 37.8954,
            fpkm_ci_upper_bound: 45.1342,
            fpkm_coefficient_of_quartile_variation: 0.0300303,
            len: 2609.48,
            pme_fpkm: 41.43,
            pme_tpm: 8.44,
            posterior_mean_count: 1218,
            posterior_standard_deviation_of_count: 0,
            tpm: 8.3,
            tpm_ci_lower_bound: 7.70334,
            tpm_ci_upper_bound: 9.17804,
            tpm_coefficient_of_quartile_variation: 0.0300106
        }]
    }]
}

const DATASET_WITH_TRANSCRIPT_QUANT_1 = {
    accession: "ENCSR969JYY",
    transcript_quantification_files: [{
        accession: "ENCFF543WLD",
        assembly: "GRCh38",
        quantifications: [{
            effective_len: 470,
            expected_count: 3.3,
            fpkm: 0.15,
            fpkm_ci_lower_bound: 0.0219904,
            fpkm_ci_upper_bound: 0.460158,
            gene: { id: "ENSG00000003393.15" },
            iso_pct: 1.26,
            iso_pct_from_pme_tpm: 1.77,
            len: 505,
            pme_fpkm: 0.22,
            pme_tpm: 0.35,
            posterior_mean_count: 3.9,
            posterior_standard_deviation_of_count: 1.76,
            tpm: 0.24,
            tpm_ci_lower_bound: 0.0353248,
            tpm_ci_upper_bound: 0.739338,
            transcript: {"id": "ENST00000483703.1"}
        }]
    }]
};

describe("dataset query", () => {
    beforeAll( async () => {
        app = await App;
      });

    test("should return data for a metadata only query", async () => {
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: metadataOnlyQuery, variables: { assembly: "GRCh38" } });
        expect(response.status).toBe(200);
        expect(response.body.data.gene_dataset.length).toBe(1);
        expect(response.body.data.gene_dataset).toContainEqual(DATASET_1);
    });

    test("should return data for a metadata with gene quantification query", async () => {
        const variables = {
            assembly: "GRCh38",
            tpm_range: {
                low: 1000,
                high: 1010
            },
            limit: 1
        };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: metadataWithGeneQuant, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.gene_dataset.length).toBe(1);
        expect(response.body.data.gene_dataset).toContainEqual(DATASET_WITH_GENE_QUANT_1);
    });

    test("should return data for a metadata with gene quantification query", async () => {
        const variables = {
            assembly: "GRCh38",
            gene_id_prefix: "ENSG00000011465",
            limit: 1
        };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: metadataWithGeneQuant, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.gene_dataset.length).toBe(1);
        expect(response.body.data.gene_dataset).toContainEqual(DATASET_WITH_GENE_QUANT_1);
    });

    test("should return data for a metadata with transcript quantification query", async () => {
        const variables = {
            assembly: "GRCh38",
            tpm_range: {
                low: 0.239,
                high: 0.241
            },
            gene_id_prefix: ["ENSG00000003393"]
        };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: metadataWithTranscriptQuant, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.gene_dataset.length).toBe(1);
        expect(response.body.data.gene_dataset).toContainEqual(DATASET_WITH_TRANSCRIPT_QUANT_1);
    });

    test("should return data for psychencode metadata with gene quantification query", async () => {
        const variables = {
            assembly: "hg19",
            datasetAccession: ["HSB132_STCrnaSeq"],
            source: { type: "PSYCH_ENCODE" },
            tpm_range: {
                low: 8.2,
                high: 8.4
            }
        };

        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: psychEncodeMetadataWithGeneQuant, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.gene_dataset.length).toBe(1);
        expect(response.body.data.gene_dataset[0]).toEqual(PSYCH_ENCODE_DATASET_1);
    });
});
