import { db } from ".";
import { IDatabase } from "pg-promise";


/**
 * Simple helper function to drop the given schema.
 * Optional db client object available to support transactions.
 */
export async function dropSchema(schema: string, idb: IDatabase<any> = db): Promise<void> {
    const query = "DROP SCHEMA IF EXISTS $(schema~) CASCADE";
    await idb.none(query, { schema });
}