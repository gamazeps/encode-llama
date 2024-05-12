import * as tf from '@tensorflow/tfjs';
import { Config } from "../../init";

export type LDRParameters = {
    studies?: string[];
    biosamples?: string[];
};

export type LDREntry = {
    biosample: string;
    study: string;
    enrichment: number;
    enrichment_error: number;
    enrichment_p: number;
    conditional_enrichment: number;
    conditional_error: number;
    conditional_p: number;
};

export async function select_ldr(parameters: LDRParameters, config: Config): Promise<LDREntry[]> {
    const cols = parameters.studies?.map(x => [ x, config.ldr.studies.get(x) ]).filter(x => x[1] !== undefined).map(x => x as [ string, number ]);
    const rows = parameters.biosamples?.map(x => [ x, config.ldr.biosamples.get(x) ]).filter(x => x[1] !== undefined).map(x => x as [ string, number ]);
    if (rows?.length === 0 || cols?.length === 0) return [];
    const rowFiltered = rows ? tf.gather(config.ldr.data, rows.map(x => x[1])) : config.ldr.data;
    const tensor = cols ? tf.gather(rowFiltered, cols.map(x => x[1]), 1) : rowFiltered;
    const d = await tensor.data() as Float32Array;
    let rr: number[] = [];
    const r: LDREntry[] = [];
    d.forEach( (x: number, i: number, _: Float32Array) => {
        if (i % 9 === 0 && rr.length > 0) {
            r.push({
                biosample: rows ? rows[Math.floor((i - 1) / (cols || config.ldr.studyOrder).length / 9)][0] : config.ldr.biosampleOrder[Math.floor((i - 1) / (cols || config.ldr.studyOrder).length / 9)],
                study: cols ? cols[Math.floor((i - 1) / 9) % cols.length][0] : config.ldr.studyOrder[Math.floor((i - 1) / 9) % config.ldr.studyOrder.length],
                enrichment: rr[3],
                enrichment_error: rr[4],
                enrichment_p: rr[5],
                conditional_enrichment: rr[6],
                conditional_error: rr[7],
                conditional_p: rr[8]
            });
            rr = [];
        }
        rr.push(x);
    });
    if (rr.length > 0)
        r.push({
            biosample: rows ? rows[rows.length - 1][0] : config.ldr.biosampleOrder[config.ldr.biosampleOrder.length - 1],
            study: cols ? cols[cols.length - 1][0] : config.ldr.studyOrder[config.ldr.studyOrder.length - 1],
            enrichment: rr[3],
            enrichment_error: rr[4],
            enrichment_p: rr[5],
            conditional_enrichment: rr[6],
            conditional_error: rr[7],
            conditional_p: rr[8]
        });
    return r;
}
