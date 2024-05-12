import request, { Response } from "supertest";
//import app from "../../src/app";
import { trimIndent } from "../../src/util/misc";
import { createCollectionAndDataset, createGQFile, createTQFile } from "./common";
import { updateUserCollection } from "../../src/postgres/user-collection/select";
import { execShellCommand } from "../testUtils";
import { Express } from "express";

import App from "../../src/app";
let app: Express | null = null;
const geneQuery = `
query GeneQuantification($source: QuantDataSourceInput, $assembly: String!, 
        $experiment_accession: [String], $file_accession: [String], $gene_id: [String], 
        $tpm_range: QuantificationRange, $fpkm_range: QuantificationRange,
        $limit: Int, $offset: Int, $sortByTpm: Boolean, $gene_id_prefix: [String]) {
    gene_quantification(source: $source, assembly: $assembly, experiment_accession: $experiment_accession, 
            file_accession: $file_accession, gene_id: $gene_id, tpm_range: $tpm_range, 
            fpkm_range: $fpkm_range, limit: $limit, offset: $offset,sortByTpm: $sortByTpm,
            gene_id_prefix: $gene_id_prefix) {
        experiment_accession, file_accession,
        expected_count, len, effective_len,
        tpm, fpkm, posterior_mean_count, posterior_standard_deviation_of_count, 
        pme_tpm, pme_fpkm, tpm_ci_lower_bound, tpm_ci_upper_bound, tpm_ci_upper_bound,
        fpkm_ci_lower_bound, fpkm_ci_upper_bound, gene { id }
    }
}
`;

const psychEncodeGeneQuery = `
query GeneQuantification($source: QuantDataSourceInput, $assembly: String!, 
        $experiment_accession: [String], $file_accession: [String], $gene_id: [String], 
        $tpm_range: QuantificationRange, $fpkm_range: QuantificationRange,
        $limit: Int, $offset: Int, $sortByTpm: Boolean) {
    gene_quantification(source: $source, assembly: $assembly, experiment_accession: $experiment_accession, 
            file_accession: $file_accession, gene_id: $gene_id, tpm_range: $tpm_range, 
            fpkm_range: $fpkm_range, limit: $limit, offset: $offset,sortByTpm: $sortByTpm) {
        experiment_accession, file_accession,
        expected_count, len, effective_len,
        tpm, fpkm, posterior_mean_count, posterior_standard_deviation_of_count, 
        pme_tpm, pme_fpkm, tpm_ci_lower_bound, tpm_ci_upper_bound, tpm_ci_upper_bound,
        fpkm_ci_lower_bound, fpkm_ci_upper_bound, tpm_coefficient_of_quartile_variation, 
        fpkm_coefficient_of_quartile_variation
    }
}
`;

const transcriptQuery = `
query TranscriptQuantification($source: QuantDataSourceInput, $assembly: String!, 
        $experiment_accession: [String], $file_accession: [String], $transcript_id: [String], 
        $gene_id: [String], $tpm_range: QuantificationRange, $fpkm_range: QuantificationRange,
        $limit: Int, $offset: Int) {
    transcript_quantification(source: $source, assembly: $assembly, experiment_accession: $experiment_accession, 
            file_accession: $file_accession, transcript_id: $transcript_id, gene_id: $gene_id, 
            tpm_range: $tpm_range, fpkm_range: $fpkm_range, limit: $limit, offset: $offset) {
        experiment_accession, file_accession, 
        len, effective_len, expected_count, tpm, fpkm, iso_pct,
        posterior_mean_count, posterior_standard_deviation_of_count, pme_tpm, pme_fpkm,
        iso_pct_from_pme_tpm, tpm_ci_lower_bound, tpm_ci_upper_bound, fpkm_ci_lower_bound,
        fpkm_ci_upper_bound
    }
}
`;

const importerCmd = (schema: string, assembly: string, dsAccession: string, geneFileAccession: string, 
    transcriptFileAccession: string) => {
    return trimIndent(
    `java -jar ../importer/build/genes-importer-*.jar \\
        --db-url jdbc:postgresql://$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB \\
        --db-username $POSTGRES_USER \\
        --db-schema ${schema} \\
        --replace-schema \\
        --local-gene-quantification-files "${assembly};${dsAccession};${geneFileAccession};test-resources/gene-quant-subset.tsv" \\
        --local-transcript-quantification-files "${assembly};${dsAccession};${transcriptFileAccession};test-resources/transcript-quant-subset.tsv"
    `, true);
}

const GENE_QUANT_1 = {
    experiment_accession: "ENCSR969JYY",
    file_accession: "ENCFF951YSP",
    gene: {
        id: "ENSG00000011465.17"
    },
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

describe("gene query", () => {

    beforeAll( async () => {
        app = await App;
      });
    test("should return one gene quantification by tpm range", async () => {
        const variables = {
            assembly: "GRCh38",
            tpm_range: {
                low: 1000,
                high: 1010
            }
        };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: geneQuery, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.gene_quantification.length).toBe(1);
        expect(response.body.data.gene_quantification).toContainEqual(GENE_QUANT_1);
    });

    test("should return one gene quantification by gene ID prefix", async () => {
        const variables = {
            assembly: "GRCh38",
            gene_id_prefix: "ENSG00000011465"
        };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: geneQuery, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.gene_quantification.length).toBe(1);
        expect(response.body.data.gene_quantification).toContainEqual(GENE_QUANT_1);
    });

    test("should return one transcript quantification by tpm range", async () => {
        const variables = {
            assembly: "grch38",
            tpm_range: {
                low: 110,
                high: 120
            }
        };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: transcriptQuery, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.transcript_quantification.length).toBe(1);
        expect(response.body.data.transcript_quantification).toContainEqual(TRANSCRIPT_QUANT_1);
    });

    test("should return gene quantifications with offset and limit", async () => {
        const variables = {
            assembly: "grch38",
            tpm_range: {
                low: 100,
                high: 500
            },
            limit: 10,
            offset: 5
        };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: geneQuery, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.gene_quantification.length).toBe(10);
    });

    test("should return gene quantifications with sortbyTPM and limit", async () => {
        const variables = {
            assembly: "grch38",
            tpm_range: {
                low: 100,
                high: 500
            },
            limit: 10,
            sortByTpm: true
        };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: geneQuery, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.gene_quantification.length).toBe(10);
    });

    test("should return one psychencode transcript quantification by tpm range", async () => {
        const variables = {
            assembly: "hg19",
            source: { type: "PSYCH_ENCODE" },
            tpm_range: {
                low: 7.9,
                high: 8
            }
        };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: transcriptQuery, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.transcript_quantification.length).toBe(1);
        expect(response.body.data.transcript_quantification[0]).toEqual({
            "effective_len": 3639.63, 
            "expected_count": 865.24, 
            "experiment_accession": "HSB132_STCrnaSeq", 
            "file_accession": "HSB132_STC.RSEM_Quant.isoforms.results", 
            "fpkm": 11.66, 
            "fpkm_ci_lower_bound": 10.7022, 
            "fpkm_ci_upper_bound": 12.3049, 
            "iso_pct": 98.12, 
            "iso_pct_from_pme_tpm": 96.45, 
            "len": 3811, 
            "pme_fpkm": 11.5, 
            "pme_tpm": 7.33, 
            "posterior_mean_count": 860.02, 
            "posterior_standard_deviation_of_count": 8.33, 
            "tpm": 7.96, 
            "tpm_ci_lower_bound": 6.82844, 
            "tpm_ci_upper_bound": 7.85073
        });
    });

    test("should return one psychencode gene quantification by tpm range", async () => {
        const variables = {
            assembly: "hg19",
            source: { type: "PSYCH_ENCODE" },
            tpm_range: {
                low: 8.2,
                high: 8.4
            }
        };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: psychEncodeGeneQuery, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.gene_quantification.length).toBe(1);
        expect(response.body.data.gene_quantification[0]).toEqual({
            "experiment_accession": "HSB132_STCrnaSeq",
            "file_accession": "HSB132_STC.RSEM_Quant.genes.results",
            "expected_count": 1218,
            "len": 2609.48,
            "effective_len": 2326.62,
            "tpm": 8.3,
            "fpkm": 40.47,
            "posterior_mean_count": 1218,
            "posterior_standard_deviation_of_count": 0,
            "pme_tpm": 8.44,
            "pme_fpkm": 41.43,
            "tpm_ci_lower_bound": 7.70334,
            "tpm_ci_upper_bound": 9.17804,
            "fpkm_ci_lower_bound": 37.8954,
            "fpkm_ci_upper_bound": 45.1342,
            "tpm_coefficient_of_quartile_variation": 0.0300106,
            "fpkm_coefficient_of_quartile_variation": 0.0300303
        });
    });

    test("should return one user gene and transcript quantification by tpm range", async () => {
        const { dsAccession, ucAccession } = await createCollectionAndDataset();
        const createGQResponse = await createGQFile(dsAccession);
        const gqFileAccession = createGQResponse.body.data.create_user_gene_quantification_file.accession;
        const createTQResponse = await createTQFile(dsAccession);
        const tqFileAccession = createTQResponse.body.data.create_user_transcript_quantification_file.accession;
        const schema = "uc_test";
        const assembly = createGQResponse.body.data.create_user_gene_quantification_file.assembly;
        
        const cmd = importerCmd(schema, assembly, dsAccession, gqFileAccession, tqFileAccession);
        await execShellCommand(cmd);
        await updateUserCollection({ accession: ucAccession, quant_data_schema: schema });

        const variables = {
            assembly,
            source: { type: "USER", user_collection: ucAccession },
            tpm_range: {
                low: 1000,
                high: 1010
            }
        };
        const userGeneQuant1 = {
            ...GENE_QUANT_1,
            experiment_accession: dsAccession,
            file_accession: gqFileAccession
        };
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query: geneQuery, variables });
        expect(response.status).toBe(200);
        expect(response.body.data.gene_quantification.length).toBe(1);
        expect(response.body.data.gene_quantification).toContainEqual(userGeneQuant1);
    });

});
