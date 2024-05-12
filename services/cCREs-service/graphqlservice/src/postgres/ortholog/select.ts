import { IDatabase } from "pg-promise";
import { OrthologEntry, OrthologParameters } from "../types";

export async function selectOrtholog(parameters: OrthologParameters, db: IDatabase<any>): Promise<OrthologEntry[]> {
    return db.any(
        `
        SELECT grch38, mm10 FROM \${tableName~} AS t
            WHERE ${parameters.assembly} = '${parameters.accession}'
    `,
        { tableName: "grch38_mm10_ortholog" }
    );
}
