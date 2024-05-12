import { IDatabase } from "pg-promise";
import { conditionClauses, fieldMatches, fieldMatchesAny, ParameterMap, whereClause } from 'queryz';

import { CCREEntry, CCREParameters, LinkedGene, LinkedGenesParameters } from "../types";
import { coordinateParameters, sanitizableChromosomeMap } from "../utilities";

const PARAMETER_MAP: ParameterMap<CCREParameters> = new Map([
    [ "accession", fieldMatchesAny("accession") ],
    [ "accession_prefix", (tableName: string) => `${tableName}.accession ILIKE ANY(\${${tableName}.accession_prefix})` ],
    [ "rDHS", (tableName: string) => `${tableName}.rdhs = ANY(\${${tableName}.rDHS})` ],
    [ "group", (tableName: string) => `${tableName}.ccre_group = ANY(\${${tableName}.group})` ],
    [ "ctcf_bound", fieldMatches("ctcf_bound") ],
    [ "coordinates", coordinateParameters ]
]);

const LINKEDGENE_PARAMETERS: ParameterMap<LinkedGenesParameters> = new Map([
    [ "accession", fieldMatchesAny("accession") ]
]);
export async function select_cCREs(parameters: CCREParameters, db: IDatabase<any>): Promise<CCREEntry[]> {
    parameters.accession_prefix = parameters.accession_prefix?.map(x => x + "%");
    return db.any(`
        SELECT accession, rdhs, ccre_group, ctcf_bound, chromosome, start, stop FROM \${tableName~} AS t
         WHERE ${whereClause(conditionClauses(parameters, PARAMETER_MAP, "t"))}
         ORDER BY accession ASC
         ${parameters.limit ? `LIMIT ${parameters.limit}` : ""}
    `, { tableName: `${parameters.assembly.toLocaleLowerCase()}_ccres`, t: {
        ...parameters,
        coordinate_chromosomes: sanitizableChromosomeMap(parameters.coordinates || [])
    } });
}


export async function select_linkedGenes(parameters: LinkedGenesParameters, db: IDatabase<any>): Promise<LinkedGene[]> { 
    
    return db.any(`
        SELECT accession,gene,assembly,celltype,assay,experiment_accession FROM \${tableName~} AS t
         WHERE ${whereClause(conditionClauses(parameters, LINKEDGENE_PARAMETERS, "t"))}
         ORDER BY accession ASC
    `, { tableName: `linked_genes`, t: {
        ...parameters    
    } });
}