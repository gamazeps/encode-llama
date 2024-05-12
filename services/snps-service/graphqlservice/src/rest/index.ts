import * as express from "express";
import { streamLDByIDs } from "./ld";

export const api = express.Router().post("/stream-ld", streamLDByIDs);

// Distinct list of only paths from this router.
const paths = [...new Set(api.stack.filter((r) => r.route).map((r) => r.route.path))];
api.get("/rest", (_, res) => res.send(paths));
