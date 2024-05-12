import DataLoader from "dataloader";

import { db, selectLD } from "../postgres";
import { LDResult, GenomicRange, SNPResultWithAssembly } from "../postgres/types";
import { LinkedSNP } from "./types";
import { groupById } from './utilities';
import { snpLoader, parseCoordinates } from './snp';

/**
 * Creates a data loader for loading LD information given a list of rsIDs.
 * @param population the population from which to load the LD information.
 */
function ldBlocksDataLoader(population: string): DataLoader<string, LinkedSNP[]> {
    const pop = population.split("_");
    return new DataLoader<string, LinkedSNP[]>( async (snpids: string[]): Promise<LinkedSNP[][]> => (
        groupById(snpids, await selectLD({ population: pop[0], snpids, subpopulation: pop[1] }, db), "snp1").map(
            (links: LDResult[]): LinkedSNP[] => (
                links.length === 0 ? [] : links[0].ldlinks.split(';').filter(s => s !== "").map(parseLDLink)
            )
        )
    ));
}

/**
 * Returns a data loader for loading LD blocks from a given population given rsIDs. If a loader does not already exist
 * for the given population, it will be created and saved for later reuse.
 * @param population the population from which to load the SNPs.
 */
export function ldLoader(population: string,
                         loaders: { [key: string]: DataLoader<string, LinkedSNP[]> }, subpopulation?: string): DataLoader<string, LinkedSNP[]> {
    const pop = subpopulation ? `${population}_${subpopulation}` : population;
    if (!loaders[pop]) loaders[pop] = ldBlocksDataLoader(pop);
    return loaders[pop];
}

/**
 * Parses a string in LD link format (rsID,rSquared,dPrime).
 * @param link the LD link string to parse.
 */
function parseLDLink(link: string): LinkedSNP {
    const p = link.split(',');
    return {
        id: p[0],
        rSquared: +p[1],
        dPrime: +p[2]
    };
}

export const ldResolvers = {
    LinkedSNP: {
        coordinates: async (object: LinkedSNP, args: any, context: any): Promise<GenomicRange | null> => (
            parseCoordinates(await snpLoader(args.assembly, context.snpLoaders).load(object.id))
        ),
        snp: async (object: LinkedSNP, args: any, context: any): Promise<SNPResultWithAssembly | null> => (
            snpLoader(args.assembly, context.snpLoaders).load(object.id)
        )
    }
};
