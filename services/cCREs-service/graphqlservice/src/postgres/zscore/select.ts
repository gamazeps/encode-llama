import * as tf from "@tensorflow/tfjs";
import { Config } from "../../init";
import { CCREMaxZEntry, ZScoreEntry, ZScoreHistogramParameters, ZScoreParameters } from "../types";

type ScoreTensor = {
    rows?: number[];
    cols?: number[];
    tensor: tf.Tensor;
};

export function select_z_score_tensor(parameters: ZScoreParameters, config: Config): ScoreTensor | undefined {
    if (!config.matrices[parameters.assembly]) return;
    const rows = parameters.rDHS?.map(x => config.rdhs_order[parameters.assembly][x]).filter(x => x !== undefined);
    const cols = parameters.experiment?.map(x => config.experiment_order[parameters.assembly][x]?.id).filter(x => x !== undefined);
    if (rows?.length === 0 || cols?.length === 0) return;
    const rowFiltered = rows ? tf.gather(config.matrices[parameters.assembly], rows) : config.matrices[parameters.assembly];
    const tensor = cols ? tf.gather(rowFiltered, cols, 1) : rowFiltered;
    return { rows, cols, tensor };
}

export async function select_z_scores(parameters: ZScoreParameters, config: Config): Promise<ZScoreEntry[]> {
    const ttensor = select_z_score_tensor(parameters, config);
    if (ttensor === undefined) return [];
    let { rows, cols, tensor } = ttensor;
    const colCount = cols?.length || config.matrices[parameters.assembly].shape[1]!;
    if (rows === undefined) rows = [ ...Array(tensor.shape[0]).keys() ];
    if (cols === undefined) cols = [ ...Array(tensor.shape[1]).keys() ];
    const d = (await tensor.data()) as Float32Array;
    const r: ZScoreEntry[] = [];
    d.forEach( (x: number, i: number, _: Float32Array) => {
        if (parameters.minimum_score !== undefined && x < parameters.minimum_score) return;
        if (parameters.maximum_score !== undefined && x > parameters.maximum_score) return;
        r.push({
            experiment_accession: config.experiment_list[parameters.assembly][cols![i % colCount]],
            rdhs: config.rdhs_list[parameters.assembly][rows![Math.floor(i / colCount)]],
            score: x
        });
    });
    return r;
}

export async function select_max_z_scores(parameters: ZScoreParameters, config: Config): Promise<CCREMaxZEntry[]> {
    const ttensor = select_z_score_tensor(parameters, config);
    if (ttensor === undefined) return [];
    let { rows, tensor } = ttensor;
    if (rows === undefined) rows = [ ...Array(tensor.shape[0]).keys() ];
    const result = (await ttensor.tensor.max(1).data()) as Float32Array;
    const r: CCREMaxZEntry[] = [];
    result.forEach((x: number, i: number, _: Float32Array) => {
        r.push({
            accession: config.rdhs_list[parameters.assembly.toLocaleLowerCase()][rows![i]],
            score: x
        });
    });
    return r;
}

export async function biosample_zscore_histogram(parameters: ZScoreHistogramParameters & ZScoreParameters, config: Config): Promise<[ number, tf.Tensor1D ]> {
    const tensor = select_z_score_tensor(parameters as ZScoreParameters, config);
    const values = tensor?.tensor.flatten();
    const binWidth = (parameters.histogram_maximum - parameters.histogram_minimum) / parameters.histogram_bins;
    if (values === undefined) return [ binWidth, tf.tensor1d(new Array(parameters.histogram_bins).map(() => 0), 'int32') ];
    const s = tf.sub(values, parameters.histogram_minimum).floorDiv(binWidth).relu();
    return [ binWidth, tf.bincount(tf.cast(s, 'int32') as tf.Tensor1D, [], tf.max(s).dataSync()[0]) ];
}

export async function select_active_in_biosamples(parameters: ZScoreParameters, config: Config, any?: boolean, min?: number): Promise<CCREMaxZEntry[]> {
    const ttensor = select_z_score_tensor(parameters, config);
    if (ttensor === undefined) return [];
    let { rows, tensor } = ttensor;
    if (rows === undefined) rows = [ ...Array(tensor.shape[0]).keys() ];
    const aggregated = (any ? ttensor.tensor.max(1) : ttensor.tensor.mean(1));
    const i = await tf.whereAsync(aggregated.greater(min || 1.64));
    const result = (await aggregated.data()) as Float32Array;
    const r: CCREMaxZEntry[] = [];
    (await i.data()).forEach((x: number) => {
        r.push({
            accession: config.rdhs_list[parameters.assembly.toLocaleLowerCase()][rows![x]],
            score: result[x]
        });
    });
    return r;
}
