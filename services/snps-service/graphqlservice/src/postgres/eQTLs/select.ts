import { IDatabase } from 'pg-promise';
import { QTLParameters, QTLResult, GTExQTLParameters, GTExQTLResult } from '../types';
import { assembly_table_prefix, coordinateParameters } from '../utilities';
import { ParameterMap, fieldMatches, whereClause, conditionClauses, fieldMatchesAny, fieldIsGreaterThanOrEqualTo, fieldIsLessThanOrEqualTo } from 'queryz';

const SELECTE = `
SELECT gene_id, strand, n_tested_snps, distance_to_tss, snp_id AS snp, chromosome,
       start, stop, pval, regression_slope, is_top_snp, fdr
`;

const SELECTC = `
SELECT peak_id, strand, n_tested_snps, distance, snp_id AS snp, chromosome,
       start, stop, pval, regression_slope, is_top_snp, fdr
`;

const QTL_PARAMETERS: ParameterMap<QTLParameters> = new Map([
    [ "strand", fieldMatches("strand") ],
    [ "gene_id", (tableName: string) => `${tableName}.gene_id LIKE '\${${tableName}.geneId#}%'`],
    [ "coordinates", coordinateParameters("start", "stop") ],
    [ "snpId", (tableName: string) => `${tableName}.snp_id = \${${tableName}.snpId}`]
]);

const GTEX_QTL_PARAMETERS: ParameterMap<GTExQTLParameters> = new Map([
    [ "coordinates", (tableName: string, parameters: GTExQTLParameters) => (
            parameters.coordinates!.map(coordinates => `(
                ${tableName}.chromosome = '${coordinates.chromosome}' AND
                ${tableName}.position >= ${coordinates.start} AND
                ${tableName}.position <= ${coordinates.end}
            )`
        ).join(" OR ")
    )],
    [ "gene_id", fieldMatchesAny("gene_id") ],
    [ "ma_samples", fieldIsGreaterThanOrEqualTo("ma_samples") ],
    [ "ma_count", fieldIsGreaterThanOrEqualTo("ma_count") ],
    [ "maf_min", (tableName: string) => `${tableName}.maf >= \${${tableName}.maf_min}` ],
    [ "maf_max", (tableName: string) => `${tableName}.maf <= \${${tableName}.maf_max}` ],
    [ "pval_beta", fieldIsLessThanOrEqualTo("pval_beta") ],
    [ "tissue", fieldMatchesAny("tissue") ]
]);

/**
 * Selects eQTL records from the database.
 * @param assembly genomic assembly for which to select eQTLs.
 * @param parameters parameters used to filter search results.
 * @param db connection to the database.
 */
export async function select_eQTLs(assembly: string, parameters: QTLParameters,
				                   db: IDatabase<any>): Promise<QTLResult[]> {
    const tableName = `${assembly_table_prefix(assembly)}_psychencode_eqtls`;
    return db.any(`
        ${SELECTE} FROM \${tableName~} AS eQTL_table
         WHERE ${whereClause(conditionClauses(parameters, QTL_PARAMETERS, "eQTL_table"))}
        ORDER BY fdr ASC
    `, { eQTL_table: parameters, tableName });
};

/*
* Selects GTEx eQTL records from the database.
* @param assembly genomic assembly for which to select eQTLs.
* @param parameters parameters used to filter search results.
* @param db connection to the database.
*/
export async function select_GTEx_eQTLs(parameters: GTExQTLParameters, db: IDatabase<any>): Promise<GTExQTLResult[]> {
   const tableName = `${assembly_table_prefix(parameters.assembly)}_gtex_eqtls`;
   return db.any(`
       SELECT * FROM \${tableName~} AS eQTL_table
        WHERE ${whereClause(conditionClauses(parameters, GTEX_QTL_PARAMETERS, "eQTL_table"))}
       ORDER BY pval_beta ASC
   `, { eQTL_table: parameters, tableName });
};

/**
 * Selects eQTL records from the database.
 * @param assembly genomic assembly for which to select eQTLs.
 * @param parameters parameters used to filter search results.
 * @param db connection to the database.
 */
export async function select_cQTLs(assembly: string, parameters: QTLParameters,
				                   db: IDatabase<any>): Promise<QTLResult[]> {
    const tableName = `${assembly_table_prefix(assembly)}_psychencode_cqtls`;
    return db.any(`
        ${SELECTC} FROM \${tableName~} AS cQTL_table
         WHERE ${whereClause(conditionClauses(parameters, QTL_PARAMETERS, "cQTL_table"))}
        ORDER BY fdr ASC
    `, { cQTL_table: parameters, tableName });
};
