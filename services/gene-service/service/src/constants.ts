import { QuantificationDataSourceType, QuantificationDataSource, FeatureDataSource, FeatureDataSourceType } from "./postgres/types";

export const DEFAULT_GENCODE_VERSIONS: { [assembly: string]: number } = {
    hg19: 19,
    grch38: 30,
    mm10: 21
};

export const DEFAULT_QUANT_SOURCE: QuantificationDataSource = { 
    type: QuantificationDataSourceType.ENCODE 
};

export const DEFAULT_FEATURE_SOURCE: FeatureDataSource = {
    type: FeatureDataSourceType.GENCODE
}

/**
 * Determines the GENCODE version to use for a query. If the version field is present in the parameters object, it is
 * used; otherwise, the default for the given assembly is used.
 *
 * @param parameters the search parameters by which to select genes.
 * @param assembly the genomic assembly to search.
 */
export function getGencodeVersion(parameters: { [key: string]: any }, assembly: string): number {
    return parameters.version || DEFAULT_GENCODE_VERSIONS[assembly.toLowerCase()];
}
