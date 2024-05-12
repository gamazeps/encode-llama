import { InsertUserCollectionArgs, UpdateUserCollectionArgs, UserCollection } from "./types";
import { DbColsBuilder } from "../utilities";
import { trimIndent } from "../../util/misc";
import { db } from "..";
import { userSchema } from "../connection";
import { IDatabase } from "pg-promise";
import { dropSchema } from "../schema";

const insertUserCollectionQuery = (cols: string[], props: string[]): string => trimIndent(`
    INSERT INTO $(schema~).user_collections(
        accession, 
        ${ cols.join(", ") }
    ) 
    VALUES (
        hashids.encode( number := nextval('$(schema~).accession_sequence'), min_length := 6, salt := 'wenglab'), 
        ${ props.join(", ") }
    ) 
    RETURNING accession
`);

export async function insertUserCollection(args: InsertUserCollectionArgs): Promise<string> {
    const cb = new DbColsBuilder();
    cb.addRequired("owner_uid");
    cb.addRequired("name");
    cb.addRequired("is_public");
    const cols = cb.build();
    const query = insertUserCollectionQuery(Object.keys(cols), Object.values(cols));
    const result = await db.one(query, { ...args, schema: userSchema });
    return result.accession;
}

const updateUserCollectionQuery = (cols: Record<string, string>): string => trimIndent(`
    UPDATE $(schema~).user_collections SET 
        ${ Object.keys(cols).map(col => `${col}=${cols[col]}` ).join(", \n") } 
    WHERE accession=$(accession)
    RETURNING *
`);

/**
 * Update a user collection.
 * optional db client object arg available to support transactions.
 */
export async function updateUserCollection(args: UpdateUserCollectionArgs, idb: IDatabase<any> = db): Promise<UserCollection> {
    const cb = new DbColsBuilder();
    cb.add("is_public", args.is_public);
    cb.add("name", args.name);
    cb.add("quant_data_schema", args.quant_data_schema);
    cb.add("quant_data_schema_in_progress", args.quant_data_schema_in_progress);
    cb.add("import_status", args.import_status);
    const cols = cb.build();
    const query = updateUserCollectionQuery(cols);
    await idb.one(query, { ...args, schema: userSchema });
    return await selectUserCollection(args.accession) as UserCollection;
}

export async function deleteUserCollection(accession: string): Promise<string> {
    await db.tx(async t => {
        const collection = await selectUserCollection(accession);
        const query = "DELETE FROM $(schema~).user_collections WHERE accession=$(accession)";
        await t.none(query, { accession, schema: userSchema });
        if (collection?.quant_data_schema) {
            await dropSchema(collection.quant_data_schema, t);
        }
    });
    return accession;
}

export async function selectUserCollectionOwner(userCollectionAccession: string): Promise<string | undefined> {
    const query = "SELECT owner_uid FROM $(schema~).user_collections WHERE accession=$(userCollectionAccession)";
    return (await db.oneOrNone(query, { userCollectionAccession, schema: userSchema }) || {}).owner_uid;
}

export async function selectUserCollection(accession: string): Promise<UserCollection | undefined> {
    const query = "SELECT * FROM $(schema~).user_collections WHERE accession=$(accession)";
    return (await db.oneOrNone(query, { accession, schema: userSchema })) || undefined;
}

export async function selectMyUserCollections(owner: string): Promise<UserCollection[]> {
    const query = "SELECT * FROM $(schema~).user_collections WHERE owner_uid=$(owner)";
    return db.manyOrNone(query, { owner, schema: userSchema });
}

export async function selectPublicUserCollections(limit?: number, offset?: number): Promise<UserCollection[]> {
    let query = "SELECT * FROM $(schema~).user_collections WHERE is_public=true";
    if (limit !== undefined) query += " LIMIT ${limit}";
    if (offset !== undefined) query += " OFFSET ${offset}";
    return db.manyOrNone(query, { limit, offset, schema: userSchema });
}

export async function selectIncompleteImportCollections(): Promise<UserCollection[]> {
    let query = "SELECT * FROM $(schema~).user_collections WHERE import_status IN ('QUEUED', 'IN_PROGRESS')";
    return db.manyOrNone(query, { schema: userSchema });
}
