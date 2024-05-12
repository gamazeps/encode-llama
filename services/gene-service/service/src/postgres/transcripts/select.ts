import { IDatabase } from "pg-promise";

import { GeneParameters, TranscriptParameters, TranscriptResult } from "../types";
import { featureSchema } from "../utilities";
import { getGencodeVersion, DEFAULT_FEATURE_SOURCE } from '../../constants';

import { GENE_PARAMETERS } from "../genes";
import { conditionClauses, fieldMatches, fieldMatchesAny, ParameterMap, whereClause } from "queryz";
import { FEATURE_PARAMETERS } from "../genes/select";

export const TRANSCRIPT_PARAMETERS: ParameterMap<TranscriptParameters> = new Map([
    [ "transcript_type", fieldMatches("transcript_type") ],
    [ "havana_id", fieldMatches("havana_id") ],
    [ "support_level", fieldMatches("support_level") ],
    [ "tag", fieldMatches("tag") ],
    [ "idPrefix", fieldMatchesAny("idPrefix") ],
    ...FEATURE_PARAMETERS
]);

/**
 * Selects all transcripts for genes which match search criteria.
 * @param assembly the genomic assembly to search.
 * @param gene_parameters parameters by which to filter genes.
 * @param transcript_parameters parameters by which to filter transcripts matching the filtered genes.
 * @param db connection to the database.
 */
export async function selectTranscriptsByGene(
    assembly: string, gene_parameters: GeneParameters, transcript_parameters: TranscriptParameters, db: IDatabase<any>
): Promise<TranscriptResult[]> {
    const version = getGencodeVersion(gene_parameters, assembly);
    const schema = featureSchema(gene_parameters.source || DEFAULT_FEATURE_SOURCE);
    const tableName = `transcript_${assembly.toLowerCase()}_${version}`;
    const geneTableName = `gene_${assembly.toLowerCase()}_${version}`;
    gene_parameters.name_prefix = gene_parameters?.name_prefix?.map(x => x + "%");
    transcript_parameters.name_prefix = transcript_parameters?.name_prefix?.map(x => x + "%");
    const conditions = [
        ...conditionClauses(gene_parameters, GENE_PARAMETERS, "g"),
        ...conditionClauses(transcript_parameters, TRANSCRIPT_PARAMETERS, "t"),
        "g.id = t.parent_gene"
    ];
    return db.any(`
        SELECT t.id, t.name, t.chromosome, t.start, t.stop, t.project, t.score, t.strand, transcript_type, t.havana_id, support_level, tag, parent_gene
          FROM \${schema~}.\${tableName~} AS t, \${schema~}.\${geneTableName~} AS g
         WHERE ${whereClause(conditions)}
         ${ transcript_parameters.limit ? ` LIMIT ${transcript_parameters.limit}` : "" }
    `, { schema, tableName, geneTableName, t: transcript_parameters, g: gene_parameters });
}

/**
  * Returns all transcripts matching the given search criteria.
  * @param assembly the genomic assembly to search.
  * @param parameters the search parameters by which to select transcripts.
  * @param db connection to the database.
 */
export async function selectTranscripts(assembly: string, parameters: TranscriptParameters, db: IDatabase<any>): Promise<TranscriptResult[]> {
    const version = getGencodeVersion(parameters, assembly);
    const schema = featureSchema(parameters.source || DEFAULT_FEATURE_SOURCE);
    const tableName = `transcript_${assembly.toLowerCase()}_${version}`;
    parameters.name_prefix = parameters.name_prefix?.map(x => x + "%");
    return db.any(`
        SELECT t.id, t.name, t.chromosome, t.start, t.stop, t.project, t.score, t.strand, transcript_type, t.havana_id, support_level, tag, parent_gene
          FROM \${schema~}.\${tableName~} AS t
         WHERE ${whereClause(conditionClauses(parameters, TRANSCRIPT_PARAMETERS, "t"))}
         ORDER BY id
         ${ parameters.limit ? ` LIMIT ${parameters.limit}` : "" }
         ${ parameters.offset ? ` OFFSET ${parameters.offset}` : "" }
    `, { schema, tableName, t: parameters });
}
