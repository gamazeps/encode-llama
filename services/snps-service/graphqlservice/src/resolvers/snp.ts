import DataLoader from "dataloader";

import { AlleleFrequency, LinkedSNP } from './types';
import { db, selectSNPs, selectSNPDensity, selectSnpsSuggestionsbyId, selectSNPAssociations, selectGwasSNPAssociations, selectGwasIntersectingSNPWithCcres, selectGwasIntersectingSNPWithBcres } from "../postgres";
import { 
    SNPResult, GenomicRange, SNPParameters, SNPResultWithAssembly,
    AutocompleteParameters, SNPDensityParameters, SNPDensityResult, StudyResult, GTExQTLResult, SnpAssociation, SNPAssociationsParameters, GwasSnpAssociation, GwasIntersectingSnpsWithCcre, GwasIntersectingSnpsWithBcre, GwasIntersectingSNPWithBcreParameters
} from "../postgres/types";
import { GraphQLFieldResolver } from "graphql";
import { groupByIdSingle } from './utilities';
import { ldLoader } from "./ldblocks";
import { studyLoader } from "./studies";
import { gtexLoader } from "./eQTL";

export type SNPDataLoader = DataLoader<string, SNPResultWithAssembly>;

/** Loads SNP results for a given set of input parameters */
const snpQuery: GraphQLFieldResolver<{}, {}, SNPParameters>
  = async (_, args): Promise<SNPResultWithAssembly[]> => {
    return (await selectSNPs(args, db)).map( (snp: SNPResult): SNPResultWithAssembly => (
        { ...snp, assembly: args.assembly! }
    ));
};

const snpAssociationsQuery: GraphQLFieldResolver<{}, {}, SNPAssociationsParameters>
= async (_, args): Promise<SnpAssociation[]> => {
  return (await selectSNPAssociations(args, db))
};

const gwassnpAssociationsQuery: GraphQLFieldResolver<{}, {}, SNPAssociationsParameters>
= async (_, args): Promise<GwasSnpAssociation[]> => {
  return (await selectGwasSNPAssociations(args, db))
};


//selectGwasIntersectingSNPWithCcres
const gwasintersectingSnpsWithCcreQuery: GraphQLFieldResolver<{}, {}, SNPAssociationsParameters>
= async (_, args): Promise<GwasIntersectingSnpsWithCcre[]> => {
  return (await selectGwasIntersectingSNPWithCcres(args, db))
};


//selectGwasIntersectingSNPWithCcres
const gwasintersectingSnpsWithBcreQuery: GraphQLFieldResolver<{}, {}, GwasIntersectingSNPWithBcreParameters>
= async (_, args): Promise<GwasIntersectingSnpsWithBcre[]> => {
  return (await selectGwasIntersectingSNPWithBcres(args, db))
};


/** Loads SNP results for a given set of input parameters */
const snpDensityQuery: GraphQLFieldResolver<{}, {}, SNPDensityParameters>
  = async (_, args): Promise<SNPDensityResult[]> => {
    return (await selectSNPDensity(args, db));
};

/** Loads SNP autocomplete suggestions for a given prefix */
const snpAutocompleteQuery: GraphQLFieldResolver<{}, {}, AutocompleteParameters|any>
  = async (_, args): Promise<SNPResultWithAssembly[]> => {
    return (await selectSnpsSuggestionsbyId(args, db)).map( (snp: SNPResult): SNPResultWithAssembly => (
        { ...snp, assembly: args.assembly! }
    ));
};

/**
 * Creates a data loader for loading SNP information given a list of rsIDs.
 * @param assembly the genomic assembly from which to load the SNPs.
 */
function snpDataLoader(assembly: string): SNPDataLoader {
    return new DataLoader<string, SNPResultWithAssembly>( async (snpids: string[]): Promise<SNPResultWithAssembly[]> => (
        groupByIdSingle(snpids, await selectSNPs({ assembly, snpids }, db), "snp")).map(
            (snp: SNPResult): SNPResultWithAssembly => ({ ...snp, assembly })
        )
    );
}

/**
 * Returns a data loader for loading SNPs from a given assembly given rsIDs. If a loader does not already exist for
 * the given assembly, it will be created and saved for later reuse.
 *
 * @param assembly the genomic assembly from which to load the SNPs.
 */
export function snpLoader(assembly: string, loaders: { [key: string]: SNPDataLoader }): SNPDataLoader {
    if (!loaders[assembly]) loaders[assembly] = snpDataLoader(assembly);
    return loaders[assembly];
}

/**
 * Extracts genomic coordinates from a SNPResult object.
 * @param object the SNPResult from which to extract the coordinates.
 */
export async function parseCoordinates(object: SNPResult): Promise<GenomicRange | null> {
    return object.chrom ? {
        chromosome: object.chrom,
        start: object.start,
        end: object.stop
    } : null;
}

export const snpQueries = {
    snpQuery,
    snpDensityQuery,
    snpAutocompleteQuery,
    snpAssociationsQuery,
    gwassnpAssociationsQuery,
    gwasintersectingSnpsWithCcreQuery,
    gwasintersectingSnpsWithBcreQuery
}

export const snpResolvers = {
    SNP: {
        id: (object: SNPResult): string => object.snp,
        coordinates: parseCoordinates,
        refAllele: (object: SNPResult) => object.refallele,
        refFrequency: (object: SNPResult) => object.af,
        minorAlleleFrequency: (object: SNPResult, _: any, context: any): Promise<AlleleFrequency[]> => (
            context.mafLoader.load(object.snp)
        ),
        linkageDisequilibrium: async (object: SNPResult, args: any, context: any): Promise<LinkedSNP[]> => (
            ldLoader(args.population.toLowerCase(), context.ldLoaders, args.subpopulation ? args.subpopulation.toLowerCase() : undefined ).load(object.snp)
        ),
        genomeWideAssociation: async (object: SNPResultWithAssembly, _: any, context: any): Promise<StudyResult[]> => (
            studyLoader(object.assembly, context.studyLoaders).load(object.snp)
        ),
        gtex_eQTLs: async (object: SNPResultWithAssembly, args: any, context: any): Promise<GTExQTLResult[]> => (
            gtexLoader(object.assembly, context.gtexLoaders).load({
                ...args,
                coordinates: [{
                    chromosome: object.chrom,
                    start: object.stop,
                    end: object.stop
                }]
            })
        ),
        intersecting_ccres: async (obj: SNPResultWithAssembly) => {            
            return { __typename: "IntersectingCCREs", assembly: obj.assembly, chromosome: obj.chrom, start: obj.start, end: obj.stop  }
        },
        __resolveReference: (reference: { id: string, assembly: string } | any, context: any) => (
            snpLoader(reference.assembly, context.snpLoaders).load(reference.id)
        )
    },
    SNPDensity: {
        coordinates: parseCoordinates,
        total: (object: SNPDensityResult): number => object.total_snps,
        common: (object: SNPDensityResult): number => object.common_snps,
    }
};
