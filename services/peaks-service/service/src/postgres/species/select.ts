import { IDatabase } from "pg-promise";
import { SpeciesRow, SpeciesCountRow } from "../types";
import { DatasetSelectionParameters, DATASET_PARAMETERS } from "../dataset";
import { conditionClauses, whereClause } from "queryz";

/**
 * Creates a promise for selecting all species from the database for a given project.
 * @param project the project for which to select species, for example ENCODE.
 * @param db connection to the database.
 */
export async function selectSpeciesFromDatasets(parameters: DatasetSelectionParameters, db: IDatabase<any>): Promise<SpeciesRow[]> {
    return db.any(`
        SELECT COUNT(DISTINCT accession)::INT AS expcount, species AS name
          FROM ${parameters.assay?.replace("-", "_")}_datasets AS datasets
         WHERE ${whereClause(conditionClauses(parameters, DATASET_PARAMETERS, "datasets"))}
         GROUP BY species
    `, { datasets: parameters });
}

/**
 * Creates a promise for selecting all species from the database.
 * @param db connection to the database.
 */
export async function selectAllSpecies(db: IDatabase<any>, assay: string): Promise<SpeciesCountRow[]> {
    return db.any(`SELECT DISTINCT species AS name FROM ${assay}_datasets`);
}
