import DataLoader from "dataloader";
import { GraphQLFieldResolver } from "graphql";

import { groupById } from "./utilities";
import { db, selectGeneQuantifications } from'../postgres';
import { GeneResult, QuantificationDataSourceType } from'../postgres/types';
import { QuantificationFile } from '../postgres/datasets/types';
import { GeneQuant, GeneQuantParameters } from '../postgres/gene-quantification/types';
import { geneLoader } from './gene';
import { DEFAULT_QUANT_SOURCE } from '../constants';

export type GeneQuantificationDataLoader = DataLoader<string, GeneQuant[]>;

const geneQuantificationQuery: GraphQLFieldResolver<any, {}, any> = async (_, args): Promise<GeneQuant[]> => {
    return (await selectGeneQuantifications(args,db)).map(
        (result: GeneQuant): GeneQuant => ({ ...result, assembly: args.assembly })
    );
}

/**
 * Creates a data loader for loading a set of gene quantification files from the database given corresponding datasets.
 * @param assembly the genomic assembly from which to load the files.
 * @param loaders map of assemblies to cached data loaders used to load quantification files.
 */
export function geneQuantValueLoader(args: GeneQuantParameters, loaders: { [assembly: string]: GeneQuantificationDataLoader }): GeneQuantificationDataLoader {
    const source = args.source || DEFAULT_QUANT_SOURCE;
    const key = `${args.assembly}_${source.type}:${source.user_collection||""}`;
    if (!loaders[key])
        loaders[key] = new DataLoader<string, GeneQuant[]>(async (accessions: string[]): Promise<GeneQuant[][]> => {
            const rawGeneQuant = await selectGeneQuantifications({ ...args, file_accession: accessions }, db);
            const geneQuant = rawGeneQuant.map((q: GeneQuant): GeneQuant => ({ ...q, assembly: args.assembly }));
            return groupById(accessions, geneQuant, "file_accession");
        });
    return loaders[key];
}

export const geneQuantificationQueries = {
    gene_quantification: geneQuantificationQuery
}

export const geneQuantificationResolvers = {
    GeneQuantificationFile: {
        quantifications: async (obj: QuantificationFile, parameters: any, context: any): Promise<GeneQuant[]> => {
            const source = parameters.source || obj.source || DEFAULT_QUANT_SOURCE;
            const loader = geneQuantValueLoader(
                { ...parameters, assembly: obj.assembly, source }, context.geneQuantValueLoaders
            );
            const key = source.type === QuantificationDataSourceType.PSYCH_ENCODE ? obj.name! : obj.accession;
            return loader.load(key);
        }
    },
    GeneQuantification: {
        gene: async (obj: GeneQuant, _: any, context: any): Promise<GeneResult> => {
            return geneLoader(obj.assembly!, context.geneLoaders).load(obj.gene_id)
        }
    }
};
