import { datasetQueries, datasetResolvers } from './dataset';
import { exonResolvers } from './exon';
import { geneQuantificationQueries, geneQuantificationResolvers } from './gene-quantification';
import { geneQueries, geneResolvers } from './gene';
import { transcriptQuantificationQueries, transcriptQuantificationResolvers } from './transcript-quantification';
import { utrResolvers } from './utr';
import { transcriptQueries, transcriptResolvers } from './transcript';
import { GraphQLResolverMap } from "apollo-graphql";
import { userCollectionsMutations, userCollectionsQueries } from './user-collection';
import { userDatasetMutations } from './user-dataset';
import { userGeneQuantFilesMutations } from './user-gene-quant-files';
import { userTransQuantFilesMutations } from './user-transcript-quant-files';
import { resolveQueries } from './resolve';

export const resolvers: GraphQLResolverMap = {
    Query: {
        ...datasetQueries,
        ...geneQueries,
        ...geneQuantificationQueries,
        ...transcriptQuantificationQueries,
        ...userCollectionsQueries,
        ...resolveQueries,
        ...transcriptQueries
    },
    Mutation: {
        ...userCollectionsMutations,
        ...userDatasetMutations,
        ...userGeneQuantFilesMutations,
        ...userTransQuantFilesMutations
    },
    ...datasetResolvers,
    ...exonResolvers,
    ...geneQuantificationResolvers,
    ...geneResolvers,
    ...transcriptQuantificationResolvers,
    ...transcriptResolvers,
    ...utrResolvers
}