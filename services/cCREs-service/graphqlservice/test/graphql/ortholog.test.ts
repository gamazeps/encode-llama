import "jest";
import request, { Response } from "supertest";
import { Express } from "express";

import App from "../../src/app";
let app: Express | null = null;

const query = `
    query(
        $assembly: String!
        $accession: String!
    ){
        orthologQuery(
            assembly: $assembly
            accession: $accession
        ){
            assembly
            accession
            ortholog
        }
    }
`;

describe("GraphQL layer", () => {
    beforeAll(async () => {
        app = await App;
    });

    test("should return ortholog data for GRCh38 and mm10 for GRCh38...", async () => {
        const variables = {
            assembly: "grch38",
            accession: "EH38E3031186"
        };

        const response: Response = await request(app)
            .post("/graphql")
            .send({ query, variables });

        // check response log
        // console.log(response);
        // console.info(response.body.data);

        // OK
        expect(response.status).toBe(200);

        // check query
        expect(response.body.data.orthologQuery).toEqual({
            assembly: "grch38",
            accession: "EH38E3031186",
            ortholog: ["EM10E0487046"]
        });
    });

    test("should return ortholog data for grch38 and mm10 for mm10...", async () => {
        const variables = {
            assembly: "mm10",
            accession: "EM10E0963787"
        };

        const response: Response = await request(app)
            .post("/graphql")
            .send({ query, variables });

        // check response log
        // console.log(response);
        // console.info(response.body.data.orthologQuery);

        // OK
        expect(response.status).toBe(200);

        // check query
        expect(response.body.data.orthologQuery).toEqual({
            assembly: "mm10",
            accession: "EM10E0963787",
            ortholog: ["EH38E1630297", "EH38E1630296"]
        });
    });
});
