import { GraphQLFieldResolver } from 'graphql';
import { db, selectGenes, selectTranscripts } from '../postgres';
import { FeatureResult } from '../postgres/types';
import { GenomicRange } from '../types';

export interface ResolveParameters {
    assembly?: string;
    id?: string;
    limit?: number;
    [key: string]: any;
};

export interface GenomicObject {
    id: string;
    coordinates: GenomicRange;
    assembly: string;
    __typename: string;
}

function formatObject(x: FeatureResult, __typename: string, assembly: string): GenomicObject {
    return {
        ...x,
        coordinates: {
            chromosome: x.chromosome,
            start: x.start,
            end: x.stop
        },
        assembly,
        __typename
    };
}

const resolveQuery: GraphQLFieldResolver<{}, {}, ResolveParameters> = async (_, args): Promise<GenomicObject[]> => {
    const g = (await selectGenes(args.assembly!, { idPrefix: [ args.id! ] }, db)).map(x => formatObject(x, "Gene", args.assembly!));
    const t = (await selectTranscripts(args.assembly!, { idPrefix: [ args.id! ] }, db)).map(x => formatObject(x, "Transcript", args.assembly!));
    return [
        ...(g.length > 0 ? g : (await selectGenes(args.assembly!, { id: [ args.id! ], limit: args.limit }, db)).map(x => formatObject(x, "Gene", args.assembly!))),
        ...(await selectGenes(args.assembly!, { name: [ args.id! ], limit: args.limit }, db)).map(x => formatObject(x, "Gene", args.assembly!)),
        ...(t.length > 0 ? t : (await selectTranscripts(args.assembly!, { id: [ args.id! ], limit: args.limit }, db)).map(x => formatObject(x, "Transcript", args.assembly!))),
        ...(await selectTranscripts(args.assembly!, { name: [ args.id! ], limit: args.limit }, db)).map(x => formatObject(x, "Transcript", args.assembly!))
    ].slice(0, args.limit);
}

const suggestQuery: GraphQLFieldResolver<{}, {}, ResolveParameters> = async (_, args): Promise<GenomicObject[]> => {
    return [
        ...(await selectGenes(args.assembly!, { idPrefix: [ args.id! ], limit: args.limit }, db)).map(x => formatObject(x, "Gene", args.assembly!)),
        ...(await selectTranscripts(args.assembly!, { idPrefix: [ args.id! ], limit: args.limit }, db)).map(x => formatObject(x, "Transcript", args.assembly!)),
        ...(await selectGenes(args.assembly!, { name_prefix: [ args.id! ], limit: args.limit }, db)).map(x => formatObject(x, "Gene", args.assembly!)),
        ...(await selectTranscripts(args.assembly!, { name_prefix: [ args.id! ], limit: args.limit }, db)).map(x => formatObject(x, "Transcript", args.assembly!))
    ].slice(0, args.limit);
}

export const resolveQueries = {
    resolve: resolveQuery,
    suggest: suggestQuery
};
