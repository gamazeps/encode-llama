import { IDatabase } from "pg-promise";

import { GeneQuantParameters, GeneQuant } from "./types";
import { quantSchema } from "../utilities";
import { DEFAULT_QUANT_SOURCE } from "../../constants";
import { fieldMatchesAny, ParameterMap, whereClause, conditionClauses } from "queryz";

const GENE_QUANT_PARAMETERS: ParameterMap<GeneQuantParameters> = new Map([
    [ "gene_id", fieldMatchesAny("gene_id") ],
    [ "gene_id_prefix", fieldMatchesAny("gene_id_prefix") ],
    [ "tpm_range", (tableName: string): string => (`
        ${tableName}.tpm >= \${${tableName}.tpm_range.low} AND ${tableName}.tpm <= \${${tableName}.tpm_range.high}
    `) ],
    [ "fpkm_range", (tableName: string): string => (`
        ${tableName}.fpkm >= \${${tableName}.fpkm_range.low} AND ${tableName}.fpkm <= \${${tableName}.fpkm_range.high}
    `) ],
    [ "experiment_accession", fieldMatchesAny("experiment_accession") ],
    [ "file_accession", fieldMatchesAny("file_accession") ]
]);

/**
 * Selects gene quantification results for a given set of criteria.
 * @param parameters the search parameters for which to select results.
 * @param db connection to the database.
 * @param source the project from which to select results; defaults to ENCODE.
 */
export async function selectGeneQuantifications(parameters: GeneQuantParameters, db: IDatabase<any>): Promise<GeneQuant[]> {
    const source = parameters.source || DEFAULT_QUANT_SOURCE;
    const schema: string = await quantSchema(source);
    const tableName = `gene_quantification_${parameters.assembly.toLowerCase()}`;
    return db.any(`
        SELECT experiment_accession, file_accession, gene_id, transcript_ids, len, effective_len, expected_count, tpm, fpkm, posterior_mean_count,
               posterior_standard_deviation_of_count, pme_tpm, pme_fpkm, tpm_ci_lower_bound, tpm_ci_upper_bound, fpkm_ci_lower_bound, fpkm_ci_upper_bound,
               tpm_coefficient_of_quartile_variation, fpkm_coefficient_of_quartile_variation
          FROM \${schema~}.\${tableName~} AS g
         WHERE ${whereClause(conditionClauses(parameters, GENE_QUANT_PARAMETERS, "g"))}
         ORDER BY ${ parameters.sortByFpkm ? "fpkm" : "tpm" } DESC
         ${ parameters.limit ? `LIMIT ${parameters.limit}` : ""}
         ${ parameters.offset ? `OFFSET ${parameters.offset}` : ""}
    `, { schema, tableName, g: parameters });
}
