import DataLoader from "dataloader";
import { associateBy } from "queryz";
import { db } from "../postgres";
import { select_rDHSs } from "../postgres/rdhs";
import { RDHSEntry, RDHSParemeters } from "../postgres/types";
import { maxZScoreLoader, zScoreLoader } from "./zscore";
import { Config } from "../init";
import { select_active_in_biosamples } from "../postgres/zscore";

export async function rDHSQuery(_: any, parameters: RDHSParemeters | any, context: { config: Config } | any): Promise<RDHSEntry[]> {
    const r = (await select_rDHSs(parameters, db)).map( x => ({ ...x, assembly: parameters.assembly.toLocaleLowerCase() }));
    if (!parameters.activeInBiosamples && !parameters.activeInAnyBiosample) return r;
    const v = await select_active_in_biosamples({ experiment: parameters.activeInBiosamples || parameters.activeInAnyBiosample, rDHS: r.map(x => x.accession), assembly: parameters.assembly }, context.config, !!parameters.activeInAnyBiosample);
    const vv = new Set(v.map(x => x.accession));
    return r.filter(x => vv.has(x.accession));
};

export function rDHSLoader(assembly: string): DataLoader<string, RDHSEntry | undefined> {
    return new DataLoader(async (keys: string[]) => {
        const results = associateBy(
            await select_rDHSs({ accession: keys, assembly }, db),
            x => x.accession, x => x
        );
        return keys.map(k => results.get(k));
    });
}

export const rDHSResolvers = {
    RDHS: {
        id: (object: RDHSEntry) => object.accession,
        coordinates: (object: RDHSEntry) => ({
            chromosome: object.chromosome,
            start: object.start,
            end: object.stop
        }),
        zScores: async (object: RDHSEntry, parameters: { experiments: string[] } | any, context: { config: Config } | any) => {
            const key = object.assembly + ":" + (parameters.experiments || []).join(",");
            if (context.rDHSZScoreLoaders[key] === undefined) context.rDHSZScoreLoaders[key] = zScoreLoader(object.assembly!.toLocaleLowerCase(), parameters.experiments, context.config);
            return context.rDHSZScoreLoaders[key].load(object.accession);
        },
        maxZ: async (object: RDHSEntry, parameters: { assay: string } | any, context: { config: Config } | any) => {
            const key = `${object.assembly!}_${parameters.assay}`;
            if (context.rDHSmaxZScoreLoaders[key] === undefined)
                context.rDHSmaxZScoreLoaders[key] = maxZScoreLoader(object.assembly!, parameters.assay, context.config);
            return (await context.rDHSmaxZScoreLoaders[key].load(object.accession))?.score;
        },
        sequence: async (object: RDHSEntry, parameters: { half_width?: number } | any, context: { config: Config } | any) => {
            if (!parameters.half_width)
                return context.config.sequenceReaders[object.assembly!].readTwoBitData(object.chromosome, object.start, object.stop);
            const m = Math.round((object.start + object.start) / 2);
            return context.config.sequenceReaders[object.assembly!].readTwoBitData(object.chromosome, m - parameters.half_width, m + parameters.half_width - 1);
        },
        __resolveReference(reference: { id: string, assembly: string } | any, context: any) {
            if (context.rDHSLoaders[reference.assembly] === undefined)
                context.rDHSLoaders[reference.assembly] = rDHSLoader(reference.assembly);
            return { ...context.rDHSLoaders[reference.assembly].load(reference.id), assembly: reference.assembly };
        }
    }
};
