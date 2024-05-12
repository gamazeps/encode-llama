import { QuantificationFileParameters, QuantificationFile, SignalFileParameters, SignalFile } from "./types";
import { quantMetadataSchema } from '../utilities';
import { QuantificationDataSourceType } from "../types";
import { DEFAULT_QUANT_SOURCE } from "../../constants";
import { db } from "..";
import { whereClause, conditionClauses, fieldMatchesAny, ParameterMap } from "queryz";

const FILE_PARAMETERS: ParameterMap<QuantificationFileParameters> = new Map([
    [ "dataset_accession", fieldMatchesAny("dataset_accession") ],
    [ "accession", fieldMatchesAny("accession") ],
    [ "assembly", (tableName: string) => `lower(${tableName}.assembly) = lower(\${${tableName}.assembly})` ]
]);

const fileTables: Map<QuantificationDataSourceType, string> = new Map([
    [ QuantificationDataSourceType.ENCODE, "encode" ],
    [ QuantificationDataSourceType.PSYCH_ENCODE, "psychencode" ]
]);

/**
 * Selects all gene quantification files matching given search criteria.
 * @param parameters the search parameters by which to filter the quantification files.
 * @param db connection to the database.
 */
export async function selectGeneQuantFiles(parameters: QuantificationFileParameters): Promise<QuantificationFile[]> {
    return selectQuantFiles(parameters, "gene");
}

/**
 * Selects all transcript quantification files matching given search criteria.
 * @param parameters the search parameters by which to filter the quantification files.
 * @param db connection to the database.
 */
export async function selectTranscriptQuantFiles(parameters: QuantificationFileParameters): Promise<QuantificationFile[]> {
    return selectQuantFiles(parameters, "transcript");
}

/**
 * Selects all quantification files matching given search criteria.
 * @param parameters the search parameters by which to filter the quantification files.
 * @param db connection to the database.
 * @param type gene for gene quantifications or transcript for transcript quantifications
 */
async function selectQuantFiles(parameters: QuantificationFileParameters, type: string): Promise<QuantificationFile[]> {
    const schema = quantMetadataSchema(parameters.source);
    const source = parameters.source || DEFAULT_QUANT_SOURCE;
    const tableName = `${fileTables.get(source.type) || "user"}_${type}_quantification_files`;
    return (await db.any(`
        SELECT * FROM \${schema~}.\${tableName~} AS s
         WHERE ${whereClause(conditionClauses(parameters, FILE_PARAMETERS, "s"))}
         ORDER BY accession
    `, { schema, tableName, s: parameters })).map(f => ({ ...f, source }));
}

/**
 * Selects all signal files matching given search criteria.
 * @param parameters the search parameters by which to filter the signal files.
 * @param db connection to the database.
 */
export async function selectSignalFiles(parameters: SignalFileParameters): Promise<SignalFile[]> {
    const schema = quantMetadataSchema(parameters.source);
    const source = parameters.source || DEFAULT_QUANT_SOURCE;
    const tableName = `${fileTables.get(source.type) || "user"}_signal_files`;
    return (await db.any(`
        SELECT * FROM \${schema~}.\${tableName~} AS s
         WHERE ${whereClause(conditionClauses(parameters, FILE_PARAMETERS, "s"))}
         ORDER BY accession
    `, { schema, tableName, s: parameters })).map(f => ({ ...f, source }));
}
