import { GenomicRange, GTExQTLParameters, GTExQTLResult } from '../postgres/types';
import { db, select_eQTLs, select_cQTLs, select_GTEx_eQTLs } from '../postgres';
import { QTLParameters, QTLResult } from '../postgres/types';
import DataLoader from 'dataloader';
import { groupByKey } from './utilities';

async function eQTLQuery(_: any, parameters: QTLParameters | any): Promise<QTLResult[]> {
    return select_eQTLs(parameters.assembly, parameters, db);
}

async function cQTLQuery(_: any, parameters: QTLParameters | any): Promise<QTLResult[]> {
    return select_cQTLs(parameters.assembly, parameters, db);
}

async function gtexQTLQuery(_: any, parameters: GTExQTLParameters | any): Promise<GTExQTLResult[]> {
    return select_GTEx_eQTLs(parameters, db);
}

export type GTExDataLoader = DataLoader<GTExQTLParameters, GTExQTLResult[]>;

/**
 * Creates a data loader for loading GTEx eQTLs for a given list of coordinates.
 * @param assembly the genomic assembly from which to load the SNPs.
 */
function gtexDataLoader(assembly: string): GTExDataLoader {
    return new DataLoader<GTExQTLParameters, GTExQTLResult[]>( async (args: GTExQTLParameters[]): Promise<GTExQTLResult[][]> => {
        if (args.length === 0) return [];
        const coordinates = args.map(x => x.coordinates![0]);
        const keys = args.map( c => `${c.coordinates![0].chromosome}:${c.coordinates![0].start}` );
        return groupByKey(keys, await select_GTEx_eQTLs({ ...args[0], coordinates, assembly }, db), x => `${x.chromosome}:${x.position}`);
    });
}

/**
 * Returns a data loader for loading GTEx eQTLs from a given assembly given coordinates. If a loader does not already exist for
 * the given assembly, it will be created and saved for later reuse.
 * @param assembly the genomic assembly from which to load the eQTLs.
 */
export function gtexLoader(assembly: string, loaders: { [key: string]: GTExDataLoader }): GTExDataLoader {
    if (!loaders[assembly]) loaders[assembly] = gtexDataLoader(assembly);
    return loaders[assembly];
}

function resolveCoordinates(obj: QTLResult): GenomicRange {
    return {
	    chromosome: obj.chromosome,
	    start: obj.start,
	    end: obj.stop
    };
}

function resolvePeakCoordinates(obj: QTLResult): GenomicRange {
    const split = obj.peak_id!.split(':');
    const s = split[1].split('-')
    return {
        chromosome: split[0],
        start: +s[0],
        end: +s[1]
    };
}

export const eQTLQueries = {
    eQTLQuery,
    cQTLQuery,
    gtexQTLQuery
}

export const eQTLResolvers = {
    eQTL: {
	    coordinates: resolveCoordinates
    },
    cQTL: {
        coordinates: resolveCoordinates,
        peak_coordinates: resolvePeakCoordinates
    }
};
