import { GraphQLFieldResolver } from "graphql";
import { db } from "../postgres";
import { select_cCREs } from "../postgres/ccre";
import { select_rDHSs } from "../postgres/rdhs";
import { GenomicRange, CCREEntry, RDHSEntry } from "../postgres/types";

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

function formatObject(x: CCREEntry | RDHSEntry, __typename: string, assembly: string): GenomicObject {
    return {
        id: x.accession,
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

/** Loads cCRE and rDHS results for a given set of input parameters */
const resolveQuery: GraphQLFieldResolver<{}, {}, ResolveParameters> = async (_, args): Promise<GenomicObject[]> => {
    const assembly = args.assembly!.toLocaleLowerCase();
    return [
        ...(await select_cCREs({ assembly: assembly, accession: [ args.id! ], limit: args.limit }, db)).map(x => formatObject(x, "CCRE", args.assembly!)),
        ...(await select_rDHSs({ assembly: assembly, accession: [ args.id! ], limit: args.limit }, db)).map(x => formatObject(x, "RDHS", args.assembly!))
    ];
};

const suggestQuery: GraphQLFieldResolver<{}, {}, ResolveParameters> = async (_, args): Promise<GenomicObject[]> => {
    const assembly = args.assembly!.toLocaleLowerCase();
    return [
        ...(await select_cCREs({ assembly: assembly, accession_prefix: [ args.id! ], limit: args.limit }, db)).map(x => formatObject(x, "CCRE", args.assembly!)),
        ...(await select_rDHSs({ assembly: assembly, accession_prefix: [ args.id! ], limit: args.limit }, db)).map(x => formatObject(x, "RDHS", args.assembly!))
    ];
};

export const resolveQueries = {
    resolve: resolveQuery,
    suggest: suggestQuery
};
