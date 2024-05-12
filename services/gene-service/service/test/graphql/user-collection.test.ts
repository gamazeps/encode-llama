import request, { Response } from "supertest";

import { MOCK_USER_1_JSON, MOCK_USER_2_JSON } from "../testUtils";
import { createUserCollectionMut, createUserCollection } from "./common";
import { Express } from "express";

import App from "../../src/app";
let app: Express | null = null;

const updateUserCollectionMut = `
    mutation UpdateUserCollection($accession: ID!, $name: String, $is_public: Boolean) {
        update_user_collection(accession: $accession, name: $name, is_public: $is_public) {
            accession, name, is_public
        }
    }
`;

const deleteUserCollectionMut = `
    mutation DeleteUserCollection($accession: ID!) {
        delete_user_collection(accession: $accession)
    }
`;

const userCollectionQuery = `
    query UserCollection($accession: ID!) {
        user_collection(accession: $accession) {
            accession, name, is_public
        }
    }
`;

describe("user collection queries", () => {
    beforeAll( async () => {
        app = await App;
      });
    test("should create a user collection", async () => {
        const createResponse: Response = await createUserCollection();
        expect(createResponse.status).toBe(200);
        const accession = createResponse.body.data.create_user_collection.accession;
        expect(accession.length).toBeGreaterThan(0);
        expect(createResponse.body.data.create_user_collection).toEqual({
            accession, is_public: false, name: "test-collection"
        });
    });

    test("should fail to query non-public user collection from another user", async () => {
        const createResponse: Response = await createUserCollection();
        const accession = createResponse.body.data.create_user_collection.accession;
        const badQueryResponse: Response = await request(app)
            .post("/graphql")
            .set("user", MOCK_USER_2_JSON)
            .send({ query: userCollectionQuery, variables: { accession } });
        expect(badQueryResponse.status).toBe(200);
        expect(badQueryResponse.body.data.user_collection).toBeNull();
    });

    test("should query public collection from another user and succeed", async () => {
        const createResponse: Response = await createUserCollection(true);
        const accession = createResponse.body.data.create_user_collection.accession;

        const queryResponse: Response = await request(app)
            .post("/graphql")
            .set("user", MOCK_USER_2_JSON)
            .send({ query: userCollectionQuery, variables: { accession } });
        expect(queryResponse.status).toBe(200);
        expect(queryResponse.body.data.user_collection).toEqual({
            accession, is_public: true, name: "test-collection"
        });
    });

    test("should fail to update non-public user collection from another user", async () => {
        const createResponse: Response = await createUserCollection();
        const accession = createResponse.body.data.create_user_collection.accession;

        const variables = { accession, name: "test-collection-2", is_public: true };
        const badUpdateResponse: Response = await request(app)
            .post("/graphql")
            .set("user", MOCK_USER_2_JSON)
            .send({ query: updateUserCollectionMut, variables });
        expect(badUpdateResponse.status).toBe(200);
        expect(badUpdateResponse.body.errors.length).toBeGreaterThan(0);
    });

    test("should update user collection", async () => {
        const createResponse: Response = await createUserCollection();
        const accession = createResponse.body.data.create_user_collection.accession;

        const variables = { accession, name: "test-collection-2", is_public: true };
        const updateResponse: Response = await request(app)
            .post("/graphql")
            .set("user", MOCK_USER_1_JSON)
            .send({ query: updateUserCollectionMut, variables });
        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.data.update_user_collection).toEqual({
            accession,
            is_public: true,
            name: "test-collection-2"
        });
    });

    test("should delete user collection", async () => {
        const createResponse: Response = await createUserCollection();
        const accession = createResponse.body.data.create_user_collection.accession;

        const deleteResponse: Response = await request(app)
            .post("/graphql")
            .set("user", MOCK_USER_1_JSON)
            .send({ query: deleteUserCollectionMut, variables: { accession } });
        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.body.data.delete_user_collection).toEqual(accession);
    });
});