import DataLoader from "dataloader";

import { db, selectUTRsByExon } from "../postgres";
import { ExonResult, ExonParameters, UTRResult } from "../postgres/types";
import { groupById, resolveCoordinates } from "./utilities";

export type ExonUTRDataLoader = DataLoader<string, UTRResult[]>;

/**
 * Creates a data loader for loading a set of UTRs from the database given corresponding transcript IDs.
 * @param assembly the genomic assembly from which to load the UTRs.
 * @param loaders map of assemblies to cached data loaders used to load UTRs.
 */
export function exonUTRLoader(args: ExonParameters, loaders: { [assembly: string]: ExonUTRDataLoader }): ExonUTRDataLoader {
    const key = `${args.assembly}_${args.version}`;
    if (!loaders[key]) loaders[key] = new DataLoader<string, UTRResult[]>(
        async (exonIDs: string[]): Promise<UTRResult[][]> => (
            groupById(exonIDs, (await selectUTRsByExon(args.assembly, { version: args.version, name: exonIDs }, {}, db)).map(
                (result: UTRResult): UTRResult => ({ ...result, assembly: args.assembly, version: args.version })
            ), "parent_exon")
        )
    );
    return loaders[key];
}

export const exonResolvers = {
    Exon: {
        UTRs: async (obj: ExonResult, parameters: any, context: any): Promise<UTRResult[]> => (
            exonUTRLoader({ assembly: obj.assembly, version: obj.version, ...parameters }, context.utrLoaders).load(obj.name)
        ),
        coordinates: resolveCoordinates
    }
};
