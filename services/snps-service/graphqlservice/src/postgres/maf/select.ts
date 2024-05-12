import { IDatabase } from "pg-promise";
import { MAFParameters, MAFResult } from "../types";
import { SNP_PARAMETERS } from '../snp/select';
import { conditionClauses, whereClause } from "queryz";

/**
 * Selects MAF records from the database.
 * @param parameters parameters used to filter the results.
 * @param db connection to the database.
 */
export async function selectMAF(parameters: MAFParameters, db: IDatabase<any>): Promise<MAFResult[]> {
    return db.any(
        `SELECT snp, refallele, altallele, af, eas_af, amr_af, afr_af, eur_af, sas_af, chrom, start FROM snps_maf
          WHERE ${whereClause(conditionClauses(parameters, SNP_PARAMETERS, "snps_maf"))}
         ORDER BY snp ASC
        `, { snps_maf: parameters }
	  );
}
