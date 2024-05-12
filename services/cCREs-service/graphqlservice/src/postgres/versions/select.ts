import { IDatabase } from "pg-promise";
import { VersionEntry } from "../types";

/**
 * This file and function queries and returns the raw data for the versions tab
 * @param db
 * @returns {VersionEntry[]} list of version entries
 */
export async function selectVersions(db: IDatabase<any>): Promise<VersionEntry[]> {
    return await db.any(`SELECT * FROM \${tableName~} AS t`, { tableName: "grch38_ground_level_versions" });
}
