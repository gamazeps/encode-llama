import { Config } from "../init";
import DataLoader from 'dataloader';
import { db } from "../postgres";
import { cCREQuery } from './ccre';
import { selectBiosamples } from "../postgres/biosample";
import { BiosampleEntry, BiosampleParemeters, CCREParameters, RDHSEntry, ZScoreEntry, ZScoreHistogramParameters, ZScoreParameters } from "../postgres/types";
import { specificElements } from "../postgres/biosample/select";
import { ldrLoader } from "./ldr";
import { associateBy } from "queryz";
import { biosample_zscore_histogram } from "../postgres/zscore/select";
import { zScoreLoader } from "./zscore";

type BiosampleCollection = {
    biosamples: BiosampleEntry[];
    assembly?: string;
    specificElements?: RDHSEntry[];
}

export async function ccREBiosampleQuery(_: any, parameters: BiosampleParemeters | any): Promise<BiosampleCollection> {
    return {
        biosamples: (await selectBiosamples(parameters, db)).map( x => ({ ...x, assembly: parameters.assembly.toLocaleLowerCase() })),
        assembly: parameters.assembly.toLocaleLowerCase()
    };
};

function first<T>(maps: Map<string, Map<string | null | undefined, T>>, key: string): T | undefined {
    for (const [ _, m ] of maps)
        if (m.get(key)) return m.get(key)!;
}

export function biosampleLoader(assembly: string): DataLoader<string, BiosampleEntry> {
    return new DataLoader(async (keys: string[]) => {
        const r = await selectBiosamples({ assembly, accession: keys }, db);
        const allMaps = associateBy([ "dnase", "h3k4me3", "h3k27ac", "ctcf" ], x => x, assay => associateBy( r, x => x[`${assay}_experiment`], x => x));
        return keys.map(x => first(allMaps, x)!);
    });
}

export async function umapLoader(assembly: string, assay: string, config: Config): Promise<DataLoader<string, number[] | undefined>> {
    const matrix = await config.umap_matrices[assembly][assay].array();
    return new DataLoader(async (keys: string[]) => {
        const indexes = keys.map(x => config.biosample_order[assembly][assay][x]);
        return keys.map((_, i) => matrix[indexes[i]]!);
    });
}

export const biosampleResolvers = {
    RegistryBiosampleCollection: {
        specificElements: (object: BiosampleCollection, args: { assay: string } | any, context: { config: Config } | any) => {
            if (object.biosamples.length === 0) return [];
            const assay = args.assay.toLocaleLowerCase();
            return specificElements(object.biosamples, context.config, assay, object.assembly!, db);
        }
    },
    RegistryBiosample: {
        name: (object: BiosampleEntry) => object.biosample_name,
        experimentAccession: (object: BiosampleEntry, args: { assay: string } | any) => object[`${args.assay.toLocaleLowerCase()}_experiment`],
        fileAccession: (object: BiosampleEntry, args: { assay: string } | any) => object[`${args.assay.toLocaleLowerCase()}_file`],
        cCREZScores: async (object: BiosampleEntry, parameters: CCREParameters | any, context: { config: Config } | any) => {
            const cCREs = await cCREQuery(object, { ...parameters, assembly: object.assembly }, context);
            const key = object.biosample_name;
            const assays = Object.keys(object).filter(x => x.includes("_experiment") && !!object[x]);
            if (context.cCREZScoreLoaders[key] === undefined) context.cCREZScoreLoaders[key] = zScoreLoader(object.assembly!.toLocaleLowerCase(), assays.map(a => object[a] as string), context.config);
            const z = await (context.cCREZScoreLoaders[key] as DataLoader<string, ZScoreEntry[]>).loadMany(cCREs.map(x => x.rdhs));
            const zMap = new Map(cCREs.map(x => [ x.rdhs, x.accession ]));
            const assayMap = new Map(assays.map(a => [ object[a], a ]));
            return z.flatMap(zz => zz.map(zzz => ({
                ...zzz,
                cCRE: zMap.get(zzz.rdhs),
                assay: assayMap.get(zzz.experiment_accession)?.split("_")[0]
            })));
        },
        umap_coordinates: async (object: (BiosampleEntry & { assembly: string }) | any, args: { assay: string } | any, context: { config: Config } | any) => {
            const assay = args.assay.toLocaleLowerCase();
            const key = `${object.assembly}_${assay}`;
            if (context.umapLoaders[key] === undefined)
                context.umapLoaders[key] = await umapLoader(object.assembly!.toLocaleLowerCase(), assay, context.config);
            return object[`${assay}_experiment`] ? context.umapLoaders[key].load(object[`${assay}_experiment`]) : null;
        },
        ontology: async (object: BiosampleEntry & { assembly: string } | any, _: any, context: { config: Config } | any) => (
            context.config.experiment_order[object.assembly][context.config.biosample_name_map[object.assembly][object.biosample_name]].ontology
        ),
        sampleType: async (object: BiosampleEntry & { assembly: string } | any, _: any, context: { config: Config } | any) => (
            context.config.experiment_order[object.assembly][context.config.biosample_name_map[object.assembly][object.biosample_name]].sample_type
        ),
        lifeStage: async (object: BiosampleEntry & { assembly: string } | any, _: any, context: { config: Config } | any) => (
            context.config.experiment_order[object.assembly][context.config.biosample_name_map[object.assembly][object.biosample_name]].life_stage
        ),
        ldr_enrichment: async (object: BiosampleEntry | any, args : { studies?: string[] } | any, context: { config: Config } | any) => {
            const key = args.studies?.join(" ");
            if (context.ldrLoaders[key] === undefined)
                context.ldrLoaders[key] = ldrLoader(context.config, args.studies);
            return object[`dnase_experiment`] ? context.ldrLoaders[key].load(object[`dnase_experiment`]) : null;
        },
        zscore_histogram: async (object: BiosampleEntry | any, args: (ZScoreHistogramParameters & { assay: string, assembly: string }) | any, context: { config: Config } | any) => {
            const experiment = [ object[`${args.assay.toLocaleLowerCase()}_experiment`] ];
            const [ width, bins ] = await biosample_zscore_histogram({ ...args, experiment }, context.config);
            const binValues = bins.dataSync() as Int32Array;
            const r: { bin: number; count: number }[] = [];
            for (let i = 0; i < binValues.length; ++i)
                if (binValues[i] > 0)
                    r.push({
                        bin: width * i + args.histogram_minimum,
                        count: binValues[i]
                    });
            return r;
        }
    }
};
