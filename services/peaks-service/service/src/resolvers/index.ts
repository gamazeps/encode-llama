import { GraphQLResolverMap } from "apollo-graphql";
import { assemblyQueries, assemblyResolvers } from "./assembly";
import { biosampleQueries, biosampleResolvers } from "./biosample";
import { datasetQueries, datasetResolvers } from "./dataset";
import { peaksQueries, peaksResolvers } from "./peaks";
import { speciesQueries, speciesResolvers } from "./species";
import { targetQueries, targetResolvers } from "./target";

export const resolvers: GraphQLResolverMap = {
    Query: {
        ...assemblyQueries,
        ...biosampleQueries,
        ...datasetQueries,
        ...peaksQueries,
        ...speciesQueries,
        ...targetQueries
    },
    ...assemblyResolvers,
    ...biosampleResolvers,
    ...datasetResolvers,
    ...peaksResolvers,
    ...speciesResolvers,
    ...targetResolvers
}