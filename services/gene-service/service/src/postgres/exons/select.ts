import { IDatabase } from "pg-promise";

import { ExonParameters, GeneParameters, TranscriptParameters, ExonResult } from "../types";
import { featureSchema } from "../utilities";
import { getGencodeVersion, DEFAULT_FEATURE_SOURCE } from '../../constants';

import { fieldMatches, ParameterMap, conditionClauses, whereClause } from "queryz";
import { TRANSCRIPT_PARAMETERS } from "../transcripts";
import { GENE_PARAMETERS } from "../genes";
import { FEATURE_PARAMETERS } from "../genes/select";

export const EXON_CONDITIONS: ParameterMap<ExonParameters> = new Map([
    [ "exon_number", fieldMatches("exon_number") ],
    ...FEATURE_PARAMETERS
]);

/**
 * Selects all exons for transcripts which match search criteria.
 * @param assembly the genomic assembly to search.
 * @param transcript_parameters parameters by which to filter transcripts.
 * @param exon_parameters parameters by which to filter exons matching the filtered transcripts.
 * @param db connection to the database.
 */
export async function selectExonsByTranscript(
    assembly: string, transcript_parameters: TranscriptParameters, exon_parameters: ExonParameters, db: IDatabase<any>
): Promise<ExonResult[]> {
    const version = getGencodeVersion(transcript_parameters, assembly);
    const schema = featureSchema(transcript_parameters.source || DEFAULT_FEATURE_SOURCE);
    const tableName = `exon_${assembly.toLowerCase()}_${version}`;
    const transcriptTableName = `transcript_${assembly.toLowerCase()}_${version}`;
    transcript_parameters.name_prefix = transcript_parameters.name_prefix?.map(x => x + "%");
    exon_parameters.name_prefix = exon_parameters.name_prefix?.map(x => x + "%");
    const conditions = [
        ...conditionClauses(transcript_parameters, TRANSCRIPT_PARAMETERS, "t"),
        ...conditionClauses(exon_parameters, EXON_CONDITIONS, "e"),
        "t.id = e.parent_transcript"
    ];
    return db.any(`
        SELECT e.id, e.name, e.chromosome, e.start, e.stop, e.project, e.score, e.strand, exon_number, parent_transcript
          FROM \${schema~}.\${tableName~} AS e, \${schema~}.\${transcriptTableName~} AS t
         WHERE ${whereClause(conditions)}
         ${exon_parameters.limit ? `LIMIT ${exon_parameters.limit}` : ""}
    `, { schema, tableName, transcriptTableName, e: exon_parameters, t: transcript_parameters });
}

/**
 * Selects all exons for genes which match search criteria.
 * @param assembly the genomic assembly to search.
 * @param gene_parameters parameters by which to filter genes.
 * @param exon_parameters parameters by which to filter exons matching the filtered genes.
 * @param db connection to the database.
 */
export async function selectExonsByGene(
    assembly: string, gene_parameters: GeneParameters, exon_parameters: ExonParameters, db: IDatabase<any>
): Promise<ExonResult[]> {
    const version = getGencodeVersion(gene_parameters, assembly);
    const schema = featureSchema(gene_parameters.source || DEFAULT_FEATURE_SOURCE);
    const tableName = `exon_${assembly.toLowerCase()}_${version}`;
    const transcriptTableName = `transcript_${assembly.toLowerCase()}_${version}`;
    const geneTableName = `gene_${assembly.toLowerCase()}_${version}`;
    gene_parameters.name_prefix = gene_parameters.name_prefix?.map(x => x + "%");
    exon_parameters.name_prefix = exon_parameters.name_prefix?.map(x => x + "%");
    const conditions = [
        ...conditionClauses(gene_parameters, GENE_PARAMETERS, "g"),
        ...conditionClauses(exon_parameters, EXON_CONDITIONS, "e"),
        "t.id = e.parent_transcript",
        "g.id = t.parent_gene"
    ];
    return db.any(`
        SELECT e.id, e.name, e.chromosome, e.start, e.stop, e.project, e.score, e.strand, exon_number, parent_transcript
          FROM \${schema~}.\${tableName~} AS e, \${schema~}.\${transcriptTableName~} AS t, \${schema~}.\${geneTableName~} AS g
         WHERE ${whereClause(conditions)}
         ${exon_parameters.limit ? `LIMIT ${exon_parameters.limit}` : ""}
    `, { schema, tableName, transcriptTableName, geneTableName, e: exon_parameters, g: gene_parameters });
}
