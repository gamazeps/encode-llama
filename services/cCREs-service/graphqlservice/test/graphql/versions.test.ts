import "jest";
import request, { Response } from "supertest";
import { Express } from "express";

import App from "../../src/app";
let app: Express | null = null;

const query = `
    query {
        groundLevelVersionsQuery {
            version
            biosample
            assay
            accession
        }
    }
`;

describe("GraphQL layer", () => {
    beforeAll(async () => {
        app = await App;
    });

    test("should return ...", async () => {
        const response: Response = await request(app)
            .post("/graphql")
            .send({ query });

        // check response log
        // console.log(response);

        // OK
        expect(response.status).toBe(200);

        // check reponse data
        // console.info(response.body.data);
        // console.info(response.body.data.groundLevelVersionsQuery);
        // console.log(typeof response.body.data.groundLevelVerionsQuery);

        // check body
        // expect(response.body.data.groundLevelVerionsQuery).toEqual([
        //     {
        //         version: "2020-1",
        //         biosamples: [
        //             {
        //                 biosample: "b'Homo sapiens keratinocyte female'",
        //                 assays: [
        //                     {
        //                         assay: "ChIP-seq",
        //                         experiments: [
        //                             "ENCSR000ARN",
        //                             "ENCSR000ALQ",
        //                             "ENCSR000ALR",
        //                             "ENCSR000ALI",
        //                             "ENCSR000ALM",
        //                             "ENCSR000ALJ",
        //                             "ENCSR000DWT",
        //                             "ENCSR000ARL",
        //                             "ENCSR000ALO",
        //                             "ENCSR000ALK",
        //                             "ENCSR000ARM",
        //                             "ENCSR000ALL",
        //                             "ENCSR000DWX",
        //                             "ENCSR000DWV",
        //                             "ENCSR000ALP",
        //                             "ENCSR000DWW",
        //                             "ENCSR000DWU",
        //                             "ENCSR000ALS",
        //                             "ENCSR000DNC",
        //                             "ENCSR970FPM",
        //                             "ENCSR678FZH"
        //                         ]
        //                     }
        //                 ]
        //             }
        //         ]
        //     }
        // ]);
    });
});
