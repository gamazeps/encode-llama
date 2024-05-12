import { IDatabase } from "pg-promise";
import { BiosampleRow, BiosampleCountRow } from "../types";
import { DatasetSelectionParameters, DATASET_PARAMETERS } from "../dataset";
import { conditionClauses, whereClause } from "queryz";

/**
 * Creates a promise for selecting all biosamples from the database.
 * @param db connection to the database.
 */
export async function selectAllBiosamples(db: IDatabase<any>, assay: string): Promise<BiosampleRow[]> {
    return db.any(`SELECT DISTINCT biosample AS name, species FROM ${assay}_datasets`);
}

/**
 * Creates a promise for selecting biosamples from the database for a given species.
 * @param db connection to the database.
 */
export async function selectBiosamplesFromDatasets(parameters: DatasetSelectionParameters, db: IDatabase<any>): Promise<BiosampleCountRow[]> {
    return db.any(`
        SELECT COUNT(DISTINCT accession)::INT AS expcount, biosample AS name, species
          FROM ${parameters.assay?.replace("-", "_")}_datasets AS datasets
         WHERE ${whereClause(conditionClauses(parameters, DATASET_PARAMETERS, "datasets"))}
         GROUP BY biosample, species
         ORDER BY expcount DESC
         ${ parameters.limit ? `LIMIT ${parameters.limit}` : "" }
    `, { datasets: parameters });
}
