import { gql } from "apollo-server-core";
import { buildFederatedSchema } from "@apollo/federation";
import { resolvers } from "./resolvers";

export const typeDefs = gql`

    type GenomicRange {
        chromosome: String!
        start: Int!
        end: Int!
    }

    input GenomicRangeInput {
        chromosome: String!
        start: Int!
        end: Int!
    }

    interface GenomicObject {
        id: String!
        assembly: String!
        coordinates: GenomicRange!
    }

    enum Population {
        AFRICAN
        AMERICAN
        EAST_ASIAN
        EUROPEAN
        SOUTH_ASIAN
    }

    enum SubPopulation {
        HAN_CHINESE_BEIJING
        JAPANESE
        SOUTHERN_HAN_CHINESE
        DAI
        KINH
        UTAH_RESIDENT_NW_EUROPEAN
        TOSCANI
        FINNISH
        BRITISH
        IBERIAN
        YORUBA
        LUHYA
        GAMBIAN
        MENDE
        ESAN
        AFRICAN_AMERICAN
        AFRICAN_CARIBBEAN
        MEXICAN
        PUERTO_RICAN
        COLOMBIAN
        PERUVIAN
        GUJARATI
        PUNJABI
        BENGALI
        SRI_LANKAN_TAMIL
        INDIAN_TELUGU
    }

    type SNP implements GenomicObject @key(fields: "id assembly") {
        id: String!
        assembly: String!
        coordinates: GenomicRange!
        refAllele: String
        refFrequency: Float
        genomeWideAssociation: [GWAS]
        linkageDisequilibrium(
            population: Population!
            subpopulation: SubPopulation
            rSquaredThreshold: Float
            dPrimeThreshold: Float
        ): [LinkedSNP]
        minorAlleleFrequency: [AlleleFrequency]
        autocompleteSimilarity: Float
        gtex_eQTLs(
            gene_id: [String!]
            pval_beta: Float
            tissue: [String!]
        ): [GTExQTL!]!
        intersecting_ccres: IntersectingCCREs 
    }
    
    extend type IntersectingCCREs @key(fields: "assembly chromosome start end") {
        assembly: String! @external
        chromosome: String @external
        start: Int @external
        end: Int @external
    }

    type LinkedSNP {
        id: String!
        coordinates(assembly: String!): GenomicRange
        snp(assembly: String!): SNP
        rSquared: Float!
        dPrime: Float!
    }

    type CellTypeEnrichment {
        encodeid: String!
        fdr: Float
        fe: Float
        pValue: Float
    }

    type GWAS {
        pubMedId: Int!
        author: String!
        name: String!
        cellTypeEnrichment(
            fe_threshold: Float
            fdr_threshold: Float
            pValue_threshold: Float
            encodeid: String
        ): [CellTypeEnrichment]
        leadSNPs(linkedSNP: String): [SNP]
    }

    type SNPDensity {
        coordinates: GenomicRange!
        total: Int!
        common: Int!
    }

    type AlleleFrequency {
        sequence: String
        frequency: Float
        eas_af: Float
        eur_af: Float
        sas_af: Float
        afr_af: Float
        amr_af: Float
    }

    type eQTL {
        gene_id: String!
        strand: String!
        n_tested_snps: Int!
        distance_to_tss: Int!
        snp: String!
        coordinates: GenomicRange!
        pval: Float!
        regression_slope: Float!
        is_top_snp: Int!
        fdr: Float!
    }

    type cQTL {
        peak_id: String!
        strand: String!
        n_tested_snps: Int!
        distance: Int!
        snp: String!
        coordinates: GenomicRange!
        peak_coordinates: GenomicRange!
        pval: Float!
        regression_slope: Float!
        is_top_snp: Int!
        fdr: Float!
    }

    type GTExQTL {
        chromosome: String!
        position: Int!
        gene_id: String!
        tss_distance: Int!
        ma_samples: Int!
        ma_count: Int!
        pval_nominal: Float!
        slope: Float!
        slope_se: Float!
        maf: Float!
        pval_nominal_threshold: Float!
        min_pval_nominal: Float!
        pval_beta: Float!
        tissue: String!
    }

    type MAFResult {
        minorAlleles: [AlleleFrequency!]!
        refAllele: String!
        snp: String!
        position: Position!
    }

    input PositionInput {
        chromosome: String!
        position: Int!
    }

    type Position {
        chromosome: String!
        position: Int!
    }

    type SnpAssociation {
        disease: String!
        snpid: String!
        a1: String!
        a2: String!
        n: Float!
        z: Float!
        chisq: Float
    }
    type GwasSnpAssociation {
        disease: String!
        snpid: String!
        riskallele: String!
        associated_gene: String!
        association_p_val: [Float]!
        analyses_identifying_snp: Int!
        chrom: String!
        start: Int!
        stop: Int!
        
    }

    type GwasIntersectingSnpsWithCcre {
        disease: String!
        snpid: String!
        riskallele: String!
        associated_gene: String!
        association_p_val: [Float]!
        snp_chrom: String!
        snp_start: Int!
        snp_stop: Int!
        ccre_chrom: String!
        ccre_start: Int!
        ccre_stop: Int!
        rdhsid:String!
        ccreid: String!
        ccre_class: String!
    }
    type GwasIntersectingSnpsWithBcre {
        disease: String!
        snpid: String!
        riskallele: String!
        associated_gene: String!
        association_p_val: [Float]!
        snp_chrom: String!
        snp_start: Int!
        snp_stop: Int!
        ccre_chrom: String!
        ccre_start: Int!
        ccre_stop: Int!
        rdhsid:String!
        ccreid: String!
        ccre_class: String!
        bcre_group: String!
    }

    type Query {

        resolve(
            id: String!
            assembly: String!
            limit: Int
        ): [GenomicObject!]!

        maf(
            positions: [PositionInput!]!
        ): [MAFResult!]!

        suggest(
            id: String!
            assembly: String!
            limit: Int
        ): [GenomicObject!]!

        snpQuery(
            assembly: String!
            snpids: [String]
            coordinates: [GenomicRangeInput]
            af_threshold: Float
            common: Boolean
        ): [SNP!]!

        snpDensityQuery(
            assembly: String!
            coordinates: [GenomicRangeInput]
            resolution: Int!
        ): [SNPDensity!]!

        snpAutocompleteQuery(
            assembly: String!
            snpid: String!
            common: Boolean
            limit: Int
            offset: Int
        ): [SNP!]!

        eQTLQuery(
            assembly: String!
            coordinates: GenomicRangeInput
            geneId: String
            snpId: String
            strand: String
            limit: Int
            offset: Int
        ): [eQTL!]!

        gtexQTLQuery(
            assembly: String!
            coordinates: GenomicRangeInput
            gene_id: [String!]
            maf_max: Float
            maf_min: Float
            ma_samples: Float
            ma_count: Float
            pval_beta: Float
            tissue: [String!]
        ): [GTExQTL!]!

        cQTLQuery(
            assembly: String!
            coordinates: GenomicRangeInput
            peakId: String
            snpId: String
            strand: String
            limit: Int
            offset: Int
        ): [cQTL!]!

        genomeWideAssociationQuery(
            assembly: String!
            pmIds: [Int]
        ): [GWAS!]!

        snpAssociationsQuery(
            disease: String!
            snpid: String
            limit: Int
            offset: Int
        ): [SnpAssociation]
        
        gwassnpAssociationsQuery(
            disease: String!
            snpid: String
            limit: Int
            offset: Int
        ): [GwasSnpAssociation]

        gwasintersectingSnpsWithCcreQuery(
            disease: String!
            snpid: String
            limit: Int
            offset: Int
        ): [GwasIntersectingSnpsWithCcre]

        gwasintersectingSnpsWithBcreQuery(
            disease: String!
            snpid: String
            limit: Int
            offset: Int
            bcre_group: String
        ): [GwasIntersectingSnpsWithBcre]
    }

`;

export const schema = buildFederatedSchema([{ typeDefs, resolvers }]);
