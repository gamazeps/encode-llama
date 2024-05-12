import { gql } from "apollo-server-express";
import { resolvers } from "../resolvers";
import { buildFederatedSchema } from "@apollo/federation";

const typeDefs = gql`
    scalar JSON
    type Factor @key(fields: "name assembly") {
        gene_id: String
        name: String!
        assembly: String!
        coordinates: GenomeRange
        uniprot_data: String
        ncbi_data: String
        hgnc_data: HgncData
        ensemble_data: EnsembleData
        modifications: Modifications
        pdbids: String
        factor_wiki: String
        dbd: [String]
        isTF: Boolean
        color: String
    }
    type Modifications {
        name: String
        title: String
        symbol: String
        modification: [ModificationData]
    }
    type ModificationData {
        position: String
        modification: String
        amino_acid_code: String
    }
    type EnsembleData {
        id: String
        display_name: String
        biotype: String
        description: String
        hgnc_synonyms: [String]
        hgnc_primary_id: String
        version: String
        ccds_id: [String]
        uniprot_synonyms: [String]
        uniprot_primary_id: String
    }
    type HgncData {
        hgnc_id: String
        symbol: String
        name: String
        uniprot_ids: [String]
        locus_type: String
        prev_symbol: [String]
        prev_name: [String]
        location: String
        entrez_id: String
        gene_group: [String]
        gene_group_id: [String]
        ccds_id: [String]
        locus_group: String
        alias_symbol: [String]
    }
    type GenomeRange {
        chromosome: String
        start: Int
        end: Int
    }
    type Celltype {
        celltype: String
        wiki_desc: String
        ct_image_url: String
    }
    extend type Query {
        factor(limit: Int, name_prefix: String,  isTF: Boolean, id: [String], name: [String], assembly: String!): [Factor]
        celltype(name: [String], assembly: String!): [Celltype]
    }
`;

export const schema = buildFederatedSchema([{ typeDefs, resolvers }]);
