import { GraphQLResolverMap } from "apollo-graphql";
import { eQTLResolvers, eQTLQueries } from "./eQTL";
import { ldResolvers } from "./ldblocks";
import { mafQueries, mafResolvers } from "./maf";
import { snpResolvers, snpQueries } from "./snp";
import { studyResolvers, studyQueries } from "./studies";
import { resolveQueries } from './resolve';

export const resolvers: GraphQLResolverMap = {
    Query: {
        ...eQTLQueries,
        ...snpQueries,
        ...studyQueries,
        ...resolveQueries,
        ...mafQueries

    },
    Population: {
        AFRICAN: "AFR",
        AMERICAN: "AMR",
        EAST_ASIAN: "EAS",
        EUROPEAN: "EUR",
        SOUTH_ASIAN: "SAS"
    },
    SubPopulation: {
        HAN_CHINESE_BEIJING: "CHB",
        JAPANESE: "JPT",
        SOUTHERN_HAN_CHINESE: "CHS",
        DAI: "CDX",
        KINH: "KHV",
        UTAH_RESIDENT_NW_EUROPEAN: "CEU",
        TOSCANI: "TSI",
        FINNISH: "FIN",
        BRITISH: "GBR",
        IBERIAN: "IBS",
        YORUBA: "YRI",
        LUHYA: "LWK",
        GAMBIAN: "GWD",
        MENDE: "MSL",
        ESAN: "ESN",
        AFRICAN_AMERICAN: "ASW",
        AFRICAN_CARIBBEAN: "ACB",
        MEXICAN: "MXL",
        PUERTO_RICAN: "PUR",
        COLOMBIAN: "CLM",
        PERUVIAN: "PEL",
        GUJARATI: "GIH",
        PUNJABI: "PJL",
        BENGALI: "BEB",
        SRI_LANKAN_TAMIL: "STU",
        INDIAN_TELUGU: "ITU"
    },
    ...eQTLResolvers,
    ...ldResolvers,
    ...mafResolvers,
    ...snpResolvers,
    ...studyResolvers
};
