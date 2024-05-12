import request, { Response } from "supertest";

import { MOCK_USER_1_JSON, MOCK_USER_2_JSON, removeNullFields } from "../testUtils";
import { createUserCollection, createUserDataset, testUserDatasetArgs } from "./common";
import { QuantificationDataSourceType, QuantificationDataSource } from "../../src/postgres/types";
import { Express } from "express";

import App from "../../src/app";
let app: Express | null = null;

const updateUserDatasetMut = `
    mutation UpdateUserDataset($accession: ID!, $biosample: String, $biosample_type: String, 
            $tissue: String, $cell_compartment: String, $lab_name: String, $lab_friendly_name: String,
            $assay_term_name: String, $metadata: JSON) {
        update_user_dataset(accession: $accession, biosample: $biosample, biosample_type: $biosample_type,
                tissue: $tissue, cell_compartment: $cell_compartment, lab_name: $lab_name, lab_friendly_name: $lab_friendly_name,
                assay_term_name: $assay_term_name, metadata: $metadata) {
            source { type, user_collection },
            accession, biosample, biosample_type, tissue, cell_compartment, lab_name, lab_friendly_name,
            assay_term_name, metadata
        }
    }
`;

const deleteUserDatasetMut = `
    mutation DeleteUserDataset($accession: ID!) {
        delete_user_dataset(accession: $accession)
    }
`;

const datasetQuery = `
    query Dataset($source: QuantDataSourceInput, $accession: [String], $user_collection_accession: [String]) {
        gene_dataset(source: $source, accession: $accession, user_collection_accession: $user_collection_accession) {
            accession, biosample, biosample_type, tissue, cell_compartment, lab_name,
            lab_friendly_name, assay_term_name, user_collection_accession
        }
    }
`;

describe("user dataset queries", () => {
    beforeAll( async () => {
        app = await App;
      });
    test("Should create a user dataset", async () => {
        const createUCResponse: Response = await createUserCollection();
        const ucAccession = createUCResponse.body.data.create_user_collection.accession;

        const createResponse: Response = await createUserDataset(ucAccession);
        expect(createResponse.status).toBe(200);
        const accession = createResponse.body.data.create_user_dataset.accession;
        expect(accession.length).toBeGreaterThan(0);
        
        const source: QuantificationDataSource = {
            type: QuantificationDataSourceType.USER, user_collection: ucAccession
        };
        expect(removeNullFields(createResponse.body.data.create_user_dataset)).toEqual({
            accession, source, ...testUserDatasetArgs
        });

        const queryResponse = await request(app)
            .post("/graphql").set("user", MOCK_USER_1_JSON)
            .send({ query: datasetQuery, variables: { source, accession: [accession],user_collection_accession :[ucAccession] } });
        expect(queryResponse.status).toBe(200);
        expect(queryResponse.body.data.gene_dataset.length).toBe(1);
    });

    test("should fail to query dataset in non-public user collection from another user", async () => {
        const createUCResponse: Response = await createUserCollection();
        const ucAccession = createUCResponse.body.data.create_user_collection.accession;
        const createResponse: Response = await createUserDataset(ucAccession);
        const accession = createResponse.body.data.create_user_dataset.accession;

        const source: QuantificationDataSource = {
            type: QuantificationDataSourceType.USER, user_collection: ucAccession
        };
        const queryResponse = await request(app)
            .post("/graphql").set("user", MOCK_USER_2_JSON)
            .send({ query: datasetQuery, variables: { source, accession: [accession] } });
        expect(queryResponse.status).toBe(200);
        expect(queryResponse.body.errors.length).toBeGreaterThan(0);
    });

    test("should query public dataset from another user and succeed", async () => {
        const createUCResponse: Response = await createUserCollection(true);
        const ucAccession = createUCResponse.body.data.create_user_collection.accession;
        const createResponse: Response = await createUserDataset(ucAccession);
        const accession = createResponse.body.data.create_user_dataset.accession;

        const source: QuantificationDataSource = {
            type: QuantificationDataSourceType.USER, user_collection: ucAccession
        };
        const queryResponse = await request(app)
            .post("/graphql").set("user", MOCK_USER_2_JSON)
            .send({ query: datasetQuery, variables: { source, accession: [accession] } });
        expect(queryResponse.status).toBe(200);
        expect(queryResponse.body.data.gene_dataset.length).toBe(1);
    });

    test("should fail to update non-public user dataset from another user's collection", async () => {
        const createUCResponse: Response = await createUserCollection();
        const ucAccession = createUCResponse.body.data.create_user_collection.accession;
        const createResponse: Response = await createUserDataset(ucAccession);
        const accession = createResponse.body.data.create_user_dataset.accession;

        const variables = { 
            accession, 
            biosample: "test-biosample-2",
            assay_term_name: "test-assay-term-name-2"
        };
        const response = await request(app)
            .post("/graphql").set("user", MOCK_USER_2_JSON)
            .send({ query: updateUserDatasetMut, variables });        
            expect(response.status).toBe(200);

        expect(response.body.errors.length).toBeGreaterThan(0);
    });

    test("should update user dataset", async () => {
        const createUCResponse: Response = await createUserCollection();
        const ucAccession = createUCResponse.body.data.create_user_collection.accession;
        const createResponse: Response = await createUserDataset(ucAccession);
        const accession = createResponse.body.data.create_user_dataset.accession;

        const variables = { 
            accession, 
            biosample: "test-biosample-2",
            assay_term_name: "test-assay-term-name-2",
            metadata: { "testkey": "testvalue"}
        };
        const response = await request(app)
            .post("/graphql").set("user", MOCK_USER_1_JSON)
            .send({ query: updateUserDatasetMut, variables });
        expect(response.status).toBe(200);
        const source: QuantificationDataSource = {
            type: QuantificationDataSourceType.USER, user_collection: ucAccession
        };
        expect(removeNullFields(response.body.data.update_user_dataset)).toEqual({
            source,
            accession,
            biosample: "test-biosample-2",
            biosample_type: "test-biosample-type",
            tissue: "test-tissue",
            cell_compartment: "test-cell-compartment",
            lab_name: "test-lab-name",
            assay_term_name: "test-assay-term-name-2",
            metadata: { "testkey": "testvalue"}
        });
    });

    test("should delete user dataset", async () => {
        const createUCResponse: Response = await createUserCollection();
        const ucAccession = createUCResponse.body.data.create_user_collection.accession;
        const createResponse: Response = await createUserDataset(ucAccession);
        const accession = createResponse.body.data.create_user_dataset.accession;

        const deleteResponse: Response = await request(app)
            .post("/graphql")
            .set("user", MOCK_USER_1_JSON)
            .send({ query: deleteUserDatasetMut, variables: { accession } });
        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.body.data.delete_user_dataset).toEqual(accession);
    });

});