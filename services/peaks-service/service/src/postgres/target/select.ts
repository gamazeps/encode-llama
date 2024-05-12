import { IDatabase } from "pg-promise";
import { TargetRow, TargetCountRow } from "../types";
import { DatasetSelectionParameters, DATASET_PARAMETERS } from "../dataset";
import { conditionClauses, whereClause } from "queryz";

/**
 * Creates a promise for selecting all targets from the database.
 * @param db connection to the database.
 */
export async function selectAllTargets(db: IDatabase<any>, assay: string): Promise<TargetRow[]> {
    return db.any(`SELECT DISTINCT target AS name FROM ${assay.replace("-", "_")}_datasets WHERE target IS NOT NULL`);
}

/**
 * Creates a promise for selecting targets from the database for a subset of datasets.
 * @param parameters filter criteria for selecting datasets.
 * @param db connection to the database.
 */
export async function selectTargetsFromDatasets(parameters: DatasetSelectionParameters, db: IDatabase<any>): Promise<TargetCountRow[]> {
    return db.any(`
        SELECT COUNT(DISTINCT accession)::INT AS expcount, target AS name
          FROM ${parameters.assay?.replace("-", "_")}_datasets AS datasets
         WHERE target IS NOT NULL AND ${whereClause(conditionClauses(parameters, DATASET_PARAMETERS, "datasets"))}
         GROUP BY name
         ORDER BY expcount DESC
         ${ parameters.limit ? `LIMIT ${parameters.limit}` : "" }
    `, { datasets: parameters });
}
