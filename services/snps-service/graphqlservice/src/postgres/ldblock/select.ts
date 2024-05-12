import { IDatabase } from "pg-promise";
import { LDParameters, LDResult } from "../types";

/**
 * Selects LD records from the database.
 * @param parameters parameters used to filter the results.
 * @param db connection to the database.
 */
export async function selectLD(parameters: LDParameters, db: IDatabase<any>): Promise<LDResult[]> {    
    const tableName = parameters.subpopulation ? `ld_${parameters.population}_${parameters.subpopulation}` :  `ld_${parameters.population}`;
    return db.any("SELECT snp1, ldlinks FROM ${tableName~} WHERE snp1 = ANY(${snpids})", { ...parameters, tableName });
}
