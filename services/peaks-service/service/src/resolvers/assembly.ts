import { db, selectAssemblies, DatasetSelectionParameters, selectDatasets } from "../postgres";
import { AssemblyRow, DatasetCollection } from "../postgres/types";
import { GraphQLFieldResolver } from "graphql";
import { mapDataset } from "./dataset";
import DataLoader from "dataloader";
import { ALLOWED_ASSAYS } from "./utils";

const assemblyQuery: GraphQLFieldResolver<{}, {}, { species?: string; assembly?: string; searchterm?: string[] }> = async (
    source,
    args
): Promise<AssemblyRow[]> => {
    const searchTerm = args.searchterm && args.searchterm.length > 0 ? args.searchterm : ["chip-seq"];
    const keys = searchTerm.filter((x: string) => x && ALLOWED_ASSAYS.has).map((gt: any) => {
        return {
            assay: gt.replace("-", "_"),
            ...args
        };
    });
    const results = (await assemblyDataLoader.loadMany(keys)).flat();
    return results;
};
const assemblyDataLoader = new DataLoader<{ species?: string; assembly?: string; assay?: string }, AssemblyRow[]>(async (keys: any) => {
    const res: AssemblyRow[][] = [];
    for (var i = 0; i < keys.length; i++) {
        const results = await selectAssemblies(keys[i], db);
        res[i] = results.map((r) => {
            return {
                ...r,
                assay: keys[i].assay,
                parameters: keys[i]
            };
        });
    }
    return res;
});

const datasetsQuery: GraphQLFieldResolver<AssemblyRow, {}> = async (source): Promise<DatasetCollection> => {
    if (source.assay && !ALLOWED_ASSAYS.has(source.assay)) throw new Error(`assay ${source.assay} is not valid`);
    const parameters: DatasetSelectionParameters = {
        ...source.parameters,
        processed_assembly: source.name,
        assay: source.assay !== undefined ? source.assay : "chip-seq"
    };
    const datasets = await selectDatasets(parameters, db);
    return {
        parameters,
        datasets: datasets.map(mapDataset)
    };
};

export const assemblyQueries = {
    assemblies: assemblyQuery
};

export const assemblyResolvers = {
    Assembly: {
        datasets: datasetsQuery
    }
};
