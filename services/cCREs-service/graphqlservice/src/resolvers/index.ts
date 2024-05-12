import { GraphQLResolverMap } from "apollo-graphql";

import { ccREBiosampleQuery, biosampleResolvers } from "./biosample";
import { cCREQuery, cCREResolvers, linkedGenesQuery, SCREENSearchResultQuery } from "./ccre";
import { ldrQueryResolvers, ldrResolvers } from "./ldr";
import { rDHSQuery, rDHSResolvers } from "./rdhs";
import { resolveQueries } from "./resolve";
import { zScoreQuery, zScoreResolvers } from "./zscore";
import { groundLevelVersionsQuery } from "./versions";
import { orthologQuery } from "./ortholog";

export const resolvers: GraphQLResolverMap = {
    Query: {
        cCREQuery,
        linkedGenesQuery,
        rDHSQuery,
        zScoreQuery,
        ccREBiosampleQuery,
        groundLevelVersionsQuery,
        orthologQuery,
        cCRESCREENSearch: SCREENSearchResultQuery,
        ...ldrQueryResolvers,
        ...resolveQueries
    },
    ...cCREResolvers,
    ...rDHSResolvers,
    ...zScoreResolvers,
    ...biosampleResolvers,
    ...ldrResolvers
};
