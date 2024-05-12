import { db, selectAllSpecies, selectSpeciesFromDatasets, DatasetSelectionParameters, selectDatasets } from "../postgres";
import { SpeciesRow, DatasetCollection } from "../postgres/types";
import { GraphQLFieldResolver } from "graphql";
import { mapDataset } from "./dataset";
import DataLoader from "dataloader";
import { ALLOWED_ASSAYS } from "./utils";

async function speciesQuery(obj: any, parameters: DatasetSelectionParameters | any): Promise<SpeciesRow[]> {
    const searchTerm = parameters.searchterm && parameters.searchterm.length > 0 ? parameters.searchterm : ["chip-seq"];

    const keys = searchTerm.filter((x: string) => x && ALLOWED_ASSAYS.has).map((gt: any) => {
        return {
            assay: gt.replace("-", "_"),
            ...parameters
        };
    });
    const results = (await speciesDataLoader.loadMany(keys)).flat();
    return results;
}
const speciesDataLoader = new DataLoader<DatasetSelectionParameters | any, SpeciesRow[]>(async (keys: any) => {
    const res: SpeciesRow[][] = [];
    for (var i = 0; i < keys.length; i++) {
        if (keys[i] && Object.keys(keys[i]).length > 2) {
            const results = await selectSpeciesFromDatasets(keys[i], db);

            res[i] = results.map((r) => {
                return {
                    ...r,
                    assay: keys[i].assay,
                    parameters: keys[i]
                };
            });
        } else {
            const results = await selectAllSpecies(db, keys[i].assay);

            res[i] = results.map((r) => {
                return {
                    ...r,
                    assay: keys[i].assay,
                    parameters: keys[i]
                };
            });
        }
    }
    return res;
});

const datasetsQuery: GraphQLFieldResolver<SpeciesRow, {}> = async (source): Promise<DatasetCollection> => {
    const parameters: DatasetSelectionParameters = {
        ...source.parameters,
        species: source.name,
        assay: source.assay !== undefined ? source.assay : "chip-seq"
    };
    const datasets = await selectDatasets(parameters, db);
    return {
        parameters,
        datasets: datasets.map(mapDataset)
    };
};

export const speciesQueries = {
    species: speciesQuery
};

export const speciesResolvers = {
    Species: {
        datasets: datasetsQuery
    }
};
