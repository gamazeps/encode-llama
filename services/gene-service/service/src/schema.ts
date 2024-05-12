import { gql } from "apollo-server-express";
import { buildFederatedSchema } from "@apollo/federation";
import { resolvers } from "./resolvers";

const typeDefs = gql`
    scalar JSON

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

    enum QuantDataSourceType {
        ENCODE, PSYCH_ENCODE, USER
    }

    input QuantDataSourceInput {
        type: QuantDataSourceType,
        user_collection: String
    }

    type PsychEncodeDatasetValues {
        dataset: String,
        gene: String,
        celltype: String,
        avgexp: Float,
        pctexp: Float
    }
    type QuantDataSource {
        type: QuantDataSourceType,
        user_collection: String
    }

    type GeneDataset {
        source: QuantDataSource!
        accession: String!
        biosample: String!
        biosample_type: String
        tissue: String
        cell_compartment: String
        lab_name: String
        lab_friendly_name: String
        assay_term_name: String
        diagnosis: String
        study: String
        suicidaldeath: Boolean
        sex: String
        age_death: Float
        fetal: Boolean
        metadata: JSON
        user_collection_accession: String
        signal_files(assembly: String): [SignalFile]
        gene_quantification_files(assembly: String): [GeneQuantificationFile]
        transcript_quantification_files(assembly: String): [TranscriptQuantificationFile]
    }

    type SignalFile {
        accession: String!
        dataset_accession: String!
        assembly: String!
        biorep: Int
        techrep: Int
        strand: String
        unique_reads: Boolean
    }

    type GeneQuantificationFile {
        accession: String!
        dataset_accession: String!
        assembly: String!
        biorep: Int
        techrep: Int
        quantifications(
            gene_id_prefix: [String]
            gene_id: [String]
            tpm_range: QuantificationRange
            fpkm_range: QuantificationRange
            experiment_accession: [String]
        ): [GeneQuantification]
    }

    type TranscriptQuantificationFile {
        accession: String!
        dataset_accession: String!
        assembly: String!
        biorep: Int
        techrep: Int
        quantifications(
            transcript_id: [String]
            transcript_id_prefix: [String]
            experiment_accession: [String]
            gene_id: [String]
            gene_id_prefix: [String]
            tpm_range: QuantificationRange
            fpkm_range: QuantificationRange
        ): [TranscriptQuantification]
    }

    type Transcript implements GenomicObject @key(fields: "id assembly") {
        id: String!
        assembly: String!
        name: String!
        coordinates: GenomicRange!
        project: String!
        score: Int!
        strand: String!
        transcript_type: String!
        havana_id: String
        support_level: Int
        tag: String
        exons: [Exon]
        intersecting_ccres(include_upstream: Int, include_downstream: Int): IntersectingCCREs
        associated_ccres_pls: IntersectingCCREs
    }

    type Exon {
        id: String!
        name: String!
        coordinates: GenomicRange!
        project: String!
        score: Int!
        strand: String!
        exon_number: Int!
        UTRs: [UTR]
    }

    type Gene implements GenomicObject @key(fields: "id assembly") {
        id: String!
        name: String!
        assembly: String!
        coordinates: GenomicRange!
        project: String!
        score: Int!
        strand: String!
        gene_type: String!
        havana_id: String
        transcripts: [Transcript]
        gene_quantification(
            assembly: String!
            experiment_accession: [String]
            file_accession: [String]
            gene_id: [String]
            tpm_range: QuantificationRange
            fpkm_range: QuantificationRange
            limit: Int
            offset: Int
            sortByTpm: Boolean
            source: QuantDataSourceInput
        ): [GeneQuantification]
        intersecting_ccres(include_upstream: Int, include_downstream: Int): IntersectingCCREs
    }

    extend type IntersectingCCREs @key(fields: "assembly chromosome start end") {
        assembly: String! @external
        chromosome: String @external
        start: Int @external
        end: Int @external
    }

    type IntersectingGenes @key(fields: "assembly chromosome start end protein_coding limit") {
        intersecting_genes: [Gene]
        chromosome: String
        start: Int
        end: Int
        assembly: String!
        protein_coding: Boolean
        limit: Int
    }

    type UTR {
        id: String!
        name: String!
        coordinates: GenomicRange!
        project: String!
        score: Int!
        strand: String!
        direction: Int!
        phase: Int!
        parent_protein: String!
        tag: String!
    }

    type GeneQuantification {
        experiment_accession: String!
        file_accession: String!
        gene: Gene
        len: Float!
        effective_len: Float!
        expected_count: Float!
        tpm: Float!
        fpkm: Float!
        posterior_mean_count: Float!
        posterior_standard_deviation_of_count: Float!
        pme_tpm: Float!
        pme_fpkm: Float!
        tpm_ci_lower_bound: Float!
        tpm_ci_upper_bound: Float!
        fpkm_ci_lower_bound: Float!
        fpkm_ci_upper_bound: Float!
        tpm_coefficient_of_quartile_variation: Float
        fpkm_coefficient_of_quartile_variation: Float
    }

    type TranscriptQuantification {
        experiment_accession: String!
        file_accession: String!
        transcript: Transcript
        gene: Gene
        len: Int!
        effective_len: Float!
        expected_count: Float!
        tpm: Float!
        fpkm: Float!
        iso_pct: Float!
        posterior_mean_count: Float!
        posterior_standard_deviation_of_count: Float!
        pme_tpm: Float!
        pme_fpkm: Float!
        iso_pct_from_pme_tpm: Float!
        tpm_ci_lower_bound: Float!
        tpm_ci_upper_bound: Float!
        fpkm_ci_lower_bound: Float!
        fpkm_ci_upper_bound: Float!
        tpm_coefficient_of_quartile_variation: Float
        fpkm_coefficient_of_quartile_variation: Float
    }

    type GenesCountResponse {
        chromosome: String!
        start: Int
        end: Int
        count: Int
    }

    input QuantificationRange {
        low: Float!
        high: Float!
    }

    input ChromRange {
        chromosome: String!
        start: Int
        stop: Int
    }

    enum UserCollectionImportStatus {
        QUEUED, IN_PROGRESS, ERROR, SUCCESS
    }

    type UserCollection {
        accession: ID!
        name: String!
        is_public: Boolean!
        import_status: UserCollectionImportStatus
    }

    type GeneAssociation {
        disease: String!
        gene_id: String!
        gene_name: String!
        twas_p: Float!
        twas_bonferroni: Float!
        hsq: Float!
        dge_fdr: Float!
        dge_log2fc: Float!
    }

    type GtexGenes {
        tissue_type: String!
        tissue_type_detail: String!
        gene_id: String!
        description: String!
        val: Float!
    }

    type SinglCellBoxPlot {
        gene: String!
        celltype: String!
        disease: String!
        max: Float!
        min: Float!
        median: Float!
        firstquartile: Float!
        thirdquartile: Float!
        mean_count: Float!
        expr_frac: Float!
    }

    type SingleCellGene {
        barcodekey: String
        n_genes: Int
        n_counts: Int
        channel: String
        anno: String
        subclass: String
        azimuth: String
        sampleid: String
        individualid: String
        celltype: String
        umap_1: Float
        umap_2: Float
        featurekey: String
        featureid: String
        n_cells: Int
        percent_cells: Float
        val: Float
    }

    type SingleCellType {
        barcodekey: String
        n_genes: Int
        n_counts: Int
        channel: String
        anno: String
        subclass: String
        azimuth: String
        celltype: String
        sampleid: String
        individualid: String
        umap_1: Float
        umap_2: Float
    }
    
    type QtlSigAssoc {
        snpid: String
        geneid: String
        qtltype: String
        dist: Float
        npval: Float
        slope: Float
        fdr: Float
    }
    type CaQtls {
        snpid: String
        type: String
         
    }

    type DeconQtls {
        geneid: String
        snpid: String
        snp_chrom: Int
        snp_start: Int
        nom_val: Float
        slope: Float
        adj_beta_pval: Float
        r_squared: Float
        celltype: String
    }

    type Deg {
        gene: String
        base_mean: Float
        log2_fc: Float
        lfc_se: Float
        stat: Float
        pvalue: Float
        padj: Float
        disease: String
        celltype: String
    }

    type TssRampageResponse {
        peakId: String
        geneId: String
        geneName: String
        locusType: String
        expAccession: String
        organ: String
        biosampleName: String
        biosampleSummary: String
        chrom: String
        start1: Int
        end1: Int
        start: Int
        end: Int
        strand: String
        col1: String        
        col2: String
        biosampleType: String
        value: Float
    }

    type RampageResponse  {
        transcriptId: String
        geneId: String
        expAccession: String
        fileAccession: String
        chrom: String
        start: Int
        end: Int
        strand: String
        type: String
        organ: String
        lifeStage: String
        tissue: String
        name: String
        biosampleType: String
        value: Float

    }
    type Query {

        
        resolve(
            id: String!
            assembly: String!
            limit: Int
        ): [GenomicObject!]!

        suggest(
            id: String!
            assembly: String!
            limit: Int
        ): [GenomicObject!]!

        gene_quantification(
            assembly: String!
            experiment_accession: [String]
            file_accession: [String]
            gene_id: [String]
            tpm_range: QuantificationRange
            fpkm_range: QuantificationRange
            limit: Int
            offset: Int
            sortByTpm: Boolean
            gene_id_prefix: [String]
            source: QuantDataSourceInput
        ): [GeneQuantification]

        transcript_quantification(
            assembly: String!
            experiment_accession: [String]
            file_accession: [String]
            transcript_id: [String]
            gene_id: [String]
            tpm_range: QuantificationRange
            fpkm_range: QuantificationRange
            limit: Int
            offset: Int
            sortByTpm: Boolean
            source: QuantDataSourceInput
        ): [TranscriptQuantification]

        gene(
            id: [String]
            name: [String]
            strand: String
            chromosome: String
            start: Int
            end: Int
            gene_type: String
            havana_id: String
            name_prefix: [String!]
            orderby: String
            assembly: String!
            limit: Int
            offset: Int
            version: Int
        ): [Gene]

        deconqtlsQuery(geneid: String, snpid: String): [DeconQtls]
        transcript(
            id: [String]
            name: [String]
            strand: String
            chromosome: String
            start: Int
            end: Int
            name_prefix: [String!]
            orderby: String
            assembly: String!
            limit: Int
            offset: Int
        ): [Transcript]

        rampageQuery(transcript_ids: [String!]): [RampageResponse]

        tssrampageQuery(genename: String!): [TssRampageResponse]
        gene_count(
            id: [String]
            name: [String]
            strand: String
            range: [ChromRange]
            gene_type: String
            havana_id: String
            name_prefix: [String!]
            assembly: String!
        ): [GenesCountResponse]

        nearby_genes(
            chromosome: String!
            start: Int!
            end: Int!
            gene_type: [String]
            assembly: String!
            distanceThreshold: Int
            limit: Int
            offset: Int
        ): [Gene]

        gene_dataset(
            tissue: [String]
            biosample: [String]
            lab: [String]
            cell_compartment: [String]
            assay_term_name: [String]
            biosample_type: [String]
            accession: [String]
            diagnosis: [String]
            sex: [String]
            study: [String]
            suicidaldeath: Boolean
            life_stage: String
            user_collection_accession: [String]
            limit: Int
            offset: Int
            source: QuantDataSourceInput
        ): [GeneDataset]

        degQuery(
            gene: String
            celltype: String
            disease: String!
        ):[Deg]
        qtlsigassocQuery(
            geneid: String
            snpid: String
            qtltype: String
        ): [QtlSigAssoc]
        caqtls(
            snpid: String!
        ): [CaQtls]

        my_user_collections: [UserCollection]!
        public_user_collections(limit: Int, offset: Int): [UserCollection]!
        user_collection(accession: ID!): UserCollection

        
        genesAssociationsQuery(
            disease: String!
            gene_id: String
            limit: Int
            offset: Int
        ): [GeneAssociation]

        gtex_genes(
            gene_id: [String]!
            tissue: [String]
            tissue_subcategory: [String]
        ): [GtexGenes]

        singleCellGenesQuery(
            disease: String!
            barcodekey: [String]
            featurekey: [String]
            featureid: [String]
        ):[SingleCellGene]

        singleCellUmapQuery(disease: String!): [SingleCellType]
        singleCellBoxPlotQuery( 
            disease: String!
            gene: [String]
            celltype: [String]
            limit: Int
            offset: Int
        ): [SinglCellBoxPlot]

        nearestGenes(
            coordinates: [ChromRange!]!
            assembly: String!
            limit: Int
            protein_coding: Boolean
        ): [NearbyGenes!]!

        getPedatasetValuesbyCelltypeQuery(dataset: [String]!, gene: String!):[PsychEncodeDatasetValues]
        getPedatasetValuesbySubclassQuery(dataset: [String]!, gene: String!):[PsychEncodeDatasetValues]
        
    }

    type NearbyGenes {
        intersecting_genes: [Gene!]!
        chromosome: String
        start: Int!
        end: Int!
        assembly: String!
    }

    type Mutation {
        create_user_collection(name: String!, is_public: Boolean): UserCollection!
        update_user_collection(accession: ID!, name: String, is_public: Boolean): UserCollection!
        delete_user_collection(accession: ID!): ID!
        queue_user_collection_import(accession: ID!): ID!

        create_user_dataset(
            user_collection_accession: ID!
            biosample: String!
            biosample_type: String
            tissue: String
            cell_compartment: String
            lab_name: String
            lab_friendly_name: String
            assay_term_name: String
            metadata : JSON
        ): GeneDataset!
        update_user_dataset(
            accession: ID!
            biosample: String
            biosample_type: String
            tissue: String
            cell_compartment: String
            lab_name: String
            lab_friendly_name: String
            assay_term_name: String
            metadata : JSON
        ): GeneDataset!
        delete_user_dataset(accession: ID!): ID!

        create_user_gene_quantification_file(
            dataset_accession: ID!,
            assembly: String,
            biorep: Int,
            techrep: Int
        ): GeneQuantificationFile!
        update_user_gene_quantification_file(
            accession: ID!,
            assembly: String,
            biorep: Int,
            techrep: Int
        ): GeneQuantificationFile!
        delete_user_gene_quantification_file(accession: ID!): ID!

        create_user_transcript_quantification_file(
            dataset_accession: ID!,
            assembly: String,
            biorep: Int,
            techrep: Int
        ): GeneQuantificationFile!
        update_user_transcript_quantification_file(
            accession: ID!,
            assembly: String,
            biorep: Int,
            techrep: Int
        ): GeneQuantificationFile!
        delete_user_transcript_quantification_file(accession: ID!): ID!

    }
`;

export const schema = buildFederatedSchema([ { typeDefs, resolvers } ]);
