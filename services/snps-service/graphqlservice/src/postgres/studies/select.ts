import { IDatabase } from "pg-promise";
import { StudyParameters, StudyCellTypeEnrichmentParameters, StudySNPAssociationParameters,
         StudyResult, StudySNPAssociationResult, StudyCellTypeEnrichmentResult } from '../types';
import { ParameterMap, conditionClauses, whereClause } from "queryz";
import { assembly_table_prefix } from '../utilities';

const STUDY_PARAMETERS: ParameterMap<StudyParameters> = new Map([
    [ "pmIds", (tableName: string): string => `${tableName}.pm_id = ANY(\${${tableName}.pmIds})` ],
    [ "refNames", (tableName: string): string => `${tableName}.refName = ANY(\${${tableName}.refNames})` ],
    [ "authorPrefix", (tableName: string): string => `${tableName}.author LIKE '%\${${tableName}.authorPrefix~}'` ],
    [ "namePrefix", (tableName: string): string => `${tableName}.name LIKE '%\${${tableName}.namePrefix~}'` ]
]);

const STUDY_SNP_ASSOCIATION_PARAMETERS: ParameterMap<StudySNPAssociationParameters> = new Map([
    [ "snp_ids", (tableName: string): string => `${tableName}.snpId = ANY(\${${tableName}.snp_ids})` ],
    [ "lead_ids", (tableName: string): string => `${tableName}.leadid = ANY(\${${tableName}.lead_ids})` ]
]);

const STUDY_CELL_TYPE_ENRICHMENT_PARAMETERS: ParameterMap<StudyCellTypeEnrichmentParameters> = new Map([
    [ "encodeid", (tableName: string): string => `${tableName}.encodeid = \${${tableName}.encodeid}` ],
    [ "fe_threshold", (tableName: string): string => `${tableName}.fe >= \${${tableName}.fe_threshold}` ],
    [ "fdr_threshold", (tableName: string): string => `${tableName}.fdr <= \${${tableName}.fdr_threshold}` ],
    [ "pValue_threshold", (tableName: string): string => `${tableName}.pValue <= \${${tableName}.pvalue_threshold}` ]
]);

/**
 * Creates a promise for selecting GWAS from the database, filtered by various criteria.
 * @param parameters criteria on which to filter the GWAS.
 * @param db connection to the database.
 */
export async function selectStudies(parameters: StudyParameters, db: IDatabase<any>): Promise<StudyResult[]> {
    const tableName: string = `${assembly_table_prefix(parameters.assembly)}_studies`;
    return db.any(
        `SELECT pm_id, author, name, refname FROM \${tableName~} AS study_table
          WHERE ${whereClause(conditionClauses(parameters, STUDY_PARAMETERS, "study_table"))}
         ORDER BY pm_id ASC
        `, { study_table: parameters, tableName }
	);
}

/**
 * Creates a promise for selecting GWAS and associated SNPs from the database, filtered by various criteria.
 * @param parameters criteria on which to filter the GWAS/SNP pairs.
 * @param db connection to the database.
 */
export async function selectStudySNPAssociations(parameters: StudySNPAssociationParameters,
                                                 db: IDatabase<any>): Promise<StudySNPAssociationResult[]> {
    const studyTableName: string = `${assembly_table_prefix(parameters.assembly)}_studies`;
    const snpTableName: string = `${assembly_table_prefix(parameters.assembly)}_snpstudies`;
    const query = `
        SELECT DISTINCT snp_table.pm_id AS pm_id, author, snp_table.name AS name,
               snp_table.refname AS refname, snpId, leadid
          FROM \${studyTableName~} AS study_table
         INNER JOIN \${snpTableName~} snp_table ON
             snp_table.pm_id = study_table.pm_id AND
             snp_table.name = study_table.name AND
             snp_table.refname = study_table.refname
         WHERE ${whereClause([
                ...conditionClauses(parameters, STUDY_PARAMETERS, "study_table"),
                ...conditionClauses(parameters, STUDY_SNP_ASSOCIATION_PARAMETERS, "snp_table")
               ])}
         ORDER BY pm_id ASC
         ${parameters.limit ? "LIMIT ${limit}" : ""}
         ${parameters.offset ? "OFFSET ${offset}" : ""}
    `;
    return db.any(query, {
        study_table: parameters, snp_table: parameters, studyTableName, snpTableName,
        limit: parameters.limit, offset: parameters.offset
    });
}

/**
 * Creates a promise for selecting GWAS and associated cell types from the database, filtered by various criteria.
 * @param parameters criteria on which to filter the GWAS/cell type pairs.
 * @param db connection to the database.
 */
export async function selectStudyCellTypeEnrichment(parameters: StudyCellTypeEnrichmentParameters,
                                                    db: IDatabase<any>): Promise<StudyCellTypeEnrichmentResult[]> {
    const studyTableName: string = `${assembly_table_prefix(parameters.assembly)}_studies`;
    const cteTableName: string = `${assembly_table_prefix(parameters.assembly)}_celltypeenrichment`;
    const query = `
        SELECT cte_table.pm_id AS pm_id, author, cte_table.name AS name,
               cte_table.refname AS refname, encodeid, fdr, fe, pValue
          FROM \${studyTableName~} AS study_table, \${cteTableName~} AS cte_table
         WHERE ${whereClause([
           ...conditionClauses(parameters, STUDY_PARAMETERS, "study_table"),
           ...conditionClauses(parameters, STUDY_CELL_TYPE_ENRICHMENT_PARAMETERS, "cte_table"),
           "cte_table.pm_id = study_table.pm_id",
           "cte_table.name = study_table.name",
            "cte_table.refname = study_table.refname"
        ])}
         ORDER BY cte_table.pm_id ASC
         ${parameters.limit ? "LIMIT ${limit}" : ""}
         ${parameters.offset ? "OFFSET ${offset}" : ""}
    `;
    return db.any(query, {
        study_table: parameters, cte_table: parameters, studyTableName, cteTableName,
        limit: parameters.limit, offset: parameters.offset
    });
}
