import { gql } from "apollo-server-core";
import { buildFederatedSchema } from "@apollo/federation";
import { resolvers } from "./resolvers";

export const typeDefs = gql`
    scalar DateScalar
    scalar PeaksResponseData
    
    input ChromosomeRangeInput {
        chrom: String!
        chrom_start: Int!
        chrom_end: Int!
    }

    type Assembly {
        name: String!
        species: String!
        "Returns a collection of datasets that have files processed using this assembly"
        datasets: DatasetCollection!
    }

    type Biosample {
        name: String!
        species: String!
        datasets: DatasetCollection!
    }

    type Species {
        name: String!
        datasets: DatasetCollection!
    }

    type Target {
        name: String
        target_desc: Factor
        datasets: DatasetCollection!
    }

    extend type Factor @key(fields: "name assembly") {
        name: String! @external
        assembly: String! @external
    }

    type TargetPeaks {
        name: String
        peaks: PeaksCollection!
    }

    type Peak {
        experiment_accession: String!
        file_accession: String!
        chrom: String!
        chrom_start: Int!
        chrom_end: Int!
        name: String!
        score: Int!
        strand: String!
        signal_value: Float!
        p_value: Float!
        q_value: Float!
        peak: Int!
        dataset: PeakDataset!
        signal_over_peaks: BigResponseWithRange        
    }

    extend type BigResponseWithRange @key(fields: "chrom start end url") {
        chrom: String! @external
        start: Int! @external
        end: Int! @external
        url: String! @external
    }
    type PeakCount {
        count: Int!
    }

    type Query {
        assemblies(species: String, assembly: String, searchterm: [String]): [Assembly!]!
        biosamples(
            species: String
            target: String
            project: String
            lab: String
            replicated_peaks: Boolean
            include_investigatedas: [String]
            exclude_investigatedas: [String]
            processed_assembly: String
            biosample_prefix: String
            limit: Int
            searchterm: [String]
        ): [Biosample!]!
        species(project: String, lab: String, target: String, biosample: String, searchterm: [String]): [Species!]!
        targets(
            species: String
            target: String
            project: String
            lab: String
            target_prefix: String
            replicated_peaks: Boolean
            include_investigatedas: [String]
            exclude_investigatedas: [String]
            processed_assembly: String
            limit: Int
            searchterm: [String]
        ): [Target!]!
        peakDataset(
            accession: [String]
            processed_assembly: String
            species: String
            target: String
            project: String
            source: String
            lab: String
            biosample: String
            searchterm: [String]
            replicated_peaks: Boolean
            include_investigatedas: [String]
            exclude_investigatedas: [String]
            replicated_peak_accession: String
            developmental_slims: [String]
            cell_slims: [String]
            organ_slims: [String]
            system_slims: [String]
        ): DatasetCollection!
        peaks(
            assembly: String
            target: String
            experiment_accession: String
            file_accession: String
            range: [ChromosomeRangeInput]!
            searchterm: [String]
            type: [String]
        ): PeaksCollection!
        peaksrange(
            assembly: String
            target: String
            biosample: String
            experiment_accession: String
            file_accession: String
            range: [ChromosomeRangeInput]!
            type: [String]
            limit: Int
            offset: Int
            orderby: Boolean
        ): PeaksResponse
        peaksrangecount(
            assembly: String
            target: String
            biosample: String
            experiment_accession: String
            file_accession: String
            range: [ChromosomeRangeInput]!
            type: [String]
            limit: Int
        ): Boolean
        peakCount(assembly: String, assay: String): PeakCount
    }
    type RequestError {
        errortype: String
        message: String
    }
    type PeaksResponse {
        data: PeaksResponseData
        error: RequestError
    }

    interface File {
        accession: String!
        dataset: PeakDataset!
        type: String!
    }

    type SequenceReads implements File {
        accession: String!
        dataset: PeakDataset!
        type: String!
        paired_end: Boolean!
        read_id: Int!
        biorep: Int
        techrep: Int
        url: String
    }

    type UnfilteredAlignments implements File {
        accession: String!
        dataset: PeakDataset!
        type: String!
        assembly: Assembly!
        biorep: Int
        techrep: Int
        url: String
    }

    type FilteredAlignments implements File {
        accession: String!
        dataset: PeakDataset!
        type: String!
        assembly: Assembly!
        biorep: Int
        techrep: Int
        url: String
    }

    type UnreplicatedPeaks implements File {
        accession: String!
        dataset: PeakDataset!
        type: String!
        assembly: Assembly!
        biorep: Int
        techrep: Int
        url: String
        peaks(chrom: String!, chrom_start: Int!, chrom_end: Int!): [Peak!]!
    }

    type BigBedUnreplicatedPeaks implements File {
        accession: String!
        dataset: PeakDataset!
        type: String!
        assembly: Assembly!
        biorep: Int
        techrep: Int
        url: String
        peaks(chrom: String!, chrom_start: Int!, chrom_end: Int!): [Peak!]!
    }

    type ReplicatedPeaks implements File {
        accession: String!
        dataset: PeakDataset!
        type: String!
        assembly: Assembly!
        url: String
    }

    type BigBedReplicatedPeaks implements File {
        accession: String!
        dataset: PeakDataset!
        type: String!
        assembly: Assembly!
        url: String
    }

    type NormalizedSignal implements File {
        accession: String!
        dataset: PeakDataset!
        type: String!
        assembly: Assembly!
        biorep: Int
        techrep: Int
        url: String
    }

    type Lab {
        name: String
        friendly_name: String
    }

    type DatasetCounts {
        total: Int!
        targets: Int!
        biosamples: Int!
        species: Int!
        projects: Int!
        labs: Int!
    }

    type PeakDataset @key(fields: "accession") {
        accession: String!
        target: String
        released: DateScalar
        project: String!
        source: String!
        biosample: String!
        lab: Lab
        species: String!
        developmental_slims: [String]
        cell_slims: [String]
        organ_slims: [String]
        system_slims: [String]
	investigated_as: [String]
        """
        Returns all files from this dataset. Can filter by the processed assembly.
        NOTE: files with no assembly (i.e. sequence reads) will be returned regardless of assembly filter
        Can also filter by file types.
        Current types are:
        - sequence_reads
        - unfiltered_alignments
        - filtered_alignments
        - unreplicated_peaks
        - replicated_peaks
        - normalized_signal
        """
        files(types: [String!], assembly: String): [File!]!
    }

    interface PeaksCollection {
        peaks: [Peak!]!
        count: PeaksCounts
        partitionByTarget(
            """
            If a name is provided, only targets that exactly match the provided name will be included (in the future, this may be expanded to allow regex).
            """
            name: String
        ): [TargetPeaksPartitionCollection!]!
    }

    interface DatasetCollection {
        datasets: [PeakDataset!]!
        counts: DatasetCounts!
        partitionByBiosample(
            """
            If a name is provided, only biosamples that exactly match the provided name will be included (in the future, this may be expanded to allow regex).
            """
            name: String
        ): [BiosamplePartitionCollection!]!
        partitionByTarget(
            """
            If a name is provided, only targets that exactly match the provided name will be included (in the future, this may be expanded to allow regex).
            """
            name: String
        ): [TargetPartitionCollection!]!
        partitionByLab(
            """
            If a name is provided, only labs that exactly match the provided name will be included (in the future, this may be expanded to allow regex).
            """
            name: String
        ): [LabPartitionCollection!]!
    }

    type BiosamplePartitionCollection implements DatasetCollection {
        biosample: Biosample!
        counts: DatasetCounts!
        datasets: [PeakDataset!]!
        partitionByBiosample(name: String): [BiosamplePartitionCollection!]!
        partitionByTarget(name: String): [TargetPartitionCollection!]!
        partitionByLab(name: String): [LabPartitionCollection!]!
    }

    type TargetPartitionCollection implements DatasetCollection {
        """
        Null only if all datasets in this collection do not have a target.
        """
        target: Target
        counts: DatasetCounts!
        datasets: [PeakDataset!]!
        partitionByBiosample(name: String): [BiosamplePartitionCollection!]!
        partitionByTarget(name: String): [TargetPartitionCollection!]!
        partitionByLab(name: String): [LabPartitionCollection!]!
    }

    type TargetPeaksPartitionCollection implements PeaksCollection {
        """
        Null only if all datasets in this collection do not have a target.
        """
        target: TargetPeaks
        peaks: [Peak!]!
        count: PeaksCounts
        partitionByTarget(name: String): [TargetPeaksPartitionCollection!]!
    }

    type LabPartitionCollection implements DatasetCollection {
        lab: Lab!
        counts: DatasetCounts!
        datasets: [PeakDataset!]!
        partitionByBiosample(name: String): [BiosamplePartitionCollection!]!
        partitionByTarget(name: String): [TargetPartitionCollection!]!
        partitionByLab(name: String): [LabPartitionCollection!]!
    }

    type Collection implements DatasetCollection {
        counts: DatasetCounts!
        datasets: [PeakDataset!]!
        partitionByBiosample(name: String): [BiosamplePartitionCollection!]!
        partitionByTarget(name: String): [TargetPartitionCollection!]!
        partitionByLab(name: String): [LabPartitionCollection!]!
    }

    type PCollection implements PeaksCollection {
        peaks: [Peak!]!
        count: PeaksCounts
        partitionByTarget(name: String): [TargetPeaksPartitionCollection!]!
    }

    type PeaksCounts {
        total: Int!
        peaks: Int!
    }
`;

export const schema = buildFederatedSchema([{ typeDefs, resolvers }]);

