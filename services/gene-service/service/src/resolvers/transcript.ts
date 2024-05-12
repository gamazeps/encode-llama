import DataLoader from "dataloader";
import { GraphQLFieldResolver } from "graphql";

import { TranscriptInputParameters } from '../types';
import { db, selectExonsByTranscript, selectTranscripts } from "../postgres";
import { TranscriptResult, TranscriptParameters, ExonResult } from "../postgres/types";
import { groupById, resolveCoordinates, groupByKeySingle } from "./utilities";

export type TranscriptDataLoader = DataLoader<string, TranscriptResult>;
export type TranscriptExonDataLoader = DataLoader<string, ExonResult[]>;

function transcriptParameters(parameters: TranscriptInputParameters | any): TranscriptParameters {
    return {
        id: parameters.id,
        name: parameters.name,
        strand: parameters.strand,
        coordinates: parameters.chromosome && {
            chromosome: parameters.chromosome,
            start: parameters.start,
            stop: parameters.end
        },
        name_prefix: parameters.name_prefix,
        orderby: parameters.orderby,
        limit: parameters.limit,
        distanceThreshold: parameters.distanceThreshold
    };
}

const transcriptQuery: GraphQLFieldResolver<{}, {}, TranscriptParameters> = async (_, args): Promise<TranscriptResult[]> => {
    return (await selectTranscripts(args.assembly, transcriptParameters(args), db)).map(
        (result: TranscriptResult): TranscriptResult => ({ ...result, assembly: args.assembly, version: args.version })
    );
}

/**
 * Creates a data loader for loading a set of exons from the database given corresponding transcript IDs.
 * @param assembly the genomic assembly from which to load the exons.
 * @param loaders map of assemblies to cached data loaders used to load exons.
 */
export function transcriptExonLoader(args: TranscriptParameters, loaders: { [assembly: string]: TranscriptExonDataLoader }): TranscriptExonDataLoader {
    const key = `${args.assembly}_${args.version}`;
    if (!loaders[key]) loaders[key] = new DataLoader<string, ExonResult[]>(
        async (transcriptIDs: string[]): Promise<ExonResult[][]> => (
            groupById(transcriptIDs, (await selectExonsByTranscript(args.assembly, { version: args.version, id: transcriptIDs }, {}, db)).map(
                (result: ExonResult): ExonResult => ({ ...result, assembly: args.assembly, version: args.version })
            ), "parent_transcript")
        )
    );
    return loaders[key];
}

/**
 * Creates a data loader for loading a set of transcripts from the database given their IDs.
 * @param assembly the genomic assembly from which to load the transcripts.
 * @param loaders map of assemblies to cached data loaders used to load transcripts.
 */
export function transcriptLoader(assembly: string, loaders: { [assembly: string]: TranscriptDataLoader }): TranscriptDataLoader {
    if (!loaders[assembly]) loaders[assembly] = new DataLoader<string, TranscriptResult>(
        async (transcriptIDs: string[]): Promise<TranscriptResult[]> => (
            groupByKeySingle(
                transcriptIDs.map( (x: string): string => x.split('.')[0]),
                (await selectTranscripts(assembly, { idPrefix: transcriptIDs.map( (x: string): string => x.split('.')[0] ) }, db)).map(
                    (result: TranscriptResult): TranscriptResult => ({ ...result, assembly })
                ), (result: TranscriptResult): string => result.id.split('.')[0]
            )
        )
    );
    return loaders[assembly];
}

export const transcriptQueries = {
    transcript: transcriptQuery
};

export const transcriptResolvers = {
    Transcript: {
        exons: async (obj: TranscriptResult, parameters: any, context: any): Promise<ExonResult[]> => (
            transcriptExonLoader({ assembly: obj.assembly, version: obj.version, ...parameters }, context.exonLoaders).load(obj.id)
        ),
        __resolveReference: (reference: { id: string, assembly: string } | any, context: any) => (
            transcriptLoader(reference.assembly, context.transcriptLoaders).load(reference.id)
        ),
        intersecting_ccres: async (obj: TranscriptResult, parameters: { include_upstream?: number, include_downstream?: number } | any) => ({
            __typename: "IntersectingCCREs",
            assembly: obj.assembly!,
            chromosome: obj.chromosome,
            start: obj.start - (obj.strand === '-' ? parameters.include_downstream : parameters.include_upstream) || 0,
            end: obj.stop + (obj.strand === '-' ? parameters.include_upstream : parameters.include_downstream) || 0
        }),
        associated_ccres_pls: async (obj: TranscriptResult) => ({            
            __typename: "IntersectingCCREs", assembly: obj.assembly!, chromosome: obj.chromosome, start: (obj.strand === '-' ? obj.stop : obj.start) - 200, end: (obj.strand === '-' ? obj.stop : obj.start) + 200
        }),
        coordinates: resolveCoordinates
    }
};
