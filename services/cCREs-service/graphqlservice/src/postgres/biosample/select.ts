import * as tf from "@tensorflow/tfjs-core";
import { IDatabase } from "pg-promise";
import { associateBy, conditionClauses, ParameterMap, whereClause } from 'queryz';

import { Config } from "../../init";
import { select_rDHSs } from "../rdhs";
import { BiosampleParemeters, BiosampleEntry, RDHSEntry } from "../types";
import { sanitizableAssayMap } from "../utilities";

type ScoredElement = {
    element: RDHSEntry;
    specificity: number;
};

const PARAMETER_MAP: ParameterMap<BiosampleParemeters> = new Map([
    [ "name", (tableName: string) => `${tableName}.biosample_name = ANY(\${${tableName}.name})`],
    [ "assay", (tableName: string, parameters: BiosampleParemeters) => (
        parameters.assay!.length === 0 ? "FALSE" : parameters.assay!.map(x => `${tableName}.\${${tableName}.assays.${x}~} IS NOT NULL`).join(" OR ")
    )],
    [ "accession", (tableName: string, parameters: BiosampleParemeters) => [ ...parameters.assays! ].map(
        x => `${tableName}.${x}_experiment = ANY(\${${tableName}.accession})`
    ).join(" OR ") ]
]);

export async function selectBiosamples(parameters: BiosampleParemeters, db: IDatabase<any>): Promise<BiosampleEntry[]> {
    const c = await db.one("SELECT * FROM \${tableName~} AS t LIMIT 1", { tableName: `${parameters.assembly}_biosamples` });
    const columns = new Set(Object.keys(c).filter(x => x.endsWith("_experiment")).map(x => x.split("_")[0]));
    parameters = {
        ...parameters,
        assay: parameters.assay?.map(x => x.toLocaleLowerCase()).filter(x => columns.has(x)),
        assays: columns
    };
    return db.any(`
        SELECT * FROM \${tableName~} AS t
         WHERE ${whereClause(conditionClauses(parameters, PARAMETER_MAP, "t"))}
         ORDER BY biosample_name ASC
    `, { tableName: `${parameters.assembly.toLocaleLowerCase()}_biosamples`, t: { ...parameters, assays: sanitizableAssayMap(parameters.assay || []) } });
}

export function biosampleVector(biosamples: BiosampleEntry[], config: Config, assay: string, assembly: string): tf.Tensor {
    const experiments = biosamples.map(x => x[`${assay}_experiment`]!);
    const indexes = experiments.map(x => config.experiment_order[assembly][x].id);
    return tf.gather(config.pca_experiment_matrices[assembly][assay], indexes).mean(0);
}

export async function specificElements(biosamples: BiosampleEntry[], config: Config, assay: string, assembly: string, db: IDatabase<any>): Promise<ScoredElement[]> {
    const v = biosampleVector(biosamples, config, assay, assembly);
    const ev = tf.dot(config.pca_element_matrices[assembly][assay], v);
    const indexes = await tf.whereAsync(ev.greater(0.2));
    const di = await indexes.data();
    const rDHSs: string[] = [];
    const dindexes: number[] = [];
    di.forEach((i: number) => { rDHSs.push(config.rdhs_list[assembly][i]); dindexes.push(i); });
    const scoreMap = associateBy(dindexes, x => config.rdhs_list[assembly][x], x => di[x]);
    return (await select_rDHSs({ accession: rDHSs, assembly: assembly }, db)).map(x => ({
        element: x,
        specificity: scoreMap.get(x.accession)!
    }));
}
