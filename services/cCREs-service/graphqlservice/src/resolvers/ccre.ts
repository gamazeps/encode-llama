import DataLoader from "dataloader";
import { associateBy } from "queryz";
import { db } from "../postgres";
import { select_cCREs, select_linkedGenes } from "../postgres/ccre";
import { CCREEntry, CCREParameters, ZScoreEntry,LinkedGene, LinkedGenesParameters, SCREENSearchParameters, SCREENSearchResult, BiosampleEntry } from "../postgres/types";
import { maxZScoreLoader, zScoreLoader } from "./zscore";
import { Config } from "../init";
import { select_active_in_biosamples } from "../postgres/zscore";
import { select_rDHSs_at_threshold } from "../postgres/rdhs/select";
import { selectBiosamples } from "../postgres/biosample";

export async function cCREQuery(_: any, parameters: CCREParameters | any, context: { config: Config } | any): Promise<CCREEntry[]> {
    const r = (await select_cCREs(parameters, db)).map( x => ({ ...x, assembly: parameters.assembly.toLocaleLowerCase() }));
    if (!parameters.activeInBiosamples && !parameters.activeInAnyBiosample) return r;
    const v = await select_active_in_biosamples({ experiment: parameters.activeInBiosamples || parameters.activeInAnyBiosample, rDHS: r.map(x => x.rdhs), assembly: parameters.assembly }, context.config, !!parameters.activeInAnyBiosample);
    const vv = new Set(v.map(x => x.accession));
    return r.filter(x => vv.has(x.accession));
};

function intersection(a: Set<string>, b: Set<string>): Set<string> {
    return new Set([...a].filter(i => b.has(i)));
}

export async function SCREENSearchResultQuery(_: any, parameters: SCREENSearchParameters | any, context: { config: Config } | any): Promise<SCREENSearchResult[]> {

    // get biosample and Z-score accessions if requested
    const b: BiosampleEntry[] = parameters.cellType && await selectBiosamples({ assembly: parameters.assembly.toLocaleLowerCase(), name: [ parameters.cellType ] }, db);
    const experiment_accessions = new Map([ "dnase", "h3k4me3", "h3k27ac", "ctcf" ].map(k => [k, (b && b.length && b[0][`${k}_experiment`]) || undefined]));
    const rfacets = [ "dnase", "h3k4me3", "h3k27ac", "ctcf" ].filter(x => !!experiment_accessions.get(x));

    // construct the query parameters and fetch cCREs
    const true_parameters = {
        ...parameters,
        assembly: parameters.assembly.toLocaleLowerCase(),
        accession: parameters.accessions,
        coordinates: [{
            chromosome: parameters.coord_chrom,
            start: parameters.coord_start,
            end: parameters.coord_end
        }],
        activeInBiosamples: (b && b.length && b[0]["dnase_experiment"]) || undefined
    };
    const r = await select_cCREs(true_parameters, db);
    const accession = r.map(x => x.rdhs);

    // filter rDHSs according to provided score limits
    const thresholds = new Map([
        [ "dnase", await select_rDHSs_at_threshold({ assembly: true_parameters.assembly, accession, assay: "dnase" }, context.config, parameters.rank_dnase_start, parameters.rank_dnase_end, experiment_accessions.get("dnase")) ],
        [ "promoter", await select_rDHSs_at_threshold({ assembly: true_parameters.assembly, accession, assay: "h3k27ac" }, context.config, parameters.rank_enhancer_start, parameters.rank_enhancer_end, experiment_accessions.get("h3k27ac")) ],
        [ "enhancer", await select_rDHSs_at_threshold({ assembly: true_parameters.assembly, accession, assay: "h3k4me3" }, context.config, parameters.rank_promoter_start, parameters.rank_promoter_end, experiment_accessions.get("h3k4me3")) ],
        [ "ctcf", await select_rDHSs_at_threshold({ assembly: true_parameters.assembly, accession, assay: "ctcf" }, context.config, parameters.rank_ctcf_start, parameters.rank_ctcf_end, experiment_accessions.get("ctcf")) ]
    ]);
    let all_ids = new Set<string>([ ...thresholds.get("dnase")!.keys() ]);
    [ ...thresholds.keys() ].forEach(k => {
        if (parameters[`rank_${k}_start`] === -10) return;
        all_ids = intersection(all_ids, new Set([ ...thresholds.get(k)!.keys() ]));
    });

    // format output
    return r.filter(x => all_ids.has(x.rdhs)).map(x => ({
        chrom: x.chromosome,
        start: x.start,
        len: x.stop - x.start,
        pct: x.ccre_group,
        ctcf_zscore: thresholds.get("ctcf")!.get(x.rdhs)!,
        dnase_zscore: thresholds.get("dnase")!.get(x.rdhs)!,
        enhancer_zscore: thresholds.get("enhancer")!.get(x.rdhs)!,
        promoter_zscore: thresholds.get("promoter")!.get(x.rdhs)!,
        rfacets: parameters.cellType === undefined ? [ "dnase", "h3k4me3", "h3k27ac", "ctcf" ] : rfacets,
        ctspecific: parameters.cellType === undefined ? undefined : {
            ct: parameters.cellType,
            dnase_zscore: experiment_accessions.get("dnase") ? thresholds.get("dnase")!.get(x.rdhs)! : null,
            h3k4me3_zscore: experiment_accessions.get("h3k4me3") ? thresholds.get("h3k4me3")!.get(x.rdhs)! : null,
            h3k27ac_zscore: experiment_accessions.get("h3k27ac") ? thresholds.get("h3k27ac")!.get(x.rdhs)! : null,
            ctcf_zscore: experiment_accessions.get("ctcf") ? thresholds.get("ctcf")!.get(x.rdhs)! : null
        },
        genesallpc: {
            accession: x.accession,
            all: {
                __typename: "IntersectingGenes",
                assembly: parameters.assembly,
                chromosome: x.chromosome,
                start: x.start - 1000000,
                end: x.stop + 1000000,
                limit: 3
            },
            pc: {
                __typename: "IntersectingGenes",
                assembly: parameters.assembly,
                chromosome: x.chromosome,
                start: x.start - 1000000,
                end: x.stop + 1000000,
                limit: 3,
                protein_coding: true
            }
        },
        info: {
            accession: x.accession,
            concordant: false,
            isproximal: false,
            ctcfmax: thresholds.get("ctcf")!.get(x.rdhs)!,
            k27acmax: thresholds.get("enhancer")!.get(x.rdhs)!,
            k4me3max: thresholds.get("promoter")!.get(x.rdhs)!,
        },
        vistaids: [],
        sct: 0,
        maxz: 0,
        in_cart: 0
    }));

}

export async function linkedGenesQuery(_: any, parameters: LinkedGenesParameters | any, context: { config: Config } | any): Promise<LinkedGene[]> {
    return (await select_linkedGenes(parameters,db));
}

export function cCRELoader(assembly: string): DataLoader<string, CCREEntry | undefined> {
    return new DataLoader(async (keys: string[]) => {
        const results = associateBy(
            await select_cCREs({ accession: keys, assembly }, db),
            x => x.accession, x => x
        );
        return keys.map(k => results.get(k));
    });
}

export const cCREResolvers = {
    CCRE: {
        id: (object: CCREEntry) => object.accession,
        rDHS: (object: CCREEntry) => object.rdhs,
        coordinates: (object: CCREEntry) => ({
            chromosome: object.chromosome,
            start: object.start,
            end: object.stop
        }),
        group: (object: CCREEntry) => object.ccre_group,
        zScores: async (object: CCREEntry, parameters: { experiments: string[] } | any, context: { config: Config, cCREZScoreLoaders: { [ key: string]: DataLoader<string, ZScoreEntry[]> } } | any) => {
            const key = object.assembly + ":" + (parameters.experiments || []).join(",");            
            if (context.cCREZScoreLoaders[key] === undefined) context.cCREZScoreLoaders[key] = zScoreLoader(object.assembly!.toLocaleLowerCase(), parameters.experiments, context.config);
            return context.cCREZScoreLoaders[key].load(object.rdhs);
        },
        maxZ: async (object: CCREEntry, parameters: { assay: string } | any, context: any) => {
            const key = `${object.assembly!}_${parameters.assay}`;
            if (context.cCREmaxZScoreLoaders[key] === undefined)
                context.cCREmaxZScoreLoaders[key] = maxZScoreLoader(object.assembly!.toLocaleLowerCase(), parameters.assay, context.config);
            return (await context.cCREmaxZScoreLoaders[key].load(object.rdhs))?.score;
        },
        sequence: async (obj: CCREEntry, parameters: { twobit_url: string, googleProject?: string } | any) => {
            return parameters.twobit_url
                ? { __typename: "TwoBitData",  chrom : obj.chromosome, start: obj.start, end: obj.stop, url: parameters.twobit_url, googleProject: parameters.googleProject }
                : null;
        },
        gtex_decorations: (obj: CCREEntry, _: any, context: any) => (
            context.config.gtex_annotations[obj.assembly!][obj.accession] || []
        ),
        __resolveReference(reference: { id: string, assembly: string } | any, context: any) {
            if (context.cCRELoaders[reference.assembly] === undefined)
                context.cCRELoaders[reference.assembly] = cCRELoader(reference.assembly);
            return { ...context.cCRELoaders[reference.assembly].load(reference.id), assembly: reference.assembly };
        },
        nearby_genes: async (obj: CCREEntry, parameters: { include_upstream?: number, include_downstream?: number, protein_coding?: boolean, limit?: number } | any) => ({
            __typename: "IntersectingGenes",
            assembly: obj.assembly!,
            chromosome: obj.chromosome,
            start: obj.start - (parameters.include_upstream || 0),
            end: obj.stop + (parameters.include_downstream || 0),
            protein_coding: parameters.protein_coding,
            limit: parameters.limit
        })
    },
    GTExDecoration: {
        state: (obj: any) => obj.active.toLocaleUpperCase()
    },
    IntersectingCCREs: {
        async __resolveReference(reference: { assembly: string, chromosome?: string, start: number, end: number  } | any) {
            if (!reference.chromosome) return { intersecing_ccres: [] };
            if (reference.assembly.toLocaleLowerCase() === "hg38") reference.assembly = "GRCh38";
            const parameters = { assembly: reference.assembly, coordinates: [{ chromosome: reference.chromosome, start: reference.start, end: reference.end }] };
            const d = (await select_cCREs(parameters, db)).map( x => ({ ...x, assembly: parameters.assembly }));
            return {
                intersecting_ccres: d.map( x => ({
                    ...x,
                    assembly: parameters.assembly,
                    group: x.ccre_group,
                    id: x.accession,
                    rDHS: x.rdhs, 
                    coordinates: {
                        chromosome: x.chromosome,
                        start: x.start,
                        end: x.stop
                    }
                })),
                chromosome: reference.chromosome,
                start: reference.start,
                end: reference.end,
                assembly: reference.assembly
            };
        }
    }
};
