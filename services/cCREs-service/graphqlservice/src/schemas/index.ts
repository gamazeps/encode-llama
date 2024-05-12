import { gql } from "apollo-server-core";
import { buildFederatedSchema } from "@apollo/federation";

import { resolvers } from "../resolvers";

export const typeDefs = gql`
    input GenomicRangeInput {
        chromosome: String!
        start: Int!
        end: Int!
    }

    type GenomicRange {
        chromosome: String!
        start: Int!
        end: Int!
    }

    interface GenomicObject {
        id: String!
        assembly: String!
        coordinates: GenomicRange!
    }

    type ScoredElement {
        element: RDHS!
        specificity: Float!
    }

    enum GTExState {
        ACTIVE
        REPRESSED
        BIVALENT
    }

    type GTExDecoration {
        state: GTExState!
        proximal: Boolean!
        ctcf_bound: Boolean!
        tissue: String!
        allele_specific: Boolean!
    }

    type RDHS implements GenomicObject @key(fields: "id assembly") {
        id: String!
        accession: String!
        assembly: String!
        coordinates: GenomicRange!
        zScores(experiments: [String!]): [ZScore!]
        maxZ(assay: String!): Float
        sequence(half_width: Int): String!
    }

    type CCRE implements GenomicObject @key(fields: "id assembly") {
        id: String!
        accession: String!
        assembly: String!
        rDHS: String!
        group: String!
        ctcf_bound: Boolean!
        coordinates: GenomicRange!
        gtex_decorations: [GTExDecoration!]!
        zScores(experiments: [String!]): [ZScore!]
        maxZ(assay: String!): Float
        sequence(twobit_url: String!, googleProject: String): TwoBitData
        nearby_genes(include_upstream: Int, include_downstream: Int, protein_coding: Boolean, limit: Int): IntersectingGenes
    }

    type IntersectingCCREs @key(fields: "assembly chromosome start end") {
        intersecting_ccres: [CCRE]
        chromosome: String
        start: Int
        end: Int
        assembly: String!
    }

    extend type TwoBitData @key(fields: "chrom start end url") {
        chrom: String! @external
        start: Int! @external
        end: Int! @external
        url: String! @external
    }

    type ZScore {
        rDHS: String!
        experiment: String!
        score: Float!
    }

    type CCREZScore {
        cCRE: String!
        experiment_accession: String!
        assay: String!
        score: Float!
    }

    type RegistryBiosampleCollection {
        biosamples: [RegistryBiosample!]
        specificElements(assay: String!): [ScoredElement!]
    }

    type LDREnrichment {
        study: String!
        biosample: RegistryBiosample!
        enrichment: Float!
        enrichment_error: Float!
        enrichment_p: Float!
        conditional_enrichment: Float!
        conditional_error: Float!
        conditional_p: Float!
    }

    type ZScoreHistogramBin {
        bin: Float!
        count: Int!
    }

    type RegistryBiosample {
        name: String!
        experimentAccession(assay: String!): String
        fileAccession(assay: String!): String
        umap_coordinates(assay: String!): [Float!]
        ldr_enrichment(studies: [String!]): [LDREnrichment!]
        ontology: String!
        sampleType: String!
        lifeStage: String!
        zscore_histogram(assay: String!, assembly: String!, histogram_minimum: Int!, histogram_maximum: Int!, histogram_bins: Int!): [ZScoreHistogramBin!]!
        cCREZScores(accession: [String!], rDHS: [String!], group: [String!], ctcf_bound: Boolean, coordinates: [GenomicRangeInput!]): [CCREZScore!]!
    }

    type groundLevelVersionsEntries {
        version: String!
        biosample: String!
        assay: String!
        accession: String!
    }

    type LinkedGenes {
        accession: String!
        assembly: String!
        gene: String
        assay: String
        experiment_accession: String
        celltype: String
    }

    type Ortholog {
        accession: String!
        assembly: String!
        ortholog: [String]!
    }

    type SCREENCellTypeSpecificResponse {
        ct: String!
        dnase_zscore: Float
        h3k4me3_zscore: Float
        h3k27ac_zscore: Float
        ctcf_zscore: Float
    }

    type Query {
        resolve(assembly: String!, id: String!, limit: Int): [GenomicObject!]!

        suggest(assembly: String!, id: String!, limit: Int): [GenomicObject!]!

        cCREQuery(
            accession: [String!]
            rDHS: [String!]
            group: [String!]
            ctcf_bound: Boolean
            coordinates: [GenomicRangeInput!]
            assembly: String!
            activeInBiosamples: [String!]
            activeInAnyBiosample: [String!]
        ): [CCRE!]!

        rDHSQuery(
            accession: [String!]
            coordinates: [GenomicRangeInput!]
            assembly: String!
            activeInBiosamples: [String!]
            activeInAnyBiosample: [String!]
        ): [RDHS!]!

        zScoreQuery(experiment: [String!], rDHS: [String!], minimum_score: Float, maximum_score: Float, assembly: String!): [ZScore!]!

        ccREBiosampleQuery(name: [String!], assay: [String!], umap_coordinates: [Float!], assembly: String!): RegistryBiosampleCollection!

        ldr(experiment: [String!], study: [String!]): [LDREnrichment!]!

        groundLevelVersionsQuery: [groundLevelVersionsEntries!]!

        linkedGenesQuery(assembly: String, accession: [String!]): [LinkedGenes]!

        orthologQuery(assembly: String, accession: String): Ortholog!

        cCRESCREENSearch (
            accessions: [String!]
            assembly: String!
            cellType: String
            coord_chrom: String!
            coord_end: Int!
            coord_start: Int!
            element_type: String
            gene_all_start: Int
            gene_all_end: Int
            gene_pc_start: Int
            gene_pc_end: Int
            rank_ctcf_end: Int!
            rank_ctcf_start: Int!
            rank_dnase_end: Int!
            rank_dnase_start: Int!
            rank_enhancer_end: Int!
            rank_enhancer_start: Int!
            rank_promoter_end: Int!
            rank_promoter_start: Int!
            uuid: String
        ): [SCREENSearchResult!]!

    }
    
    extend type IntersectingGenes @key(fields: "assembly chromosome start end protein_coding limit") {
        assembly: String! @external
        chromosome: String @external
        start: Int @external
        end: Int @external
        protein_coding: Boolean @external
        limit: Int @external
    }

    type SCREENNearbyGenes {
        accession: String!
        all: IntersectingGenes!
        pc: IntersectingGenes!
    }

    type CCREInfo {
        accession: String!
        isproximal: Boolean!
        concordant: Boolean!
        ctcfmax: Float!
        k4me3max: Float!
        k27acmax: Float!
    }

    type SCREENSearchResult {
        chrom: String!
        start: Int!
        len: Int!
        pct: String!
        ctcf_zscore: Float!
        dnase_zscore: Float!
        enhancer_zscore: Float!
        promoter_zscore: Float!
        genesallpc: SCREENNearbyGenes!
        info: CCREInfo!
        vistaids: [String!]
        sct: Float!
        maxz: Float!
        in_cart: Int!
        ctspecific: SCREENCellTypeSpecificResponse
        rfacets: [String!]!
    }
`;

export const schema = buildFederatedSchema([{ typeDefs, resolvers }]);
