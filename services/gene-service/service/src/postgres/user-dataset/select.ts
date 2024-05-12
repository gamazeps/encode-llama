import { DbColsBuilder } from "../utilities";
import { InsertUserDatasetArgs, UpdateUserDatasetArgs } from "./types";
import { db, Dataset } from "..";
import { QuantificationDataSourceType } from "../types";
import { userSchema } from "../connection";
import { trimIndent } from "../../util/misc";

const insertUserDatasetQuery = (cols: string[], props: string[]): string => trimIndent(`
    INSERT INTO $(schema~).user_datasets(
        accession, 
        ${ cols.join(", ") }
    ) 
    VALUES (
        hashids.encode( number := nextval('$(schema~).accession_sequence'), min_length := 6, salt := 'wenglab'), 
        ${ props.join(", ") }
    ) 
    RETURNING accession
`);

export async function insertUserDataset(args: InsertUserDatasetArgs): Promise<string> {
    const cb = new DbColsBuilder();
    cb.addRequired("user_collection_accession");
    cb.addRequired("biosample");
    cb.add("biosample_type", args.biosample_type);
    cb.add("tissue", args.tissue);
    cb.add("cell_compartment", args.cell_compartment);
    cb.add("lab_name", args.lab_name);
    cb.add("lab_friendly_name", args.lab_friendly_name);
    cb.add("assay_term_name", args.assay_term_name);
    cb.add("metadata", args.metadata);
    const cols = cb.build();
    const query = insertUserDatasetQuery(Object.keys(cols), Object.values(cols));
    const result = await db.one(query, { ...args, schema: userSchema });
    return result.accession;
}

const updateUserDatasetQuery = (cols: Record<string, string>): string => trimIndent(`
    UPDATE $(schema~).user_datasets SET 
        ${ Object.keys(cols).map(col => `${col}=${cols[col]}` ).join(", \n") } 
    WHERE accession=$(accession)
    RETURNING *
`);

export async function updateUserDataset(args: UpdateUserDatasetArgs): Promise<Dataset> {
    const cb = new DbColsBuilder();
    cb.add("biosample", args.biosample);
    cb.add("biosample_type", args.biosample_type);
    cb.add("tissue", args.tissue);
    cb.add("cell_compartment", args.cell_compartment);
    cb.add("lab_name", args.lab_name);
    cb.add("lab_friendly_name", args.lab_friendly_name);
    cb.add("assay_term_name", args.assay_term_name);
    cb.add("metadata", args.metadata);
    const cols = cb.build();
    const query = updateUserDatasetQuery(cols);
    const updated = await db.one(query, { ...args, schema: userSchema });
    updated.source = { 
        type: QuantificationDataSourceType.USER, 
        user_collection: updated.user_collection_accession
    };
    delete updated.user_collection_accession;
    return updated;
}

const userDatasetOwnerQuery = trimIndent(`
    SELECT d.user_collection_accession, c.owner_uid
    FROM $(schema~).user_datasets as d JOIN $(schema~).user_collections as c
        ON (d.user_collection_accession = c.accession)
    WHERE d.accession = $(accession)
`);

export interface DatasetOwnerInfo {
    user_collection_accession: string;
    owner_uid: string;
    is_public: boolean;
}

export async function selectUserDatasetOwner(datasetAccession: string): Promise<DatasetOwnerInfo|undefined> {
    const response = await db.oneOrNone(userDatasetOwnerQuery, 
        { schema: userSchema, accession: datasetAccession });
    return response || undefined;
}

export async function deleteUserDataset(accession: string): Promise<string> {
    const query = "DELETE FROM $(schema~).user_datasets WHERE accession=$(accession)";
    await db.none(query, { schema: userSchema, accession });
    return accession;
}
