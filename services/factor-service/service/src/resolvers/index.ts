import { factorQueries } from "./factor";
import { celltypeQueries } from "./celltype";
import { GraphQLResolverMap } from "apollo-graphql";
import { selectFactorByName } from "../postgres/factor";
import { db } from "../postgres/connection";

export const resolvers: GraphQLResolverMap = {
    Factor: {
        async __resolveReference(reference) {
          return selectFactorByName({ name: reference.name, assembly: reference.assembly}, db);
        }
      },
    Query: {
        ...factorQueries,
        ...celltypeQueries
    }
};
