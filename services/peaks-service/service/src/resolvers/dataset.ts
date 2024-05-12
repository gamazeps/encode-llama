import { db, selectDatasetCounts, selectDatasets, DatasetSelectionParameters, PeaksSelectionParameters, selectPeaks } from "../postgres";
import {
    DatasetCollection,
    Dataset,
    DatasetCountRow,
    FileType,
    FileRow,
    DatasetFile,
    DatasetRow,
    TargetPartitionCollection,
    BiosamplePartitionCollection,
    LabPartitionCollection,
    AnyDatasetCollection,
    UnreplicatedPeaks,
    Peak,
    BigBedUnreplicatedPeaks
} from "../postgres/types";
import { selectFiles } from "../postgres/dataset/selectfiles";
import { GraphQLFieldResolver } from "graphql";
import DataLoader from "dataloader";
import { UserInputError } from "apollo-server-core";
import { selectDatasetsByAccessions } from "../postgres/dataset/select";
import { DateScalar } from "./date";
import { PeaksSelectionParametersFromFile } from "../postgres/peaks/types";
import { IResolvers } from "graphql-tools";
import { ALLOWED_ASSAYS } from "./utils";

/**
 * Converts a file returned by a DatasetWithFile query to its corresponding file object.
 * @param row the row returned from the database.
 */
function _fileObject(row: FileRow, dataset: Dataset): DatasetFile {
    switch (row.filetype) {
        case "sequence_reads":
            return {
                accession: row.fileaccession,
                dataset,
                type: "sequence_reads",
                paired_end: row.paired_end!,
                read_id: row.read_id!,
                biorep: row.biorep!,
                techrep: row.techrep!,
                assay: row.assay,
                url: row.url
            };
        case "unfiltered_alignments":
            return {
                accession: row.fileaccession,
                dataset,
                type: "unfiltered_alignments",
                assembly: { name: row.fileassembly!, species: dataset.species },
                biorep: row.biorep!,
                techrep: row.techrep!,
                assay: row.assay,
                url: row.url
            };
        case "filtered_alignments":
            return {
                accession: row.fileaccession,
                dataset,
                type: "filtered_alignments",
                assembly: { name: row.fileassembly!, species: dataset.species },
                biorep: row.biorep!,
                techrep: row.techrep!,
                assay: row.assay,
                url: row.url
            };
        case "unreplicated_peaks":
            return {
                accession: row.fileaccession,
                dataset,
                type: "unreplicated_peaks",
                assembly: { name: row.fileassembly!, species: dataset.species },
                biorep: row.biorep!,
                techrep: row.techrep!,
                assay: row.assay,
                url: row.url
            };
        case "replicated_peaks":
            return {
                accession: row.fileaccession,
                dataset,
                type: "replicated_peaks",
                assembly: { name: row.fileassembly!, species: dataset.species },
                assay: row.assay,
                url: row.url
            };
        case "bigbed_unreplicated_peaks":
            return {
                accession: row.fileaccession,
                dataset,
                type: "bigbed_unreplicated_peaks",
                assembly: { name: row.fileassembly!, species: dataset.species },
                biorep: row.biorep!,
                techrep: row.techrep!,
                assay: row.assay,
                url: row.url
            };
        case "bigbed_replicated_peaks":
            return {
                accession: row.fileaccession,
                dataset,
                type: "bigbed_replicated_peaks",
                assembly: { name: row.fileassembly!, species: dataset.species },
                assay: row.assay,
                url: row.url
            };            
        case "normalized_signal":
            return {
                accession: row.fileaccession,
                dataset,
                type: "normalized_signal",
                assembly: { name: row.fileassembly!, species: dataset.species },
                assay: row.assay,
                url: row.url
            };
    }
    throw "unrecognized file type " + row.filetype;
}

export const mapDataset = (row: DatasetRow): Dataset => {
    return {
        accession: row.accession,
        target: row.target,
        released: row.released,
        project: row.project,
        source: row.source,
        biosample: row.biosample,
        lab: {
            name: row.lab_name,
            friendly_name: row.lab_friendly_name
        },
        species: row.species,
        assay: row.assay,
        developmental_slims: row.developmental_slims,
        cell_slims: row.cell_slims,
        organ_slims: row.organ_slims,
        system_slims: row.system_slims
        
    };
};

async function datasetQuery(obj: any, parameters: DatasetSelectionParameters | any, context: any, info: any): Promise<DatasetCollection> {
    const searchTerm = parameters.searchterm && parameters.searchterm.length > 0 ? parameters.searchterm : ["chip-seq"];
    const keys = searchTerm.filter((x: string) => x && ALLOWED_ASSAYS.has).map((gt: any) => {
        return {
            assay: gt.replace("-", "_"),
            ...parameters
        };
    });
    const results = (await datasetDataLoader.loadMany(keys)).flat();

    return {
        parameters,
        datasets: results
    };
}
const datasetDataLoader = new DataLoader<DatasetSelectionParameters, Dataset[]>(async (keys: any) => {
    const res: Dataset[][] = [];
    for (var i = 0; i < keys.length; i++) {
        let results = await selectDatasets(keys[i], db);
        res[i] = results.map((r) => {
            return { ...mapDataset({...r,assay: keys[i].assay}), assay: keys[i].assay };
        });
    }
    return res;
});
//Done
const datasetCountsQuery: GraphQLFieldResolver<DatasetCollection, {}> = async (source): Promise<DatasetCountRow> => {
    const dataset_accessions = source.datasets.map((dataset) => dataset.accession);

    return selectDatasetCounts(
        dataset_accessions,
        db,
        source.parameters.searchterm && source.parameters.searchterm.length > 0
            ? source.parameters.searchterm.filter((x: string) => x && ALLOWED_ASSAYS.has)
            : source.parameters.assay && ALLOWED_ASSAYS.has(source.parameters.assay)
            ? [source.parameters.assay]
            : ["chip-seq"]
    );
};

export const datasetFilesDataLoader = new DataLoader<{ dataset_accession: string; type: FileType; filtered_assembly?: string; assay?: string }, FileRow[]>(
    async (keys) => {
        // There may be multiple file types per dataset. DataLoader requires every dataset/filetype pair to be in order by the key.
        // The query will select the given file types for all datasets, so keep a master list of file types.
        // (In general, this is also the most optimal solution query anyways, unless there are different file type selections across different dataset collections.)
        //
        // There also may be multiple assembly filters. These filters are treated as completely separate queries (no filter is also separate).
        const queries: Record<
            string,
            {
                selection: Record<string, { filetype: string; index: number }[]>;
                filetypes: Set<FileType>;
                datasets: Set<string>;
                assay: string;
            }
        > = {};
        keys.forEach((key, idx) => {
            const assembly = key.filtered_assembly || "NA";
            let { selection, filetypes, datasets, assay } =
                queries[assembly] ||
                (queries[assembly] = {
                    selection: {} as Record<string, { filetype: string; index: number }[]>,
                    filetypes: new Set(),
                    datasets: new Set(),
                    assay: key.assay!
                });
            const selections = selection[key.dataset_accession] || (selection[key.dataset_accession] = [] as { filetype: string; index: number }[]);
            selections.push({ filetype: key.type, index: idx });
            filetypes.add(key.type);
            datasets.add(key.dataset_accession);
        });
        const res: FileRow[][] = new Array(keys.length);
        for (const assembly of Object.keys(queries)) {
            const { selection, filetypes, datasets, assay } = queries[assembly];

            const dbres = await selectFiles(assembly === "NA" ? {} : { assembly }, Array.from(filetypes), assay, db, Array.from(datasets));
            const results: Record<string, Record<string, FileRow[]>> = {};
            dbres.forEach((row) => {
                const result = results[row.datasetaccession] || (results[row.datasetaccession] = {});
                const innerresult = result[row.filetype] || (result[row.filetype] = []);
                innerresult.push({ ...row, assay });
            });
            for (const dataset of Object.keys(selection)) {
                selection[dataset].forEach((sel) => {
                    res[sel.index] = (results[dataset] || {})[sel.filetype] || [];
                });
            }
        }
        return res;
    },
    {
        cacheKeyFn: (key) => `${key.dataset_accession}::${key.type}::${key.filtered_assembly || "NA"}`
    }
);

const FILE_TYPES: FileType[] = [
    "sequence_reads",
    "unfiltered_alignments",
    "filtered_alignments",
    "unreplicated_peaks",
    "replicated_peaks",
    "normalized_signal"
];
export const datasetFileQueryBatch: GraphQLFieldResolver<Dataset, {}, { types?: string[]; assembly?: string }> = async (source, args): Promise<DatasetFile[]> => {
    if (args.types) {
        const unknown = args.types.filter((type) => type in FILE_TYPES);
        if (unknown.length > 0) {
            throw new UserInputError(`Unknown file type: ${unknown[0]}`);
        }
    }
    const types = (args.types as FileType[]) || FILE_TYPES;
    const keys = types.map((type) => ({
        dataset_accession: source.accession,
        type: type,
        filtered_assembly: args.assembly,
        assay: source.assay
    }));
    const res: FileRow[] = (await datasetFilesDataLoader.loadMany(keys)).flat();
    return res.map((r) => _fileObject(r, source));
};

export const datasetLoader = new DataLoader<string, Dataset>(async (keys) => {
    const assay = "chip-seq";
    const datasets = await selectDatasetsByAccessions(keys as string[], db, assay);
    return datasets.map(mapDataset);
});

export const partitionByTarget: GraphQLFieldResolver<DatasetCollection, {}, { name?: string }> = (source, args) => {
    const ret = source.datasets.reduce(
        (obj, d) => {
            const target = d.target || "No target";
            if ("name" in args && args.name !== target) {
                return obj;
            }
            const collection =
                obj[target] ||
                (obj[target] = {
                    parameters: { ...source.parameters, target: d.target },
                    target: d.target ? { name: d.target } : null,
                    datasets: []
                });
            collection.datasets.push(d);
            return obj;
        },
        {} as Record<string, TargetPartitionCollection>
    );
    return Object.values(ret);
};

export const partitionByBiosample: GraphQLFieldResolver<DatasetCollection, {}, { name?: string }> = (source, args) => {
    const ret = source.datasets.reduce(
        (obj, d) => {
            if ("name" in args && args.name !== d.biosample) {
                return obj;
            }
            const collection =
                obj[d.biosample] ||
                (obj[d.biosample] = {
                    parameters: { ...source.parameters, biosample: d.biosample },
                    biosample: { name: d.biosample, species: d.species },
                    datasets: []
                });
            collection.datasets.push(d);
            return obj;
        },
        {} as Record<string, BiosamplePartitionCollection>
    );
    return Object.values(ret);
};

export const partitionByLab: GraphQLFieldResolver<DatasetCollection, {}, { name?: string }> = (source, args) => {
    const ret = source.datasets.reduce(
        (obj, d) => {
            if ("name" in args && (args.name !== d.lab.name && args.name !== d.lab.friendly_name)) {
                return obj;
            }
            if (d.lab.name != null) {
                const collection =
                    obj[d.lab.name] ||
                    (obj[d.lab.name] = {
                        parameters: { ...source.parameters, lab: d.lab.name },
                        lab: d.lab,
                        datasets: []
                    });
                collection.datasets.push(d);
            }

            return obj;
        },
        {} as Record<string, LabPartitionCollection>
    );
    return Object.values(ret);
};

export const peaksQuery: GraphQLFieldResolver<UnreplicatedPeaks | BigBedUnreplicatedPeaks, {}, PeaksSelectionParametersFromFile> = (source, args): Promise<Peak[]> => {
    if (args.chrom === undefined || args.chrom_start === undefined || args.chrom_end === undefined) {
        throw new UserInputError("chrom, chrom_start, and chrom_end required for peaks query.");
    }
    return selectPeaks(
        {
            ...args,
            range: [{ chrom: args.chrom, chrom_start: args.chrom_start, chrom_end: args.chrom_end }],
            file_accession: source.accession,
            assembly: source.assembly.name,
            assay: source.assay
        },
        db
    );
};

export const datasetQueries = {
    peakDataset: datasetQuery
};

const collectionCommonResolver = {
    counts: datasetCountsQuery,
    partitionByBiosample,
    partitionByTarget,
    partitionByLab
}

export const datasetResolvers: IResolvers = {
    DateScalar,
    DatasetCollection: {
        __resolveType: (obj: AnyDatasetCollection) => {
            if ("biosample" in obj) {
                return "BiosamplePartitionCollection";
            }
            if ("target" in obj) {
                return "TargetPartitionCollection";
            }
            if ("lab" in obj) {
                return "LabPartitionCollection";
            }
            return "Collection";
        }
    },
    BiosamplePartitionCollection: collectionCommonResolver,
    TargetPartitionCollection: collectionCommonResolver,
    LabPartitionCollection: collectionCommonResolver,
    Collection: collectionCommonResolver,
    PeakDataset: {
        __resolveReference: (reference: { accession: string }): Promise<Dataset> => {
            return datasetLoader.load(reference.accession);
        },
        files: datasetFileQueryBatch
    },
    File: {
        __resolveType: (obj: DatasetFile) => {
            switch (obj.type) {
                case "sequence_reads":
                    return "SequenceReads";
                case "unfiltered_alignments":
                    return "UnfilteredAlignments";
                case "filtered_alignments":
                    return "FilteredAlignments";
                case "unreplicated_peaks":
                    return "UnreplicatedPeaks";
                case "replicated_peaks":
                    return "ReplicatedPeaks";
                case "bigbed_unreplicated_peaks":
                    return "BigBedUnreplicatedPeaks";
                case "bigbed_replicated_peaks":
                    return "BigBedReplicatedPeaks";    
                case "normalized_signal":
                    return "NormalizedSignal";
            }
        }
    },
    UnreplicatedPeaks: {
        peaks: peaksQuery as any
    },
    BigBedUnreplicatedPeaks: {
        peaks: peaksQuery as any
    }
};
