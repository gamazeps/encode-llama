import DataLoader from "dataloader";
import { GraphQLFieldResolver } from "graphql";

import { 
    selectDatasets, selectSignalFiles, 
    selectGeneQuantFiles, selectTranscriptQuantFiles 
} from '../postgres';
import { 
    Dataset, DatasetParameters, QuantificationFile, SignalFile,
    QuantificationFileParameters, SignalFileParameters 
} from '../postgres/datasets/types';
import { groupById } from "./utilities";
import { DEFAULT_QUANT_SOURCE } from "../constants";
import { ForbiddenError } from "apollo-server-express";
import { QuantificationDataSourceType, QuantificationDataSource } from "../postgres/types";
import { selectUserCollection } from "../postgres/user-collection/select";

export type SignalFileDataLoader = DataLoader<string, SignalFile[]>;
export type QuantificationFileDataLoader = DataLoader<string, QuantificationFile[]>;

const datasetQuery: GraphQLFieldResolver<{}, {}, DatasetParameters> = async (_, args, ctx: any): Promise<Dataset[]> => {
    const source: QuantificationDataSource = args.source ? args.source : DEFAULT_QUANT_SOURCE;
    if (source.type === QuantificationDataSourceType.USER) {
        const userCollection = await selectUserCollection(source.user_collection!);
        const uid = ctx.user ? ctx.user.uid : undefined;
        if (userCollection === undefined || 
                (userCollection.is_public !== true && userCollection.owner_uid !== uid)) {
            throw new ForbiddenError("You do not have access to this Collection");
        }
    }
    return selectDatasets(args);
}

/**
 * Creates a data loader for loading a set of transcript quantification files from the database given corresponding datasets.
 * @param assembly the genomic assembly from which to load the files.
 * @param loaders map of assemblies to cached data loaders used to load quantification files.
 */
export function geneQuantLoader(obj: Dataset, args: QuantificationFileParameters, 
        loaders: { [assembly: string]: QuantificationFileDataLoader }): QuantificationFileDataLoader {
    const source = args.source || obj.source || DEFAULT_QUANT_SOURCE;
    const key = `${args.assembly}_${source.type}:${source.user_collection||""}`;
    if (!loaders[key]) loaders[key] = new DataLoader<string, QuantificationFile[]>(
        async (accessions: string[]): Promise<QuantificationFile[][]> => {
            const files = await selectGeneQuantFiles(
                { dataset_accession: accessions, assembly: args.assembly, source });
            return groupById(accessions, files, "dataset_accession");
        }
    );
    return loaders[key];
}

/**
 * Creates a data loader for loading a set of transcript quantification files from the database given corresponding datasets.
 * @param assembly the genomic assembly from which to load the files.
 * @param loaders map of assemblies to cached data loaders used to load quantification files.
 */
export function transcriptQuantLoader(obj: Dataset, args: QuantificationFileParameters, 
        loaders: { [assembly: string]: QuantificationFileDataLoader }): QuantificationFileDataLoader {
    const source = args.source || obj.source || DEFAULT_QUANT_SOURCE;
    const key = `${args.assembly}_${source.type}:${source.user_collection||""}`;
    if (!loaders[key]) {
        loaders[key] = new DataLoader<string, QuantificationFile[]>(
            async (accessions: string[]): Promise<QuantificationFile[][]> => (
                groupById(accessions, (await selectTranscriptQuantFiles({ dataset_accession: accessions, assembly: args.assembly, source })).map(
                    (file: QuantificationFile): QuantificationFile => ({ ...file, source })
                ), "dataset_accession")
            )
        );
    }
    return loaders[key];
}

/**
 * Creates a data loader for loading a set of signal files from the database given corresponding datasets.
 * @param assembly the genomic assembly from which to load the files.
 * @param loaders map of assemblies to cached data loaders used to load signal files.
 */
export function signalLoader(obj: Dataset, args: SignalFileParameters, 
        loaders: { [assembly: string]: SignalFileDataLoader }): SignalFileDataLoader {
    const source = args.source || obj.source || DEFAULT_QUANT_SOURCE;
    if (!loaders[args.assembly!]) {
        loaders[args.assembly!] = new DataLoader<string, SignalFile[]>(
            async (accessions: string[]): Promise<SignalFile[][]> => (
                groupById(accessions, await selectSignalFiles(
                    { dataset_accession: accessions, assembly: args.assembly, source }
                ), "dataset_accession")
            )
        );
    }
    return loaders[args.assembly!];
}

export const datasetQueries = {
    gene_dataset: datasetQuery
};

export const datasetResolvers = {
    GeneDataset: {
        signal_files: async (obj: Dataset, parameters: any, context: any): Promise<SignalFile[]> => (
            signalLoader(obj, parameters, context.signalLoaders).load(obj.accession)
        ),
        gene_quantification_files: async (obj: Dataset, parameters: any, context: any): Promise<QuantificationFile[]> => (
            geneQuantLoader(obj, parameters, context.geneQuantificationLoaders).load(obj.accession)
        ),
        transcript_quantification_files: async (obj: Dataset, parameters: any, context: any): Promise<QuantificationFile[]> => (
            transcriptQuantLoader(obj, parameters, context.transcriptQuantificationLoaders).load(obj.accession)
        )
    }
};
