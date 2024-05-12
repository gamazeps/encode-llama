import { IDatabase } from "pg-promise";

import { TranscriptQuantParameters, TranscriptQuant } from "./types";
import { quantSchema } from "../utilities";
import { DEFAULT_QUANT_SOURCE } from "../../constants";
import { conditionClauses, fieldMatchesAny, ParameterMap, whereClause } from "queryz";

const TRANSCRIPT_QUANT_PARAMETERS: ParameterMap<TranscriptQuantParameters> = new Map([
    [ "gene_id", fieldMatchesAny("gene_id") ],
    [ "gene_id_prefix", fieldMatchesAny("gene_id_prefix") ],
    [ "tpm_range", (tableName: string): string => (
        tableName + ".tpm >= ${" + tableName + ".tpm_range.low} "
        + "AND " + tableName + ".tpm <= ${" + tableName + ".tpm_range.high}"
    ) ],
    [ "fpkm_range", (tableName: string): string => (
        tableName + ".fpkm >= ${" + tableName + ".fpkm_range.low} "
        + "AND " + tableName + ".fpkm <= ${" + tableName + ".fpkm_range.high}"
    ) ],
    [ "experiment_accession", fieldMatchesAny("experiment_accession") ],
    [ "file_accession", fieldMatchesAny("file_accession") ],
    [ "transcript_id", fieldMatchesAny("transcript_id") ],
    [ "transcript_id_prefix", fieldMatchesAny("transcript_id_prefix") ]
]);

/**
 * Selects transcript quantification results for a given set of criteria.
 * @param parameters the search parameters for which to select results.
 * @param db connection to the database.
 * @param source the project from which to select results; defaults to ENCODE.
 */
export async function selectTranscriptQuantifications(parameters: TranscriptQuantParameters, db: IDatabase<any>): Promise<TranscriptQuant[]> {
    const source = parameters.source || DEFAULT_QUANT_SOURCE;
    const schema: string = await quantSchema(source);
    const tableName = `transcript_quantification_${parameters.assembly.toLowerCase()}`;
    return db.any(`
        SELECT * FROM \${schema~}.\${tableName~} AS t
         WHERE ${whereClause(conditionClauses(parameters, TRANSCRIPT_QUANT_PARAMETERS, "t"))}
         ORDER BY ${ parameters.sortByFpkm ? "fpkm" : "tpm" } DESC
         ${ parameters.limit ? `LIMIT ${parameters.limit}` : ""}
         ${ parameters.offset ? `OFFSET ${parameters.offset}` : ""}
    `, { schema, tableName, t: parameters });
}
