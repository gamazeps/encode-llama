import { GraphQLFieldResolver } from "graphql";
import { db, selectSNPs, selectSnpsSuggestionsbyId } from "../postgres";
import { GenomicRange, SNPResult } from "../postgres/types";

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

function formatObject(x: SNPResult, __typename: string, assembly: string): GenomicObject {
    return {
        id: x.snp,
        ...x,
        coordinates: {
            chromosome: x.chrom,
            start: x.start,
            end: x.stop
        },
        assembly,
        __typename
    };
}

/** Loads SNP results for a given set of input parameters */
const resolveQuery: GraphQLFieldResolver<{}, {}, ResolveParameters> = async (_, args): Promise<GenomicObject[]> => {
    return (await selectSNPs({ assembly: args.assembly, snpids: [ args.id! ], limit: args.limit }, db)).map(x => formatObject(x, "SNP", args.assembly!));
};

const suggestQuery: GraphQLFieldResolver<{}, {}, ResolveParameters> = async (_, args): Promise<GenomicObject[]> => {
    return (await selectSnpsSuggestionsbyId({ assembly: args.assembly!, snpid: args.id!, limit: args.limit }, db)).map(x => formatObject(x, "SNP", args.assembly!));
};

export const resolveQueries = {
    resolve: resolveQuery,
    suggest: suggestQuery
};
