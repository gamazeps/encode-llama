import request, { Response } from "supertest";

import { 
    createUserCollection, createUserDataset, createUserGQFileMut, createGQFile
} from "./common";
import { MOCK_USER_1_JSON, MOCK_USER_2_JSON } from "../testUtils";
import { QuantificationDataSourceType, QuantificationDataSource } from "../../src/postgres/types";
import { Express } from "express";

import App from "../../src/app";
let app: Express | null = null;

const updateUserGQFileMut = `
    mutation UpdateUserGeneQuantFile($accession: ID!, $assembly: String, $biorep: Int, $techrep: Int) {
        update_user_gene_quantification_file(accession: $accession, assembly: $assembly, biorep: $biorep, techrep: $techrep) {
            accession, dataset_accession, assembly, biorep, techrep
        }
    }
`;

const deleteUserGQFileMut = `
    mutation DeleteUserGeneQuantFile($accession: ID!) {
        delete_user_gene_quantification_file(accession: $accession)
    }
`;

const datasetQuery = `
    query Dataset($source: QuantDataSourceInput, $accession: [String]) {
        gene_dataset(source: $source, accession: $accession) {
            accession,
            gene_quantification_files {
                accession, dataset_accession, assembly, biorep, techrep
            }
        }
    }
`;

async function createCollectionAndDataset(): Promise<any> {
    const createUCResponse: Response = await createUserCollection();
    const ucAccession = createUCResponse.body.data.create_user_collection.accession;
    const createDSResponse: Response = await createUserDataset(ucAccession);
    const dsAccession = createDSResponse.body.data.create_user_dataset.accession;

    return { ucAccession, dsAccession };
}

describe("user gene quantification queries", () => {
    beforeAll( async () => {
        app = await App;
      });
    test("should fail to create a user gene quant file without collection write access", async () => {
        const { dsAccession } = await createCollectionAndDataset();
        const variables = {
            dataset_accession: dsAccession, assembly: "GRCh38", biorep: 1, techrep: 1
        };
        const response = await request(app)
            .post("/graphql").set("user", MOCK_USER_2_JSON)
            .send({ query: createUserGQFileMut, variables });
        expect(response.status).toBe(200);
        expect(response.body.errors.length).toBeGreaterThan(0);
    });

    test("should create a user gene quant file", async () => {
        const { dsAccession, ucAccession } = await createCollectionAndDataset();
        const createResponse = await createGQFile(dsAccession);
        expect(createResponse.status).toBe(200);
        const accession = createResponse.body.data.create_user_gene_quantification_file.accession;
        expect(accession.length).toBeGreaterThan(0);

        const source: QuantificationDataSource = {
            type: QuantificationDataSourceType.USER, user_collection: ucAccession
        };
        const variables = { accession: dsAccession, source };
        const queryResponse = await request(app)
            .post("/graphql").set("user", MOCK_USER_1_JSON)
            .send({ query: datasetQuery, variables });
        expect(queryResponse.status).toBe(200);
        expect(queryResponse.body.data.gene_dataset[0].gene_quantification_files[0]).toEqual({
            accession, dataset_accession: dsAccession, assembly: "GRCh38", biorep: 1, techrep: 1
        });
    });

    test("should fail to update gene quant file without write access", async () => {
        const { dsAccession } = await createCollectionAndDataset();
        const createResponse = await createGQFile(dsAccession);
        const accession = createResponse.body.data.create_user_gene_quantification_file.accession;
        
        const updateResponse = await request(app)
            .post("/graphql").set("user", MOCK_USER_2_JSON)
            .send({ query: updateUserGQFileMut, variables: { accession, biorep: 2 } });
        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.errors.length).toBeGreaterThan(0);
    });

    test("should update gene quant file", async () => {
        const { dsAccession } = await createCollectionAndDataset();
        const createResponse = await createGQFile(dsAccession);
        const accession = createResponse.body.data.create_user_gene_quantification_file.accession;
        
        const updateResponse = await request(app)
            .post("/graphql").set("user", MOCK_USER_1_JSON)
            .send({ query: updateUserGQFileMut, variables: { accession, biorep: 2 } });
        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.data.update_user_gene_quantification_file).toEqual({
            accession, dataset_accession: dsAccession, assembly: "GRCh38", biorep: 2, techrep: 1
        });
    });

    test("should fail to delete gene quant file without write access", async () => {
        const { dsAccession } = await createCollectionAndDataset();
        const createResponse = await createGQFile(dsAccession);
        const accession = createResponse.body.data.create_user_gene_quantification_file.accession;
        
        const updateResponse = await request(app)
            .post("/graphql").set("user", MOCK_USER_2_JSON)
            .send({ query: deleteUserGQFileMut, variables: { accession, biorep: 2 } });
        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.errors.length).toBeGreaterThan(0);
    });

    test("should delete gene quant file", async () => {
        const { dsAccession, ucAccession } = await createCollectionAndDataset();
        const createResponse = await createGQFile(dsAccession);
        const accession = createResponse.body.data.create_user_gene_quantification_file.accession;
        
        const deleteResponse = await request(app)
            .post("/graphql").set("user", MOCK_USER_1_JSON)
            .send({ query: deleteUserGQFileMut, variables: { accession, biorep: 2 } });
        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.body.data.delete_user_gene_quantification_file).toEqual(accession);

        const source: QuantificationDataSource = {
            type: QuantificationDataSourceType.USER, user_collection: ucAccession
        };
        const variables = { accession: dsAccession, source };
        const queryResponse = await request(app)
            .post("/graphql").set("user", MOCK_USER_1_JSON)
            .send({ query: datasetQuery, variables });
        expect(queryResponse.status).toBe(200);
        expect(queryResponse.body.data.gene_dataset[0].gene_quantification_files.length).toEqual(0);
    });
});