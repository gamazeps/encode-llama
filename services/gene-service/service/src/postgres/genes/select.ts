import { IDatabase } from "pg-promise";
import { featureSchema } from "../utilities";
import { GeneAssociation, GeneAssociationsParameters, GeneParameters, GeneResult, SingleCellGeneBoxPlot, SingleCellGeneBoxPlotParameters, PeDatasetValues, DeconQtls, Deg, QtlSigAssoc } from "../types";
import { getGencodeVersion, DEFAULT_FEATURE_SOURCE } from '../../constants';
import { conditionClauses, fieldMatchesAny, ParameterMap, Parameters, whereClause } from "queryz";
import { encodeSchema, psychEncodeSchema } from "../connection";

export const FEATURE_PARAMETERS: ParameterMap<Parameters> = new Map([
    [ "name", (tableName: string): string => tableName + ".name = ANY(${" + tableName + ".name})" ],
    [ "id", (tableName: string): string => tableName + ".id = ANY(${" + tableName + ".id})" ],
    [ "strand", (tableName: string): string => tableName + ".strand = ${" + tableName + ".strand}" ],
    [ "coordinates", (tableName: string): string => `${tableName}.chromosome = \${${tableName}.coordinates.chromosome} AND ((
        ${tableName}.start <= \${${tableName}.coordinates.start} AND ${tableName}.stop >= \${${tableName}.coordinates.start}
    ) OR (
        ${tableName}.start <= \${${tableName}.coordinates.stop} AND ${tableName}.stop >= \${${tableName}.coordinates.stop}
    ) OR (
        ${tableName}.start <= \${${tableName}.coordinates.start} AND ${tableName}.stop >= \${${tableName}.coordinates.stop}
    ) OR (
        ${tableName}.start >= \${${tableName}.coordinates.start} AND ${tableName}.stop <= \${${tableName}.coordinates.stop}
    ))` ],
    [ "name_prefix", (tableName: string): string => `${tableName}.name ILIKE ANY(\${${tableName}.name_prefix}) OR ${tableName}.id ILIKE ANY(\${${tableName}.name_prefix})` ]
]);

export const GENE_PARAMETERS: ParameterMap<GeneParameters> = new Map([
    [ "gene_type", fieldMatchesAny("gene_type") ],
    [ "havana_id", fieldMatchesAny("havana_id") ],
    [ "idPrefix", fieldMatchesAny("idPrefix") ],
    [ "name", fieldMatchesAny("name") ],
    ...FEATURE_PARAMETERS
]);

const NEARBY_PARAMETERS: ParameterMap<GeneParameters> = new Map([
    [ "coordinates", (tableName: string): string => (
        "chromosome = '${" + tableName + ".coordinates.chromosome}' AND ("
            + "(${" + tableName + ".start} >= ${" + tableName + ".center} - ${" + tableName + ".distance} "
            + " AND ${" + tableName + ".start} <= ${" + tableName + ".center}) OR ("
            + "(${" + tableName + ".start} <= ${" + tableName + ".center} - ${" + tableName + ".distance} "
            + " AND ${" + tableName + ".start} >= ${" + tableName + ".center}))"
    )],
    [ "gene_type", fieldMatchesAny("gene_type") ]
]);

/**
 * Selects genes whose TSS is within a given distance (default 20 kb) of a given position.
 * @param assembly the genomic assembly to search.
 * @param parameters the search parameters by which to select nearby genes.
 * @param db connection to the database.
 */
export async function selectNearbyGenes(assembly: string, parameters: GeneParameters, db: IDatabase<any>): Promise<GeneResult[]> {
    const version = getGencodeVersion(parameters, assembly);
    const schema = featureSchema(parameters.source || DEFAULT_FEATURE_SOURCE);
    const tableName = `gene_${assembly.toLowerCase()}_${version}`;
    const distance = parameters.distanceThreshold ? parameters.distanceThreshold : 20000;
    const center = Math.round((parameters.coordinates!.start + parameters.coordinates!.stop) / 2);
    return db.any(`
        SELECT id, name, chromosome, start, stop, name, project, score, strand, gene_type, havana_id
          FROM \${schema~}.\${tableName~} AS g
         WHERE ${whereClause(conditionClauses(parameters, NEARBY_PARAMETERS, "g"))}
         ORDER BY ABS(${center} - start) ASC
         ${ parameters.limit ? `LIMIT ${parameters.limit}` : ""}
         ${ parameters.offset ? `OFFSET ${parameters.offset}` : ""}
    `, { schema, tableName, g: { ...parameters, distance, center }});
}

/**
 * Returns a count of the number of genes matching the given search criteria.
 * @param assembly the genomic assembly to search.
 * @param parameters the search parameters by which to select genes.
 * @param db connection to the database.
 */
export async function selectGenesCount(assembly: string, parameters: GeneParameters, db: IDatabase<any>): Promise<number> {
    const version = getGencodeVersion(parameters, assembly);
    const schema = featureSchema(parameters.source || DEFAULT_FEATURE_SOURCE);
    const tableName = `${schema}.gene_${assembly.toLowerCase()}_${version}`;
    const result = await db.one(`
        SELECT COUNT(*) FROM \${schema~}.\${tableName~} AS g
         WHERE ${whereClause(conditionClauses(parameters, GENE_PARAMETERS, "g"))}
    `, { schema, tableName, g: parameters });
    return result.count;
}

/**
  * Returns all genes matching the given search criteria.
  * @param assembly the genomic assembly to search.
  * @param parameters the search parameters by which to select genes.
  * @param db connection to the database.
 */
export async function selectGenes(assembly: string, parameters: GeneParameters, db: IDatabase<any>): Promise<GeneResult[]> {
    const version = getGencodeVersion(parameters, assembly);
    const schema = featureSchema(parameters.source || DEFAULT_FEATURE_SOURCE);
    const tableName = `gene_${assembly.toLowerCase()}_${version}`;
    console.log("fetching from", tableName)
    parameters.name_prefix = parameters.name_prefix?.map(x => x + "%");
    return db.any(`
        SELECT id, name, chromosome, start, stop, name, project, score, strand, gene_type, havana_id
          FROM \${schema~}.\${tableName~} AS g
         WHERE ${whereClause(conditionClauses(parameters, GENE_PARAMETERS, "g"))}
         ORDER BY ${ parameters.orderby || "id" }
         ${ parameters.limit ? `LIMIT ${parameters.limit}` : ""}
         ${ parameters.offset ? `OFFSET ${parameters.offset}` : ""}
    `, { schema, tableName, g: parameters });
}

export const GENES_ASSOCIATIONS_PARAMETERS: ParameterMap<GeneAssociationsParameters> = new Map([
    [ "disease", (tableName: string): string => `${tableName}.disease = \${${tableName}.disease}` ],
    [ "gene_id", (tableName: string): string => `${tableName}.gene_id = \${${tableName}.gene_id}` ]
])

export const PEDATASET_VALUES_PARAMETERS: ParameterMap<{dataset: string[], gene: string}> = new Map([
    //[ "dataset", (tableName: string): string => `${tableName}.dataset = \${${tableName}.dataset}` ],
    //[ "dataset", fieldMatchesAny("dataset") ],
    [ "dataset", (tableName: string): string => tableName + ".dataset = ANY(${" + tableName + ".dataset})" ],
    [ "gene", (tableName: string): string => `${tableName}.featurekey = \${${tableName}.gene}` ]
])


export const SINGLECELL_GENE_BOXPLOT_PARAMETERS: ParameterMap<SingleCellGeneBoxPlotParameters> = new Map([
    [ "disease", (tableName: string): string => `${tableName}.disease = \${${tableName}.disease}` ],
    [ "gene", fieldMatchesAny("gene") ],
    [ "celltype", fieldMatchesAny("celltype") ]
])


export const CAQTL_PARAMETERS: ParameterMap<{snpid: string}> = new Map([
    [ "snpid", (tableName: string): string => `${tableName}.snpid = \${${tableName}.snpid}` ]    
])

export const DECONQTL_PARAMETERS: ParameterMap<{snpid?: string, geneid?: string}> = new Map([
    [ "snpid", (tableName: string): string => `${tableName}.snpid = \${${tableName}.snpid}` ],
    [ "geneid", (tableName: string): string => `${tableName}.geneid = \${${tableName}.geneid}` ]        
])

export const DEG_PARAMETERS: ParameterMap<{disease: string, gene?: string, celltype?: string}> = new Map([
    [ "disease", (tableName: string): string => `${tableName}.disease = \${${tableName}.disease}` ],
    [ "gene", (tableName: string): string => `${tableName}.gene = \${${tableName}.gene}` ] ,
    [ "celltype", (tableName: string): string => `${tableName}.celltype = \${${tableName}.celltype}` ]        
])

export const QTLSIGASSOC_PARAMETERS: ParameterMap<{ qtltype?: string, snpid?: string, geneid?: string}> = new Map([
    [ "qtltype", (tableName: string): string => `${tableName}.qtltype = \${${tableName}.qtltype}` ],
    [ "snpid", (tableName: string): string => `${tableName}.snpid = \${${tableName}.snpid}` ],
    [ "geneid", (tableName: string): string => `${tableName}.geneid = \${${tableName}.geneid}` ]                
])


/**
 * Creates a promise for selecting single cell gene box plot, filtered by various criteria.
 * @param parameters criteria on which to filter the single cell gene box plot.
 * @param db connection to the database.
 */
 export async function selectSingleCellBoxPlot(parameters: SingleCellGeneBoxPlotParameters, db: IDatabase<any>): Promise<SingleCellGeneBoxPlot[]> {
    const tableName: string = "singlecelldiseaseboxplot";
    const schema = encodeSchema 
    return db.any(
        `SELECT disease, gene,celltype,min,firstquartile,median,thirdquartile, max,expr_frac,mean_count FROM
          \${schema~}.\${tableName~} AS singlecelldiseaseboxplot_table
          WHERE ${whereClause(conditionClauses(parameters, SINGLECELL_GENE_BOXPLOT_PARAMETERS, "singlecelldiseaseboxplot_table"))} 
          ORDER BY gene ASC
          ${parameters.limit ? "LIMIT ${limit}" : ""}
          ${parameters.offset ? "OFFSET ${offset}" : ""}         
        `, { schema, singlecelldiseaseboxplot_table: parameters, tableName, limit: parameters.limit, offset: parameters.offset }
    );
}

/**
 * Creates a promise for selecting gene associations, filtered by various criteria.
 * @param parameters criteria on which to filter the gene associations.
 * @param db connection to the database.
 */

export async function selectGeneAssociations(parameters: GeneAssociationsParameters, db: IDatabase<any>): Promise<GeneAssociation[]> {
    const tableName: string = "gene_associations";
    const schema = encodeSchema 
    return db.any(
        `SELECT disease, gene_name, gene_id, twas_p, twas_bonferroni, hsq, dge_fdr, dge_log2fc FROM 
         \${schema~}.\${tableName~} AS genes_associations_table
          WHERE ${whereClause(conditionClauses(parameters, GENES_ASSOCIATIONS_PARAMETERS, "genes_associations_table"))} 
          ORDER BY gene_id ASC
          ${parameters.limit ? "LIMIT ${limit}" : ""}
          ${parameters.offset ? "OFFSET ${offset}" : ""}         
        `, { schema, genes_associations_table: parameters, tableName, limit: parameters.limit, offset: parameters.offset }
    );
}

export async function selectPedatasetValuesbyCelltype(parameters: {dataset: string[], gene: string}, db: IDatabase<any>): Promise<PeDatasetValues[]> {

    const tableName: string = "avgexp_bycelltype";
    const schema = psychEncodeSchema
    return db.any(`SELECT A.celltype,A.dataset,A.featurekey as gene,avgexp,pctexp FROM  \${schema~}.\${tableName~} AS A
    JOIN \${schema~}.pctexp_bycelltype as B ON A.dataset=B.dataset and A.featurekey=B.featurekey and A.celltype=B.celltype
    WHERE ${whereClause(conditionClauses(parameters, PEDATASET_VALUES_PARAMETERS, "A"))} 
`, { schema, A: parameters, tableName })
}

export async function selectPedatasetValuesbySubclass(parameters: {dataset: string[], gene: string}, db: IDatabase<any>): Promise<PeDatasetValues[]> {

    const tableName: string = "avgexp_bysubclass";
    const schema = psychEncodeSchema
    return db.any(`SELECT A.celltype,A.dataset,A.featurekey as gene,avgexp,pctexp FROM  \${schema~}.\${tableName~} AS A
    JOIN \${schema~}.pctexp_bysubclass as B ON A.dataset=B.dataset and A.featurekey=B.featurekey and A.celltype=B.celltype
    WHERE ${whereClause(conditionClauses(parameters, PEDATASET_VALUES_PARAMETERS, "A"))} 
`, { schema, A: parameters, tableName })
}
export async function selectCaQtls(parameters: {snpid: string}, db: IDatabase<any>): Promise<{snpid: string, type:string}[]> {
    const tableName: string = "caqtls";
    const schema = psychEncodeSchema
    return db.any(`SELECT snpid,type FROM  \${schema~}.\${tableName~} AS caqtls_table
    WHERE ${whereClause(conditionClauses(parameters, CAQTL_PARAMETERS, "caqtls_table"))} 
    `, { schema, caqtls_table: parameters, tableName })
}


export async function selectDeconQtls(parameters: {snpid?: string, geneid?: string}, db: IDatabase<any>): Promise<DeconQtls[]> {
    const tableName: string = "deconqtls";
    const schema = psychEncodeSchema
    return db.any(`SELECT geneid,snpid ,snp_chrom ,snp_start ,nom_val,slope ,adj_beta_pval, r_squared ,celltype  FROM  \${schema~}.\${tableName~} AS deconqtls_table
    WHERE ${whereClause(conditionClauses(parameters, DECONQTL_PARAMETERS, "deconqtls_table"))} 
    `, { schema, deconqtls_table: parameters, tableName })
}


export async function selectDeg(parameters: {gene?: string, celltype?: string, disease: string}, db: IDatabase<any>): Promise<Deg[]> {
    const tableName: string = "deg";
    const schema = psychEncodeSchema
    return db.any(`SELECT gene,  base_mean,log2_fc,lfc_se,stat,pvalue,padj,disease,celltype  FROM  \${schema~}.\${tableName~} AS deg_table
    WHERE ${whereClause(conditionClauses(parameters, DEG_PARAMETERS, "deg_table"))} 
    `, { schema, deg_table: parameters, tableName })
}

export async function selectQtlSigAssoc(parameters: { qtltype?: string, snpid?: string, geneid?: string}, db: IDatabase<any>): Promise<QtlSigAssoc[]> {
    const tableName: string = "qtlsigassoc";
    const schema = psychEncodeSchema
    return db.any(`SELECT geneid,snpid,dist,npval,slope,fdr,qtltype  FROM  \${schema~}.\${tableName~} AS qtlsigassoc_table
    WHERE ${whereClause(conditionClauses(parameters, QTLSIGASSOC_PARAMETERS, "qtlsigassoc_table"))} 
    `, { schema, qtlsigassoc_table: parameters, tableName })
}




