import * as express from "express";
import * as tf from '@tensorflow/tfjs';
import { associateBy } from "queryz";
import { Config } from "../init";

import { db } from '../postgres';
import { ZScoreParameters } from "../postgres/types";
import { select_z_score_tensor } from "../postgres/zscore/select";
import { select_rDHSs } from "../postgres/rdhs";

const BATCH_SIZE = 100;

async function _stream_active_in_biosamples(config: Config, parameters: ZScoreParameters, res: express.Response) {

    const ttensor = select_z_score_tensor(parameters, config);
    if (ttensor === undefined) return res.end("");

    /* unpack; get max Z-score across matching biosamples */
    let { rows, tensor } = ttensor;
    if (rows === undefined) rows = [ ...Array(tensor.shape[0]).keys() ];
    const aggregated = ttensor.tensor.max(1);

    /* filter at Z >1.64 */
    const i = await tf.whereAsync(aggregated.greater(1.64));
    const result = (await aggregated.data()) as Float32Array;
    const indexes = await i.data();

    /* iterate through batches */
    for (let i = 0; i < indexes.length; i += BATCH_SIZE) {

        /* get list of accessions and indexes in this batch */
        const r: string[] = [];
        const idm: { [key: string]: number } = {};
        indexes.slice(i, i + BATCH_SIZE).forEach( (x: number) => {
            const accession = config.rdhs_list[parameters.assembly.toLocaleLowerCase()][rows![x]];
            r.push(accession);
            idm[accession] = x;
        });

        /* fetch matching coordinates from the database */
        const coordinates = associateBy(
            await select_rDHSs({ accession: r, assembly: parameters.assembly }, db),
            x => x.accession, x => ({ chromosome: x.chromosome, start: x.start, end: x.stop })
        );

        /* write coordinates and max Z for each cCRE in this batch */
        [ ...coordinates.keys() ].forEach( k => {
            const c = coordinates.get(k)!;
            res.write(`${c.chromosome}\t${c.start}\t${c.end}\t${k}\t${result[idm[k]]}\n`);
        });

    }

    res.end();

}

export const stream_active_in_biosamples = (config: Config) => async (req: express.Request, res: express.Response) => {
    if (req.body) return _stream_active_in_biosamples(config, typeof req.body === "string" ? JSON.parse(req.body) : req.body, res);
    let data = "";
    req.addListener('data', x => data += x);
    req.addListener('end', () => _stream_active_in_biosamples(config, JSON.parse(data), res));
}
