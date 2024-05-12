import { Config } from "../../init";
import { IDatabase } from "pg-promise";
import { conditionClauses, fieldMatchesAny, ParameterMap, whereClause, associateBy } from 'queryz';

import { CCREMaxZEntry, CCREMaxZParameters, RDHSEntry, RDHSParemeters } from "../types";
import { coordinateParameters, sanitizableChromosomeMap } from "../utilities";
import { select_active_in_biosamples, select_max_z_scores } from "../zscore/select";

const PARAMETER_MAP: ParameterMap<RDHSParemeters> = new Map([
    [ "accession", fieldMatchesAny("accession") ],
    [ "accession_prefix", (tableName: string) => `${tableName}.accession ILIKE ANY(\${${tableName}.accession_prefix})` ],
    [ "coordinates", coordinateParameters ]
])

export function select_rDHSs(parameters: RDHSParemeters, db: IDatabase<any>): Promise<RDHSEntry[]> {
    parameters.accession_prefix = parameters.accession_prefix?.map(x => x + "%");
    return db.any(`
        SELECT accession, chromosome, start, stop FROM \${tableName~} AS t
         WHERE ${whereClause(conditionClauses(parameters, PARAMETER_MAP, "t"))}
         ORDER BY accession ASC
         ${parameters.limit ? `LIMIT ${parameters.limit}` : ""}
    `, { tableName: `${parameters.assembly.toLocaleLowerCase()}_rdhss`, t: {
        ...parameters,
        coordinate_chromosomes: sanitizableChromosomeMap(parameters.coordinates || [])
    } });
}

export async function select_rDHS_maxZ(parameters: CCREMaxZParameters, config: Config): Promise<CCREMaxZEntry[]> {
    parameters.assembly = parameters.assembly.toLocaleLowerCase();
    parameters.assay = parameters.assay.toLocaleLowerCase();
    return select_max_z_scores({
        experiment: config.biosamples[parameters.assembly][parameters.assay] || [],
        rDHS: parameters.accession,
        assembly: parameters.assembly
    }, config);
}

export async function select_rDHSs_at_threshold(parameters: CCREMaxZParameters, config: Config, min: number, max: number, eacc?: string): Promise<Map<string, number>> {
    if (eacc)
        return associateBy(
            await select_active_in_biosamples({ assembly: parameters.assembly.toLocaleLowerCase(), experiment: eacc ? [eacc] : undefined, rDHS: parameters.accession }, config, false, min),
            x => x.accession,
            x => x.score
        );
    return associateBy((await select_rDHS_maxZ(parameters, config)).filter(x => x.score > min && x.score < max), x => x.accession, x => x.score);
}
