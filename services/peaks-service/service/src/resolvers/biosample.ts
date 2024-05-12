import { db, selectAllBiosamples, selectBiosamplesFromDatasets, DatasetSelectionParameters, selectDatasets } from "../postgres";
import { BiosampleRow, DatasetCollection } from "../postgres/types";
import { GraphQLFieldResolver } from "graphql";
import { mapDataset } from "./dataset";
import DataLoader from "dataloader";
import { ALLOWED_ASSAYS } from "./utils";

async function biosampleQuery(obj: any, parameters: DatasetSelectionParameters | any): Promise<BiosampleRow[]> {
    const searchTerm = parameters.searchterm && parameters.searchterm.length > 0 ? parameters.searchterm : ["chip-seq"];

    const keys = searchTerm.filter((x: string) => x && ALLOWED_ASSAYS.has).map((gt: any) => {
        return {
            assay: gt.replace("-", "_"),
            ...parameters
        };
    });
    const results = (await biosampleDataLoader.loadMany(keys)).flat();
    return results;
}
const biosampleDataLoader = new DataLoader<DatasetSelectionParameters | any, BiosampleRow[]>(async (keys: any) => {
    const res: BiosampleRow[][] = [];
    for (var i = 0; i < keys.length; i++) {
        if (keys[i] && Object.keys(keys[i]).length > 2) {
            const results = await selectBiosamplesFromDatasets(keys[i], db);
            res[i] = results.map((r) => {
                return {
                    ...r,
                    assay: keys[i].assay,
                    parameters: keys[i]
                };
            });
        } else {
            const results = await selectAllBiosamples(db, keys[i].assay);
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
const datasetsQuery: GraphQLFieldResolver<BiosampleRow, {}> = async (source): Promise<DatasetCollection> => {
    const parameters: DatasetSelectionParameters = {
        ...source.parameters,
        biosample: source.name,
        species: source.species,
        assay: source.assay !== undefined ? source.assay : "chip-seq"
    };
    const datasets = await selectDatasets(parameters, db);
    return {
        parameters,
        datasets: datasets.map(mapDataset)
    };
};

export const biosampleQueries = {
    biosamples: biosampleQuery
};

export const biosampleResolvers = {
    Biosample: {
        datasets: datasetsQuery
    }
};
