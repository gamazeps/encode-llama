import { db, selectAllTargets, selectTargetsFromDatasets, DatasetSelectionParameters, selectDatasets } from "../postgres";
import { TargetRow, DatasetCollection } from "../postgres/types";
import { GraphQLFieldResolver } from "graphql";
import { mapDataset } from "./dataset";
import DataLoader from "dataloader";
import { ALLOWED_ASSAYS } from "./utils";

async function targetQuery(obj: any, parameters: DatasetSelectionParameters | any): Promise<TargetRow[]> {
    const searchTerm = parameters.searchterm && parameters.searchterm.length > 0 ? parameters.searchterm : ["chip-seq"];

    const keys = searchTerm.filter((x: string) => x && ALLOWED_ASSAYS.has).map((gt: any) => {
        return {
            assay: gt.replace("-", "_"),
            ...parameters
        };
    });
    const results = (await targetDataLoader.loadMany(keys)).flat();
    return results;
}
const targetDataLoader = new DataLoader<DatasetSelectionParameters | any, TargetRow[]>(async (keys: any) => {
    const res: TargetRow[][] = [];
    for (var i = 0; i < keys.length; i++) {
        if (keys[i] && Object.keys(keys[i]).length > 2) {
            const results = await selectTargetsFromDatasets(keys[i], db);
            res[i] = results.map((r) => {
                return {
                    ...r,
                    parameters: keys[i],
                    assay: keys[i].assay
                };
            });
        } else {
            const results = await selectAllTargets(db, keys[i].assay);
            res[i] = results.map((r) => {
                return {
                    ...r,
                    parameters: keys[i],
                    assay: keys[i].assay
                };
            });
        }
    }
    return res;
});

const datasetsQuery: GraphQLFieldResolver<TargetRow, {}> = async (source): Promise<DatasetCollection> => {
    const parameters: DatasetSelectionParameters = { ...source.parameters, target: source.name, assay: source.assay !== undefined ? source.assay : "chip-seq" };
    const datasets = await selectDatasets(parameters, db);
    return {
        parameters,
        datasets: datasets.map(mapDataset)
    };
};

export const targetQueries = {
    targets: targetQuery
};

export const targetResolvers = {
    Target: {
        datasets: datasetsQuery,
        target_desc(target: TargetRow) {
            if(target.parameters && target.parameters?.species==='Homo sapiens')
            {
                return { __typename: "Factor", name: target.name, assembly: "GRCh38"};
            } else if(target.parameters && target.parameters?.species==='Mus musculus')            
            {
                return { __typename: "Factor", name: target.name, assembly: "mm10"};
            } else {
                return null
            }            
        }
    }
};
