import * as express from "express";
import { uploadGeneQuantHandler, uploadTransQuantHandler, downloadGeneQuantHandler, downloadTransQuantHandler } from "./user-files";

export const api = express.Router()
    .post('/gene-quantification-file/:accession', uploadGeneQuantHandler)    
    .get('/gene-quantification-file/:accession', downloadGeneQuantHandler)
    .post('/transcript-quantification-file/:accession', uploadTransQuantHandler)
    .get('/transcript-quantification-file/:accession', downloadTransQuantHandler);

// Distinct list of only paths from this router.
const paths = [...new Set(api.stack.filter((r) => r.route).map((r) => r.route.path))];
api.get("/rest", (_, res) => res.send(paths));    