import { db, QuantificationFile } from "..";
import { DbColsBuilder } from "../utilities";
import { trimIndent } from "../../util/misc";
import { 
    InsertUserGeneQuantFileArgs, UpdateUserGeneQuantFileArgs, 
    InsertUserTranscriptQuantFileArgs, UpdateUserTranscriptQuantFileArgs
} from "./types";
import { userSchema } from "../connection";

const insertUserFileQuery = (cols: string[], props: string[]): string => trimIndent(`
    INSERT INTO $(schema~).$(table~)(
        accession, 
        ${ cols.join(", ") }
    ) 
    VALUES (
        hashids.encode( number := nextval('$(schema~).accession_sequence'), min_length := 6, salt := 'wenglab'), 
        ${ props.join(", ") }
    ) 
    RETURNING accession
`);

export async function insertUserGeneQuantFile(args: InsertUserGeneQuantFileArgs) {
    const cb = new DbColsBuilder();
    cb.addRequired("dataset_accession");
    cb.addRequired("assembly");
    cb.add("biorep", args.biorep);
    cb.add("techrep", args.techrep);
    const cols = cb.build();
    const query = insertUserFileQuery(Object.keys(cols), Object.values(cols));
    const values = { ...args, schema: userSchema, table: "user_gene_quantification_files" };
    const result = await db.one(query, values);
    return result.accession;
}

export async function insertUserTranscriptQuantFile(args: InsertUserTranscriptQuantFileArgs) {
    const cb = new DbColsBuilder();
    cb.addRequired("dataset_accession");
    cb.addRequired("assembly");
    cb.add("biorep", args.biorep);
    cb.add("techrep", args.techrep);
    const cols = cb.build();
    const query = insertUserFileQuery(Object.keys(cols), Object.values(cols));
    const values = { ...args, schema: userSchema, table: "user_transcript_quantification_files" };
    const result = await db.one(query, values);
    return result.accession;
}

const updateUserFileQuery = (cols: Record<string, string>): string => trimIndent(`
    UPDATE $(schema~).$(table~) SET 
        ${ Object.keys(cols).map(col => `${col}=${cols[col]}` ).join(", \n") } 
    WHERE accession=$(accession)
    RETURNING *
`);

export async function updateUserGeneQuantFile(args: UpdateUserGeneQuantFileArgs): Promise<QuantificationFile> {
    const cb = new DbColsBuilder();
    cb.addRequired("accession");
    cb.add("assembly", args.assembly);
    cb.add("biorep", args.biorep);
    cb.add("techrep", args.techrep);
    const cols = cb.build();
    const query = updateUserFileQuery(cols);
    const values = { ...args, schema: userSchema, table: "user_gene_quantification_files" };
    const updated = await db.one(query, values);
    return updated;
}

export async function updateUserTranscriptQuantFile(args: UpdateUserTranscriptQuantFileArgs): Promise<QuantificationFile> {
    const cb = new DbColsBuilder();
    cb.addRequired("accession");
    cb.add("assembly", args.assembly);
    cb.add("biorep", args.biorep);
    cb.add("techrep", args.techrep);
    const cols = cb.build();
    const query = updateUserFileQuery(cols);
    const values = { ...args, schema: userSchema, table: "user_transcript_quantification_files" };
    const updated = await db.one(query, values);
    return updated;
}

const userFileOwnerQuery = trimIndent(`
    SELECT d.user_collection_accession, d.accession as dataset_accession, c.owner_uid, c.is_public
    FROM $(schema~).$(table~) as f 
    INNER JOIN $(schema~).user_datasets as d ON (d.accession = f.dataset_accession)
    INNER JOIN $(schema~).user_collections as c ON (d.user_collection_accession = c.accession)
    WHERE f.accession = $(accession)
`);

export interface UserFileOwnerInfo {
    user_collection_accession: string;
    dataset_accession: string;
    assembly: string;
    owner_uid: string;
    is_public: boolean;
}

async function selectUserFileOwner(accession: string, table: string): Promise<UserFileOwnerInfo|undefined> {
    const values = { schema: userSchema, accession, table };
    const response = await db.oneOrNone(userFileOwnerQuery, values);
    return response || undefined;
}

export async function selectUserGeneQuantFileOwner(accession: string): Promise<UserFileOwnerInfo|undefined> {
    return selectUserFileOwner(accession, "user_gene_quantification_files");
}

export async function selectUserTranscriptQuantFileOwner(accession: string): Promise<UserFileOwnerInfo|undefined> {
    return selectUserFileOwner(accession, "user_transcript_quantification_files");
}

export async function deleteUserGeneQuantFile(accession: string): Promise<string> {
    const query = "DELETE FROM $(schema~).user_gene_quantification_files WHERE accession=$(accession)";
    await db.none(query, { schema: userSchema, accession });
    return accession;
}

export async function deleteUserTranscriptQuantFile(accession: string): Promise<string> {
    const query = "DELETE FROM $(schema~).user_transcript_quantification_files WHERE accession=$(accession)";
    await db.none(query, { schema: userSchema, accession });
    return accession;
}

const collectionFilesQuery = trimIndent(`
    SELECT f.*
    FROM $(schema~).$(table~) as f 
    INNER JOIN $(schema~).user_datasets as d ON (d.accession = f.dataset_accession)
    INNER JOIN $(schema~).user_collections as c ON (d.user_collection_accession = c.accession)
    WHERE c.accession = $(accession)
`);

async function selectCollectionFiles(accession: string, table: string): Promise<QuantificationFile[]> {
    return db.many(collectionFilesQuery, { schema: userSchema, accession, table });
}

export async function selectCollectionGeneQuantFiles(accession: string): Promise<QuantificationFile[]> {
    return selectCollectionFiles(accession, "user_gene_quantification_files");
}

export async function selectCollectionTranscriptQuantFiles(accession: string): Promise<QuantificationFile[]> {
    return selectCollectionFiles(accession, "user_transcript_quantification_files");
}
