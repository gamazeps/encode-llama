import { IDatabase } from "pg-promise";
import { SNPResult, SNPParameters, SNPDensityParameters, AutocompleteParameters, Range, SNPDensityResult,
         GenomicRange, 
         SNPParametersWithRange,
         MAFParameters,
         SnpAssociation, SNPAssociationsParameters, GwasSnpAssociation, GwasIntersectingSnpsWithCcre, GwasIntersectingSNPWithBcreParameters, GwasIntersectingSnpsWithBcre } from "../types";
import { ParameterMap, conditionClauses, whereClause } from "queryz";
import { assembly_table_prefix } from '../utilities';

export const SNP_ASSOCIATIONS_PARAMETERS: ParameterMap<SNPAssociationsParameters> = new Map([
    [ "disease", (tableName: string): string => `${tableName}.disease = \${${tableName}.disease}` ],
    [ "snpid", (tableName: string): string => `${tableName}.snpid = \${${tableName}.snpid}` ]
])

export const INTERSECTINGSNP_WITHBCRE_PARAMETERS: ParameterMap<GwasIntersectingSNPWithBcreParameters> = new Map([
    [ "disease", (tableName: string): string => `${tableName}.disease = \${${tableName}.disease}` ],
    [ "snpid", (tableName: string): string => `${tableName}.snpid = \${${tableName}.snpid}` ],
    [ "bcre_group", (tableName: string): string => `${tableName}.bcre_group = \${${tableName}.bcre_group}` ]
])

export const SNP_PARAMETERS: ParameterMap<SNPParametersWithRange | SNPParameters | MAFParameters> = new Map([
    [ "coordinates", (tableName: string, parameters: SNPParametersWithRange | SNPParameters | MAFParameters): string => (
        (parameters as SNPParameters).coordinates!.map( (r: GenomicRange) => `(
            ${tableName}.chrom = '${r.chromosome}' AND (
	        ${tableName}.start >= ${r.start} AND ${tableName}.start < ${r.end} AND ${tableName}.stop > ${r.start}
            AND ${tableName}.stop < ${r.end}
            )
        )`).join(" OR "))
    ],
    [ "positions", (tableName: string, parameters: SNPParametersWithRange | SNPParameters | MAFParameters): string => (
        (parameters as MAFParameters).positions!.map( (r: GenomicRange) => `(
            ${tableName}.chrom = '${r.chromosome}' AND ${tableName}.start = ${r.start}
        )`).join(" OR "))
    ],
    [ "af_threshold", (tableName: string): string => `${tableName}.af >= \${${tableName}.af_threshold}` ],
    [ "snpids", (tableName: string): string => `${tableName}.snp = ANY(\${${tableName}.snpids})` ]
]);

export const SNP_DENSITY_PARAMETERS: ParameterMap<SNPDensityParameters> = new Map([
    [ "coordinates", (tableName: string, parameters: SNPDensityParameters): string => parameters.coordinates!.filter(
        (r: GenomicRange) => CHROMOSOMES[parameters.assembly!].has(r.chromosome)
    ).map(
        (r: GenomicRange) => `(
            ${tableName}.chrom = '${r.chromosome}' AND (
        	    (${tableName}.start >= ${r.start} AND ${tableName}.start <= ${r.end})
        	     OR (${tableName}.stop >= ${r.start} AND ${tableName}.stop <= ${r.end})
        	     OR (${tableName}.start <= ${r.start} AND ${tableName}.stop >= ${r.end})
            )
        )`
    ).join(" OR ") ]
]);

const CHROMOSOMES: { [key: string]: Set<string> } = {
    hg38: new Set([
        "chr1", "chr2", "chr3", "chr4", "chr5", "chr6", "chr7", "chr8", "chr9", "chr10", "chr11", "chr12", "chr13",
        "chr14", "chr15", "chr16", "chr17", "chr18", "chr19", "chr20", "chr21", "chr22", "chrX", "chrY"
    ]),
    hg19: new Set([
        "chr1", "chr2", "chr3", "chr4", "chr5", "chr6", "chr7", "chr8", "chr9", "chr10", "chr11", "chr12", "chr13",
        "chr14", "chr15", "chr16", "chr17", "chr18", "chr19", "chr20", "chr21", "chr22", "chrX", "chrY"
    ]),
    mm10: new Set([
        "chr1", "chr2", "chr3", "chr4", "chr5", "chr6", "chr7", "chr8", "chr9", "chr10", "chr11", "chr12", "chr13",
        "chr14", "chr15", "chr16", "chr17", "chr18", "chr19", "chrX", "chrY"
    ])
};

export async function selectSNPDensity(parameters: SNPDensityParameters, db: IDatabase<any>): Promise<SNPDensityResult[]> {
    return db.any(`
        SELECT chrom, start, stop, total_snps, common_snps FROM \${tableName~} AS t
         WHERE ${whereClause(conditionClauses(parameters, SNP_DENSITY_PARAMETERS, "t"))}
    `, { tableName: `${assembly_table_prefix(parameters.assembly!)}_snp_density_${parameters.resolution}`, t: parameters });
}

export async function selectSNPsManyRanges(parameters: SNPParameters, db: IDatabase<any>): Promise<SNPResult[]> {
    const grouped: { [chromosome: string]: Range[] } = {};
    const tableNames: { [key: string]: string } = {};
    const rParameters: { [key: string]: any } = {};
    parameters.coordinates!.forEach( (r: GenomicRange) => {
        if (!CHROMOSOMES[parameters.assembly!] || !CHROMOSOMES[parameters.assembly!].has(r.chromosome)) return;
        if (grouped[r.chromosome] === undefined) grouped[r.chromosome] = [];
        grouped[r.chromosome].push({
            start: r.start,
            end: r.end
        });
        tableNames[`tableName${r.chromosome}`] = `${assembly_table_prefix(parameters.assembly!)}_snp_coords_${r.chromosome}`;
    });
    if (Object.keys(grouped).length === 0) return [];
    parameters.coordinates!.forEach( (r: GenomicRange) => {
        rParameters[`snp_table_${r.chromosome}`] = { ...parameters, coordinates: grouped[r.chromosome] };
    });
    const queries = Object.keys(grouped).map( (chromosome: string) => (`(
        SELECT af, snp, '${chromosome}' AS chrom, start, stop, refallele FROM \${tableName${chromosome}~} AS snp_table_${chromosome}
         WHERE ${whereClause(conditionClauses({ ...parameters, coordinates: grouped[chromosome] }, SNP_PARAMETERS, `snp_table_${chromosome}`))}
    )`));
    return db.any(queries.join(" UNION ALL "), { ...tableNames, ...rParameters });
}

/**
 * Creates a promise for selecting SNPs and their coordinates, filtered by various criteria.
 * @param parameters criteria on which to filter the SNPs.
 * @param db connection to the database.
 */
export async function selectSNPs(parameters: SNPParameters, db: IDatabase<any>): Promise<SNPResult[]> {
    const tableName: string = assembly_table_prefix(parameters.assembly!) + (
	    parameters.common ? "_common_snps" : "_snp_coords_ref"
    );
    return db.any(
        `SELECT af, snp, chrom, start, stop, refallele FROM \${tableName~} AS snp_table
          WHERE ${whereClause(conditionClauses(parameters, SNP_PARAMETERS, "snp_table"))}
          ORDER BY snp ASC
        `, { snp_table: parameters, tableName }
    );
}

/**
 * Creates a promise for selecting SNPs and their coordinates, filtered by various criteria.
 * @param parameters criteria on which to filter the SNPs.
 * @param db connection to the database.
 */
 export async function selectSNPAssociations(parameters: SNPAssociationsParameters, db: IDatabase<any>): Promise<SnpAssociation[]> {
    const tableName: string = "snp_associations";
    return db.any(
        `SELECT disease, snpid, a1, a2, n, z, chisq FROM \${tableName~} AS snp_associations_table
          WHERE ${whereClause(conditionClauses(parameters, SNP_ASSOCIATIONS_PARAMETERS, "snp_associations_table"))} 
          ORDER BY snpid ASC
          ${parameters.limit ? "LIMIT ${limit}" : ""}
          ${parameters.offset ? "OFFSET ${offset}" : ""}         
        `, { snp_associations_table: parameters, tableName, limit: parameters.limit, offset: parameters.offset }
    );
}

/**
 * Creates a promise for getting autocomplete suggestions for the beginning of a SNP ID.
 * @param parameters contains the rsID to autocomplete and optional limit and offset.
 * @param db connection to the database.
 */
export async function selectSnpsSuggestionsbyId(parameters: AutocompleteParameters,
                                                db: IDatabase<any>): Promise<SNPResult[]> {

    // we only suggest completions for rsIDs
    if (!parameters.snpid.startsWith("rs")) return [];

    // try the exact ID plus any IDs with one number added
    const snpIds = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ].map( (i: number): string => parameters.snpid + i );
    snpIds.push(parameters.snpid);
    const tableName: string = assembly_table_prefix(parameters.assembly!) + (
    	parameters.common ? "_common_snps" : "_snp_coords_ref"
    );
    const query = "SELECT snp, chrom, start, stop, af, refallele "
        + "FROM ${tableName~} WHERE snp = ANY(${snpIds}) LIMIT ${limit}";

    // build results vector; put exact match first if it exists
    const results: SNPResult[] = await db.any(query, { snpid: parameters.snpid, snpIds, tableName, limit: parameters.limit });
    const exactMatch = results.filter( (result: SNPResult): boolean => result.snp === parameters.snpid );
    const retval: SNPResult[] = exactMatch.length ? exactMatch : [];
    results.filter( (result: SNPResult): boolean => result.snp !== parameters.snpid ).forEach( (result: SNPResult): void => {
	    retval.push(result);
    });
    return retval;

}

//GwasSnpAssociation

/**.
 * @param parameters 
 * @param db connection to the database.
 */
 export async function selectGwasSNPAssociations(parameters: SNPAssociationsParameters, db: IDatabase<any>): Promise<GwasSnpAssociation[]> {
    const tableName: string = "gwas_snp_associations";
    return db.any(
        `SELECT disease,snpid,chrom,start,stop,riskallele,associated_gene,analyses_identifying_SNP,association_p_val FROM \${tableName~} AS gwas_snp_associations_table
          WHERE ${whereClause(conditionClauses(parameters, SNP_ASSOCIATIONS_PARAMETERS, "gwas_snp_associations_table"))} 
          ORDER BY snpid ASC
          ${parameters.limit ? "LIMIT ${limit}" : ""}
          ${parameters.offset ? "OFFSET ${offset}" : ""}         
        `, { gwas_snp_associations_table: parameters, tableName, limit: parameters.limit, offset: parameters.offset }

    );
}


//GwasSnpAssociation

/**.
 * @param parameters 
 * @param db connection to the database.
 */
 export async function selectGwasIntersectingSNPWithCcres(parameters: SNPAssociationsParameters, db: IDatabase<any>): Promise<GwasIntersectingSnpsWithCcre[]> {
    const tableName: string = "gwas_intersectingsnp_withccres";
    return db.any(
        `SELECT disease,snpid,snp_chrom,snp_start,snp_stop,riskallele,associated_gene,association_p_val,ccre_chrom,ccre_start,ccre_stop,rdhsid,ccreid,ccre_class FROM \${tableName~} AS gwas_intersectingsnp_withccres_table
          WHERE ${whereClause(conditionClauses(parameters, SNP_ASSOCIATIONS_PARAMETERS, "gwas_intersectingsnp_withccres_table"))} 
          ORDER BY snpid ASC
          ${parameters.limit ? "LIMIT ${limit}" : ""}
          ${parameters.offset ? "OFFSET ${offset}" : ""}         
        `, { gwas_intersectingsnp_withccres_table: parameters, tableName, limit: parameters.limit, offset: parameters.offset }

    );
}


//GwasIntersectingSNPWithBcreParameters

/**.
 * @param parameters 
 * @param db connection to the database.
 */
 export async function selectGwasIntersectingSNPWithBcres(parameters: GwasIntersectingSNPWithBcreParameters, db: IDatabase<any>): Promise<GwasIntersectingSnpsWithBcre[]> {
    const tableName: string = "gwas_intersectingsnp_withbcres";
    return db.any(
        `SELECT disease,snpid,snp_chrom,snp_start,snp_stop,riskallele,associated_gene,association_p_val,ccre_chrom,ccre_start,ccre_stop,rdhsid,ccreid,ccre_class,bcre_group FROM \${tableName~} AS gwas_intersectingsnp_withbcres_table
          WHERE ${whereClause(conditionClauses(parameters, INTERSECTINGSNP_WITHBCRE_PARAMETERS, "gwas_intersectingsnp_withbcres_table"))} 
          ORDER BY snpid ASC
          ${parameters.limit ? "LIMIT ${limit}" : ""}
          ${parameters.offset ? "OFFSET ${offset}" : ""}         
        `, { gwas_intersectingsnp_withbcres_table: parameters, tableName, limit: parameters.limit, offset: parameters.offset }

    );
}