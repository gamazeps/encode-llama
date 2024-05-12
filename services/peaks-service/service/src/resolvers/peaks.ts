import {
    db,
    selectPeaks,
    selectPeaksByRange,
    PeaksSelectionParameters,
    PeaksByRangeSelectionParameters,
    selectDatasetCountsByTarget,
    selectPeakCount
} from "../postgres";
import { UserInputError } from "apollo-server-core";
import { PeaksCollection, TargetPeaksPartitionCollection, AnyPeaksCollection, PeakCountRow, PeakCountParameters } from "../postgres/types";
import { GraphQLFieldResolver } from "graphql";
import DataLoader from "dataloader";
import { Peak } from "../postgres/types";
import { GraphQLScalarType } from "graphql";
import { ALLOWED_ASSAYS, wrapRequest } from "./utils";
import { datasetFilesDataLoader } from "./dataset";

async function peakCount(obj: any, parameters: PeakCountParameters | any): Promise<{ count: number }> {
    return { count: await selectPeakCount(parameters.assay, parameters.assembly, db) };
}

async function peaksQuery(obj: any, parameters: PeaksSelectionParameters | any): Promise<PeaksCollection> {
    if (parameters.assembly === undefined) {
        throw new UserInputError("assembly required for peaks query.");
    }
    if (parameters.range === undefined) {
        throw new UserInputError("Atleast one chrom, chrom_start, and chrom_end range is required for peaks query.");
    }
    const searchTerm = parameters.searchterm && parameters.searchterm.length > 0 ? parameters.searchterm : ["chip-seq"];
    let keys: any = [];
    searchTerm.filter((x: string) => x && ALLOWED_ASSAYS.has).forEach((gt: any) => {
        keys.push({
            ...parameters,
            assay: gt.replace("-", "_")
        });
    });
    const results = (await peaksDataLoader.loadMany(keys)).flat();
    return {
        parameters: parameters,
        peaks: results
    };
}

async function peaksrangeQuery(obj: any, parameters: PeaksByRangeSelectionParameters | any): Promise<any> {
    if (parameters.assembly === undefined) {
        throw new UserInputError("assembly required for peaks query.");
    }
    if (parameters.range === undefined) {
        throw new UserInputError("chrom, chrom_start, and chrom_end required for peaks range query.");
    }
    const searchTerm = parameters.searchterm && parameters.searchterm.length > 0 ? parameters.searchterm : ["chip-seq"];
    let keys: any = [];
    searchTerm.filter((x: string) => x && ALLOWED_ASSAYS.has).forEach((gt: any) => {
        keys.push({
            ...parameters,
            assay: gt.replace("-", "_")
        });
    });
    let read: () => Promise<any>;
    read = async () => {
        return await selectPeaksByRange({ ...parameters, assay: "chip_seq" }, db);
    };
    return wrapRequest(read);
}

/*const peaksrangeDataLoader = new DataLoader<PeaksByRangeSelectionParameters, string[]>(async (keys: any) => {
    const res: string[][] = [];
    for (var i = 0; i < keys.length; i++) {
        const results = await selectPeaksByRange(keys[i], db);   
        res[i] = results;
    }
   
    return res;
});*/

const peaksDataLoader = new DataLoader<PeaksSelectionParameters, Peak[]>(async (keys: any) => {
    const res: Peak[][] = [];
    for (var i = 0; i < keys.length; i++) {
        const results = await selectPeaks(keys[i], db);
        res[i] = results;
    }
    return res;
});

export const partitionByTarget: GraphQLFieldResolver<PeaksCollection, {}, { name?: string }> = (source, args) => {
    const ret = source.peaks.reduce(
        (obj, d) => {
            const target = d.dataset.target || "No target";
            if ("name" in args && args.name !== target) {
                return obj;
            }
            const collection =
                obj[target] ||
                (obj[target] = {
                    parameters: { ...source.parameters, target: d.dataset.target === null ? undefined : d.dataset.target },
                    target: d.dataset.target ? { name: d.dataset.target } : null,
                    peaks: []
                });
            collection.peaks.push(d);
            return obj;
        },
        {} as Record<string, TargetPeaksPartitionCollection>
    );
    return Object.values(ret);
};
const peakCountsQuery: GraphQLFieldResolver<TargetPeaksPartitionCollection, {}> = async (source): Promise<PeakCountRow> => {
    const res = await selectDatasetCountsByTarget(
        db,
        source.target ? source.target.name : null,
        source.parameters.searchterm && source.parameters.searchterm.length > 0 ? source.parameters.searchterm.filter((x: string) => x && ALLOWED_ASSAYS.has) : ["chip-seq"]
    );
    return {
        total: res,
        peaks: source.peaks.length
    };
};

export const peaksQueries = {
    peaks: peaksQuery,
    peaksrange: peaksrangeQuery,
    peakCount: peakCount
}

export const peaksResolvers = {
    PeaksResponseData: new GraphQLScalarType({
        name: "PeaksResponseData",
        description: "PeaksResponseData",
        serialize: (value) => value,
        parseValue: (value) => value,
        parseLiteral: (value) => value
    }),
    Peak: {
     async signal_over_peaks(reference : Peak) {
        let signal = await datasetFilesDataLoader.load({dataset_accession: reference.dataset.accession,type: "normalized_signal", filtered_assembly: reference.assembly, assay: reference.assay })
        if(signal && signal.length > 0)
        {            
            return { __typename: "BigResponseWithRange",  chrom : reference.chrom, start: reference.chrom_start, end: reference.chrom_end, url: signal[0].url};
        } else {
            return null
        }
        
    },
},
    PeaksCollection: {
        __resolveType: (obj: AnyPeaksCollection) => {
            if ("target" in obj) {
                return "TargetPeaksPartitionCollection";
            }
            return "PCollection";
        },
        count: peakCountsQuery,
        partitionByTarget
    }
};
