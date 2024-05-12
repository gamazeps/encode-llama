import request, { Response } from "supertest";
//import app from "../../src/app";
import { MOCK_USER_1_JSON } from "../testUtils";
import { Express } from "express";

import App from "../../src/app";
let app: Express | null = null;

export async function createCollectionAndDataset(geneQuant: boolean = true, isPublic: boolean = false): Promise<any> {
    const createUCResponse: Response = await createUserCollection(isPublic);
    const ucAccession = createUCResponse.body.data.create_user_collection.accession;
    const createDSResponse: Response = await createUserDataset(ucAccession);
    const dsAccession = createDSResponse.body.data.create_user_dataset.accession;

    let fileAccession;
    if (geneQuant) {
        const createResponse = await createGQFile(dsAccession);
        fileAccession = createResponse.body.data.create_user_gene_quantification_file.accession;
    } else {
        const createResponse = await createTQFile(dsAccession);
        fileAccession = createResponse.body.data.create_user_transcript_quantification_file.accession;
    }

    return { ucAccession, dsAccession, fileAccession };
}

export const createUserCollectionMut = `
    mutation CreateUserCollection($name: String!, $is_public: Boolean) {
        create_user_collection(name: $name, is_public: $is_public) {
            accession, name, is_public
        }
    }
`;

export async function createUserCollection(isPublic: boolean = false): Promise<Response> {
    app = await App;
    const variables = { name: "test-collection", is_public: isPublic };
    return request(app)
        .post("/graphql")
        .set("user", MOCK_USER_1_JSON)
        .send({ query: createUserCollectionMut, variables }); 
}

const createUserDatasetMut = `
    mutation CreateUserDataset($user_collection_accession: ID!, $biosample: String!, $biosample_type: String, 
            $tissue: String, $cell_compartment: String, $lab_name: String, $lab_friendly_name: String,
            $assay_term_name: String) {
        create_user_dataset(user_collection_accession: $user_collection_accession, biosample: $biosample, biosample_type: $biosample_type,
                tissue: $tissue, cell_compartment: $cell_compartment, lab_name: $lab_name, lab_friendly_name: $lab_friendly_name,
                assay_term_name: $assay_term_name) {
            source { type, user_collection },
            accession, biosample, biosample_type, tissue, cell_compartment, lab_name, lab_friendly_name,
            assay_term_name
        }
    }
`;

export const testUserDatasetArgs = {
    biosample: "test-biosample",
    biosample_type: "test-biosample-type",
    tissue: "test-tissue",
    cell_compartment: "test-cell-compartment",
    lab_name: "test-lab-name",
    assay_term_name: "test-assay-term-name"
}

export async function createUserDataset(ucAccession: string): Promise<Response> {
    app = await App;
    const variables = { 
        user_collection_accession: ucAccession, 
        ...testUserDatasetArgs
    };
    return request(app)
        .post("/graphql").set("user", MOCK_USER_1_JSON)
        .send({ query: createUserDatasetMut, variables });
}

export const createUserGQFileMut = `
    mutation CreateUserGeneQuantFile($dataset_accession: ID!, $assembly: String, $biorep: Int, $techrep: Int) {
        create_user_gene_quantification_file(dataset_accession: $dataset_accession, assembly: $assembly,
                biorep: $biorep, techrep: $techrep) {
            accession, dataset_accession, assembly, biorep, techrep
        }
    }
`;

export async function createGQFile(dsAccession: string): Promise<Response> {
    const variables = {
        dataset_accession: dsAccession, assembly: "GRCh38", biorep: 1, techrep: 1
    };
    app = await App;
    return request(app)
        .post("/graphql").set("user", MOCK_USER_1_JSON)
        .send({ query: createUserGQFileMut, variables });
}

export const createUserTQFileMut = `
    mutation CreateUserTranscriptQuantFile($dataset_accession: ID!, $assembly: String, $biorep: Int, $techrep: Int) {
        create_user_transcript_quantification_file(dataset_accession: $dataset_accession, assembly: $assembly,
                biorep: $biorep, techrep: $techrep) {
            accession, dataset_accession, assembly, biorep, techrep
        }
    }
`;

export async function createTQFile(dsAccession: string): Promise<Response> {
    const variables = {
        dataset_accession: dsAccession, assembly: "GRCh38", biorep: 1, techrep: 1
    };
    app = await App;
    return request(app)
        .post("/graphql").set("user", MOCK_USER_1_JSON)
        .send({ query: createUserTQFileMut, variables });
}