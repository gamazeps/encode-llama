import DataLoader from "dataloader";
import { GraphQLFieldResolver } from "graphql";

import { GeneInputParameters, GenomicRange } from "../types";
import { groupByKey, groupByKeySingle, groupById, resolveCoordinates } from "./utilities";
import { db, GeneQuant, GeneQuantParameters, selectGeneQuantifications, selectGenes, selectTranscriptsByGene, selectGeneAssociations, selectPedatasetValuesbyCelltype, selectPedatasetValuesbySubclass, selectCaQtls } from "../postgres";
import { GeneResult, GeneParameters, TranscriptResult, GeneAssociationsParameters, GeneAssociation, SingleCellGeneBoxPlotParameters, SingleCellGeneBoxPlot, PeDatasetValues, PeDatasetValuesParameters, DeconQtls, Deg, QtlSigAssoc } from "../postgres/types";
import { GeneQuantificationDataLoader } from "./gene-quantification";
import { DEFAULT_GENCODE_VERSIONS, DEFAULT_QUANT_SOURCE } from "../constants";
import { Config } from "../init";

import { select_gtext_genes } from "../preloadeddata/gtexgenesdata";
import { GtexGenes  } from "../preloadeddata/gtexgenesdata/select";
import { select_single_cell_genes, select_single_cell_umap_coords } from "../preloadeddata/singlecelldata";
import { SingleCellGenes, SingleCellTypeDetails } from "../preloadeddata/singlecelldata/select";


import { selectDeconQtls, selectSingleCellBoxPlot, selectDeg, selectQtlSigAssoc } from "../postgres/genes";
import { findClosestCoordinates, flattenArray, mergeGenomicCoordinates, sortGenomicCoordinates } from "../util/geneSearch";
import { select_rampagedata, select_tssrampagedata } from "../preloadeddata/rampagedata";
import { RampageResponse, TssRampageResponse } from "../preloadeddata/rampagedata/select";
import { uploadTrackHub } from "../routers/user-files";

export type GeneDataLoader = DataLoader<string, GeneResult>;
export type GeneTranscriptDataLoader = DataLoader<string, TranscriptResult[]>;
export type GeneCoordinateDataLoader = DataLoader<GenomicRange, GeneResult[]>;

function geneParameters(parameters: GeneInputParameters | any): GeneParameters {
    return {
        id: parameters.id,
        name: parameters.name,
        strand: parameters.strand,
        coordinates: parameters.chromosome && {
            chromosome: parameters.chromosome,
            start: parameters.start,
            stop: parameters.end
        },
        gene_type: parameters.gene_type,
        havana_id: parameters.havana_id,
        name_prefix: parameters.name_prefix,
        orderby: parameters.orderby,
        limit: parameters.limit,
        version: parameters.version,
        distanceThreshold: parameters.distanceThreshold
    };
}

const geneQuery: GraphQLFieldResolver<{}, {}, GeneParameters> = async (_, args): Promise<GeneResult[]> => {
    return (await selectGenes(args.assembly, geneParameters(args), db)).map(
        (result: GeneResult): GeneResult => ({ ...result, assembly: args.assembly, version: args.version })
    );
}
async function rampageQuery(_: any, args: { transcript_ids: string[]} | any, context: { config: Config } | any): Promise<RampageResponse[]> {
    return (await select_rampagedata(args, context.config))
}

async function tssrampageQuery(_: any, args: { genename: string} | any, context: { config: Config } | any): Promise<TssRampageResponse[]> {
    return (await select_tssrampagedata(args, context.config))
}
async function gtexGenesQuery(_: any, args: { gene_id: string[], tissue?: string[], tissue_subcategory?: string[]} | any, context: { config: Config } | any): Promise<GtexGenes[]> {
    return (await select_gtext_genes(args, context.config))
}

async function singleCellGenesQuery(_: any, args:  { disease: string, barcodekey?: string[], featurekey?: string[], featureid?: string[] } | any, context: { config: Config } | any): Promise<SingleCellGenes[]> {
    return (await select_single_cell_genes(args, context.config))
}

async function singleCellUmapQuery(_: any, args:  { disease: string } | any, context: { config: Config } | any): Promise<SingleCellTypeDetails[]> {
    return (await select_single_cell_umap_coords(args, context.config))
}

const genesAssociationsQuery: GraphQLFieldResolver<{}, {}, GeneAssociationsParameters>
= async (_, args): Promise<GeneAssociation[]> => {
  return (await selectGeneAssociations(args, db))
};

async function getPedatasetValuesbyCelltypeQuery(_: any, args:  PeDatasetValuesParameters | any): Promise<PeDatasetValues[]> {
    return (await selectPedatasetValuesbyCelltype(args,db))
}    

async function getPedatasetValuesbySubclassQuery(_: any, args:  PeDatasetValuesParameters | any): Promise<PeDatasetValues[]> {
    return (await selectPedatasetValuesbySubclass(args,db))
}  
async function caqtls(_: any, args:  {snpid: string} | any): Promise<{snpid: string, type:string}[]> {
    return (await selectCaQtls(args,db ))
}



async function deconqtlsQuery(_: any, args:  {snpid?: string, geneid?: string} | any):Promise<DeconQtls[]> {
    return (await selectDeconQtls(args,db ))
}
async function degQuery(_: any, args:  {disease: string, gene?: string, celltype?: string} | any):Promise<Deg[]> {
    return (await selectDeg(args,db ))
}

async function qtlsigassocQuery(_: any, args:  { qtltype?: string, snpid?: string, geneid?: string} | any):Promise<QtlSigAssoc[]> {
    return (await selectQtlSigAssoc(args,db ))
}

//
const singleCellBoxPlotQuery: GraphQLFieldResolver<{}, {}, SingleCellGeneBoxPlotParameters>
= async (_, args): Promise<SingleCellGeneBoxPlot[]> => {
  return (await selectSingleCellBoxPlot(args, db))
};

/**
 * Creates a data loader for loading a set of genes from the database given their coordinates.
 * @param assembly the genomic assembly from which to load the genes.
 * @param loaders map of assemblies to cached data loaders used to load genes.
 */
export function geneCoordinateLoader(assembly: string, protein_coding: boolean, limit: number, version: number, loaders: { [assembly: string]: GeneCoordinateDataLoader }): GeneCoordinateDataLoader {
    console.log(`fetching near by genes from version ${version}`)
    if (!loaders[`${assembly}_${protein_coding}_${limit}_${version}`]) loaders[`${assembly}_${protein_coding}_${limit}_${version}`] = new DataLoader<GenomicRange, GeneResult[]>(
        async (coordinates: GenomicRange[]): Promise<GeneResult[][]> => {
            const sortedCoordinates = [ ...coordinates ].sort(sortGenomicCoordinates);
            const mergedCoordinates = mergeGenomicCoordinates([ ...sortedCoordinates ]);
            let geneMatches = await Promise.all(
                mergedCoordinates.map(async coordinates => await selectGenes(assembly, { coordinates: {
                    chromosome: coordinates.chromosome,
                    start: coordinates.start,
                    stop: coordinates.end
                }, version: version }, db))
            );
            if (protein_coding) geneMatches = [ flattenArray(geneMatches).filter(x => x.gene_type === "protein_coding") ];
            const sortedGenes = flattenArray(geneMatches).map(g => ({ ...g, end: g.stop })).sort(sortGenomicCoordinates);
            const bestMatches = findClosestCoordinates(sortedCoordinates, sortedGenes, limit);
            return coordinates.map(x => bestMatches.get(x)! as unknown[] as GeneResult[]);
        }
    );
    return loaders[`${assembly}_${protein_coding}_${limit}_${version}`];
}

/**
 * Creates a data loader for loading a set of genes from the database given their IDs.
 * @param assembly the genomic assembly from which to load the genes.
 * @param loaders map of assemblies to cached data loaders used to load genes.
 */
export function geneLoader(assembly: string, loaders: { [assembly: string]: GeneDataLoader }): GeneDataLoader {
    if (!loaders[assembly]) loaders[assembly] = new DataLoader<string, GeneResult>(
        async (geneIDs: string[]): Promise<GeneResult[]> => (
            groupByKeySingle(
                geneIDs.map( (x: string): string => x.split('.')[0]),
                (await selectGenes(assembly, { idPrefix: geneIDs.map( (x: string): string => x.split('.')[0] ) }, db)).map(
                    (result: GeneResult): GeneResult => ({ ...result, assembly })
                ), (result: GeneResult): string => result.id.split('.')[0]
            )
        )
    );
    return loaders[assembly];
}

/**
 * Creates a data loader for loading a set of gene quantification values from gene names.
 * @param assembly the genomic assembly from which to load the files.
 * @param loaders map of assemblies to cached data loaders used to load quantification files.
 */
 export function geneQuantLoader(args: GeneQuantParameters, loaders: { [assembly: string]: GeneQuantificationDataLoader }): GeneQuantificationDataLoader {
    const source = args.source || DEFAULT_QUANT_SOURCE;
    const key = `${args.assembly}_${source.type}:${source.user_collection||""}`;
    if (!loaders[key])
        loaders[key] = new DataLoader<string, GeneQuant[]>(async (names: string[]): Promise<GeneQuant[][]> => {
            const rawGeneQuant = await selectGeneQuantifications({ ...args, gene_id_prefix: names }, db);
            const geneQuant = rawGeneQuant.map((q: GeneQuant): GeneQuant => ({ ...q, assembly: args.assembly }));
            return groupByKey(names, geneQuant, x => x.gene_id.split('.')[0]);
        });
    return loaders[key];
}

/**
 * Creates a data loader for loading a set of transcripts from the database given corresponding gene IDs.
 * @param assembly the genomic assembly from which to load the transcripts.
 * @param loaders map of assemblies to cached data loaders used to load transcripts.
 */
export function geneTranscriptLoader(args: GeneParameters, loaders: { [assembly: string]: GeneTranscriptDataLoader }): GeneTranscriptDataLoader {
    if (!loaders[args.assembly]) loaders[args.assembly] = new DataLoader<string, TranscriptResult[]>(
        async (geneIDs: string[]): Promise<TranscriptResult[][]> => (
            groupById(geneIDs, (await selectTranscriptsByGene(args.assembly, { version: args.version, id: geneIDs }, {}, db)).map(
                (result: TranscriptResult): TranscriptResult => ({ ...result, assembly: args.assembly, version: args.version })
            ), "parent_gene")
        )
    );
    return loaders[args.assembly];
}

interface NearbyGeneParameters {
    assembly: string;
    limit?: number;
    protein_coding?: boolean;
    coordinates: {
        chromosome: string;
        start: number;
        stop: number;
    }[];
    [key: string]: any;
};

const nearbyGeneQuery: GraphQLFieldResolver<{}, {}, NearbyGeneParameters | any> = async (_, args, context): Promise<NearbyGeneResult[]> => {
    return Promise.all(args.coordinates.map((coordinates: any) => loadNearbyGenes({
        assembly: args.assembly,
        chromosome: coordinates.chromosome,
        start: coordinates.start,
        end: coordinates.stop,
        limit: args.limit,
        protein_coding: args.protein_coding
    }, context)));
}

export const geneQueries = {
    gene: geneQuery,
    
    nearestGenes: nearbyGeneQuery,
    genesAssociationsQuery,
    gtex_genes: gtexGenesQuery,
    singleCellBoxPlotQuery,
    singleCellGenesQuery,
    singleCellUmapQuery,
    getPedatasetValuesbyCelltypeQuery,
    getPedatasetValuesbySubclassQuery,
    caqtls,
    deconqtlsQuery,
    degQuery,
    qtlsigassocQuery,
    rampageQuery,
    tssrampageQuery
};

interface NearbyGeneResult {
    intersecting_genes: (GeneResult & {
        coordinates: GenomicRange;
    })[];
    chromosome: string;
    start: number;
    end: number;
    assembly: string
    
};

export async function loadNearbyGenes(reference: { assembly: string, chromosome?: string, start: number, end: number, protein_coding?: boolean, limit?: number } | any, context: any): Promise<NearbyGeneResult> {
    if (!reference.chromosome) return { ...reference, intersecing_genes: [] };
    if (reference.assembly.toLocaleLowerCase() === "hg38") reference.assembly = "GRCh38";
    const parameters = { assembly: reference.assembly, coordinates: { chromosome: reference.chromosome, start: reference.start, end: reference.end }, protein_coding: reference.protein_coding, limit: reference.limit || 3, version: reference.assembly.toLocaleLowerCase()=="mm10" ? 25: 40};
    const result = await geneCoordinateLoader(parameters.assembly, !!parameters.protein_coding, parameters.limit, parameters.version, context.geneCoordinateDataLoaders).load(parameters.coordinates);
    return {
        intersecting_genes: result.map(x => ({
            ...x,
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

export const geneResolvers = {
    Gene: {
        transcripts: async (obj: GeneResult, parameters: any, context: any): Promise<TranscriptResult[]> => (
            geneTranscriptLoader({ assembly: obj.assembly, version: obj.version, ...parameters }, context.transcriptLoaders).load(obj.id)
        ),
        coordinates: resolveCoordinates,
        __resolveReference: (reference: { id: string, assembly: string } | any, context: any) => (
            geneLoader(reference.assembly, context.geneLoaders).load(reference.id)
        ),
        gene_quantification: async (obj: GeneResult, parameters: any, context: any): Promise<GeneQuant[]> => {
            const source = parameters.source || DEFAULT_QUANT_SOURCE;
            return geneQuantLoader({ ...parameters, assembly: obj.assembly, source }, context.geneQuantLoaders).load(obj.id.split('.')[0]);
        },
        intersecting_ccres: async (obj: GeneResult, parameters: { include_upstream?: number, include_downstream?: number } | any) => ({
            __typename: "IntersectingCCREs",
            assembly: obj.assembly!,
            chromosome: obj.chromosome,
            start: obj.start - (obj.strand === '-' ? parameters.include_downstream : parameters.include_upstream) || 0,
            end: obj.stop + (obj.strand === '-' ? parameters.include_upstream : parameters.include_downstream) || 0
        })
    },
    IntersectingGenes: {
        async __resolveReference(reference: { assembly: string, chromosome?: string, start: number, end: number, protein_coding?: boolean, limit?: number } | any, context: any) {
            return loadNearbyGenes(reference, context);
        }
    }
};
