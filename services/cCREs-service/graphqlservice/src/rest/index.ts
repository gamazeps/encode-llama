import * as express from "express";
import { Config } from "../init";
import { stream_active_in_biosamples } from "./coordinates";

export const api = (config: Config) => {

    const api = express.Router().post("/stream-active-rdhss", stream_active_in_biosamples(config));

    // Distinct list of only paths from this router.
    const paths = [...new Set(api.stack.filter((r) => r.route).map((r) => r.route.path))];
    api.get("/rest", (_, res) => res.send(paths));
    
    return api;

};
