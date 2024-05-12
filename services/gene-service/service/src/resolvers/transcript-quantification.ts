import DataLoader from "dataloader";
import { GraphQLFieldResolver } from "graphql";

import { groupById } from "./utilities";
import { db, selectTranscriptQuantifications } from'../postgres';
import { GeneResult, TranscriptResult, QuantificationDataSourceType } from'../postgres/types';
import { QuantificationFile } from '../postgres/datasets/types';
import { TranscriptQuant, TranscriptQuantParameters } from '../postgres/transcript-quantification/types';
import { geneLoader } from './gene';
import { transcriptLoader } from './transcript';
import { DEFAULT_QUANT_SOURCE } from '../constants';

export type TranscriptQuantificationDataLoader = DataLoader<string, TranscriptQuant[]>;

const transcriptQuantificationQuery: GraphQLFieldResolver<{}, {}, any> = async (_, args): Promise<TranscriptQuant[]> => {
    return (await selectTranscriptQuantifications(args, db)).map(
        (result: TranscriptQuant): TranscriptQuant => ({ ...result, assembly: args.assembly })
    );
}

/**
 * Creates a data loader for loading a set of transcript quantification files from the database given corresponding datasets.
 * @param assembly the genomic assembly from which to load the files.
 * @param loaders map of assemblies to cached data loaders used to load quantification files.
 */
export function transcriptQuantValueLoader(args: TranscriptQuantParameters, loaders: { [assembly: string]: TranscriptQuantificationDataLoader }): TranscriptQuantificationDataLoader {
    const source = args.source || DEFAULT_QUANT_SOURCE;
    const key = `${args.assembly}_${source.type}:${source.user_collection}`;
    if (!loaders[key]) loaders[key] = new DataLoader<string, TranscriptQuant[]>(
        async (accessions: string[]): Promise<TranscriptQuant[][]> => (
            groupById(accessions, (await selectTranscriptQuantifications({ ...args, file_accession: accessions }, db)).map(
                (q: TranscriptQuant): TranscriptQuant => ({ ...q, assembly: args.assembly })
            ), "file_accession")
        )
    );
    return loaders[key];
}

export const transcriptQuantificationQueries = {
    transcript_quantification: transcriptQuantificationQuery
}

export const transcriptQuantificationResolvers = {
    TranscriptQuantificationFile: {
        quantifications: async (obj: QuantificationFile, parameters: any, context: any): Promise<TranscriptQuant[]> => {
            const loader = transcriptQuantValueLoader(
                { assembly: obj.assembly, ...parameters }, context.transcriptQuantValueLoaders
            )
            const source = parameters.source || DEFAULT_QUANT_SOURCE;
            const key = source.type === QuantificationDataSourceType.PSYCH_ENCODE ? obj.name! : obj.accession;
            return loader.load(key);
        }
    },
    TranscriptQuantification: {
        gene: async (obj: TranscriptQuant, parameters: any, context: any): Promise<GeneResult> => (
            geneLoader(obj.assembly!, context.geneLoaders).load(obj.gene_id)
        ),
        transcript: async (obj: TranscriptQuant, parameters: any, context: any): Promise<TranscriptResult> => (
            transcriptLoader(obj.assembly!, context.transcriptLoadersById).load(obj.transcript_id)
        )
    }
};
