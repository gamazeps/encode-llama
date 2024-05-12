import { IDatabase } from "pg-promise";
import { GraphQLFieldResolver } from "graphql";
import DataLoader from "dataloader";

import { db, selectStudies, selectStudySNPAssociations, selectStudyCellTypeEnrichment } from "../postgres";
import { StudyParameters, StudyCellTypeEnrichmentParameters, StudySNPAssociationParameters,
         StudyResult, StudySNPAssociationResult, StudyCellTypeEnrichmentResult,
         StudyResultWithAssembly, SNPResultWithRefName, SNPResult,
         StudyLeadSNPParameters } from '../postgres/types';
import { CellTypeEnrichment } from './types';
import { groupById } from './utilities';
import { snpLoader } from './snp';

export type StudyDataLoader = DataLoader<string, StudyResult[]>;
export type StudySNPDataLoader = DataLoader<string, SNPResultWithRefName[]>;
export type StudyCTEDataLoader = DataLoader<string, StudyCellTypeEnrichmentResult[]>;

/** Loads GWAS results for a given set of input parameters */
const studiesQuery: GraphQLFieldResolver<{}, {}, StudyParameters | any>
  = async (_, args): Promise<StudyResultWithAssembly[]> => {
    return (await selectStudies(args, db)).map( (result: StudyResult): StudyResultWithAssembly => (
        { ...result, assembly: args.assembly }
    ));
};

/**
 * Returns a data loader for loading SNPs from GWAS given pubMedIDs. If a loader does not already exist for
 * the given assembly, it will be created and saved for later reuse.
 *
 * @param assembly the genomic assembly from which to load the SNPs.
 * @param loaders map containing existing data loaders for assemblies.
 */
export function studySNPLoader(assembly: string,
                               loaders: { [key: string]: StudySNPDataLoader }, context: any,
			       args: StudyLeadSNPParameters): StudySNPDataLoader {

    const snploader = snpLoader(assembly, context.snpLoaders);

    /**
     * Loads SNP data for a given set of studies and groups them by the study or studies they come from.
     * @param parameters the parameters used to filter the studies.
     * @param db connection to the database.
     */
    const loadSnps = async (parameters: StudySNPAssociationParameters,
                            db: IDatabase<any>): Promise<SNPResultWithRefName[]> => {

        // get rows from database, create empty results array
        const rows: StudySNPAssociationResult[] = await selectStudySNPAssociations({
	        ...parameters, snp_ids: args.linkedSNP ? [ args.linkedSNP ] : undefined
	    }, db);
        const retval: SNPResultWithRefName[] = [];

        // map SNP IDs to their study or studies so we can match them up when the results are returned
        const rowMap: { [key: string]: any } = {};
        rows.forEach( (row: StudySNPAssociationResult): void => {
            if (rowMap[row.leadid] === undefined) rowMap[row.leadid] = new Set();
            rowMap[row.leadid].add(row.refname);
        });

        // load all SNP information from the SNP DataLoader
        const results: SNPResult[] = await Promise.all(Object.keys(rowMap).map(
            async (key: string): Promise<SNPResult> => snploader.load(key)
        ));

        // filter SNPs which weren't found and match the rest back to their original study
        results.filter( (result: SNPResult): boolean => result !== undefined && rowMap[result.snp] !== undefined)
            .forEach( (result: SNPResult): void => {
                rowMap[result.snp].forEach( (refname: string): void => {
                    retval.push({ ...result, refname, assembly });
                });
            });
        return retval;

    };

    if (!loaders[assembly]) loaders[assembly] = new DataLoader<string, SNPResultWithRefName[]>(
        async (refnames: string[]): Promise<SNPResultWithRefName[][]> => (
            groupById(refnames, await loadSnps({ assembly, refnames }, db), "refname")
        )
    );
    return loaders[assembly];

}

/**
 * Returns a data loader for loading SNPs from GWAS given pubMedIDs. If a loader does not already exist for
 * the given assembly, it will be created and saved for later reuse.
 *
 * @param assembly the genomic assembly from which to load the SNPs.
 * @param loaders map containing existing data loaders for assemblies.
 */
export function studyCTELoader(parameters: StudyCellTypeEnrichmentParameters,
                               loaders: { [key: string]: StudyCTEDataLoader }): StudyCTEDataLoader {
    const key = parameters.assembly + ":" + parameters.fe_threshold + "/" + parameters.fdr_threshold + "/"
        + parameters.pValue_threshold + "@" + parameters.encodeid;
    if (!loaders[key]) loaders[key] = (
        new DataLoader<string, StudyCellTypeEnrichmentResult[]>(
            async (refnames: string[]): Promise<StudyCellTypeEnrichmentResult[][]> => (
                groupById(refnames, await selectStudyCellTypeEnrichment({ ...parameters, refnames }, db), "refname")
            )
        )
    );
    return loaders[key];
}

/**
 * Returns a data loader for loading GWAS studies given a list of SNP IDs. If a loader does not already exist for
 * the given assembly, it will be created and saved for later reuse.
 *
 * @param assembly the genomic assembly from which to load the SNPs.
 * @param loaders map containing existing data loaders for assemblies.
 */
export function studyLoader(assembly: string, loaders: { [key: string]: StudyDataLoader }): StudyDataLoader {
    if (!loaders[assembly]) loaders[assembly] = (
        new DataLoader<string, StudyResultWithAssembly[]>(
            async (snp_ids: string[]): Promise<StudyResultWithAssembly[][]> => (
                groupById(
		            snp_ids,
		            (await selectStudySNPAssociations({ assembly, snp_ids }, db)).map(
			            (result: StudyResult): StudyResultWithAssembly => (
			                { ...result, assembly }
			            )
		            ), "snpid"
		        )
            )
        )
    );
    return loaders[assembly];
}

export const studyQueries = {
    genomeWideAssociationQuery: studiesQuery
}

export const studyResolvers = {
    GWAS: {
        pubMedId: async (object: StudyResult): Promise<number> => object.pm_id,
        cellTypeEnrichment: async (object: StudyResultWithAssembly,
                                   args: any, context: any): Promise<CellTypeEnrichment[]> => (
            studyCTELoader({ ...args, assembly: object.assembly }, context.studyCTELoaders).load(object.refname)
        ),
        leadSNPs: async (object: StudyResultWithAssembly, args: any,
                         context: any): Promise<SNPResultWithRefName[]> => (
            studySNPLoader(object.assembly, context.studySNPLoaders, context, args).load(object.refname)
        )
    }
};
