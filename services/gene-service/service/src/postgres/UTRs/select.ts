import { IDatabase } from "pg-promise";

import { UTRParameters, ExonParameters, GeneParameters, TranscriptParameters, UTRResult } from "../types";
import { featureSchema } from "../utilities";
import { getGencodeVersion, DEFAULT_FEATURE_SOURCE } from '../../constants';

import { GENE_PARAMETERS } from "../genes";
import { EXON_CONDITIONS } from "../exons/select";
import { conditionClauses, fieldMatches, ParameterMap, whereClause } from "queryz";
import { TRANSCRIPT_PARAMETERS } from "../transcripts";
import { FEATURE_PARAMETERS } from "../genes/select";

const UTR_PARAMETERS: ParameterMap<UTRParameters> = new Map([
    [ "phase", fieldMatches("phase") ],
    [ "direction", fieldMatches("direction") ],
    [ "parent_protein", fieldMatches("parent_protein") ],
    [ "tag", fieldMatches("tag") ],
    ...FEATURE_PARAMETERS
]);

/**
 * Selects all UTRs for exons which match search criteria.
 * @param assembly the genomic assembly to search.
 * @param exon_parameters parameters by which to filter exons.
 * @param utr_parameters parameters by which to filter UTRs matching the filtered exons.
 * @param db connection to the database.
 */
export async function selectUTRsByExon(
    assembly: string, exon_parameters: ExonParameters, utr_parameters: UTRParameters, db: IDatabase<any>
): Promise<UTRResult[]> {
    const version = getGencodeVersion(exon_parameters, assembly);
    const schema = featureSchema(exon_parameters.source || DEFAULT_FEATURE_SOURCE);
    const tableName = `utr_${assembly.toLowerCase()}_${version}`;
    const exonTableName = `exon_${assembly.toLowerCase()}_${version}`;
    exon_parameters.name_prefix = exon_parameters?.name_prefix?.map(x => x + "%");
    utr_parameters.name_prefix = utr_parameters?.name_prefix?.map(x => x + "%");
    const conditions = [
        ...conditionClauses(exon_parameters, EXON_CONDITIONS, "e"),
        ...conditionClauses(utr_parameters, UTR_PARAMETERS, "u"),
        "e.name = u.parent_exon"
    ];
    return db.any(`
        SELECT u.id, u.chromosome, u.start, u.stop, u.project, u.score, u.strand, direction, u.phase,parent_exon, parent_protein, u.tag
          FROM \${schema~}.\${tableName~} AS u, \${schema~}.\${exonTableName~} AS e
         WHERE ${whereClause(conditions)}
         ORDER BY id
         ${ utr_parameters.limit ? `LIMIT ${utr_parameters.limit} ` : ""}
    `, { schema, tableName, exonTableName, u: utr_parameters, e: exon_parameters });
}

/**
 * Selects all UTRs for transcripts which match search criteria.
 * @param assembly the genomic assembly to search.
 * @param transcript_parameters parameters by which to filter transcripts.
 * @param utr_parameters parameters by which to filter UTRs matching the filtered transcripts.
 * @param db connection to the database.
 */
export async function selectUTRsByTranscript(
    assembly: string, transcript_parameters: TranscriptParameters, utr_parameters: UTRParameters, db: IDatabase<any>
): Promise<UTRResult[]> {
    const version = getGencodeVersion(transcript_parameters, assembly);
    const schema = featureSchema(transcript_parameters.source || DEFAULT_FEATURE_SOURCE);
    const tableName = `utr_${assembly.toLowerCase()}_${version}`;
    const transcriptTableName = `transcript_${assembly.toLowerCase()}_${version}`;
    transcript_parameters.name_prefix = transcript_parameters?.name_prefix?.map(x => x + "%");
    utr_parameters.name_prefix = utr_parameters?.name_prefix?.map(x => x + "%");
    const conditions = [
        ...conditionClauses(transcript_parameters, TRANSCRIPT_PARAMETERS, "t"),
        ...conditionClauses(utr_parameters, UTR_PARAMETERS, "u"),
        "e.name = u.parent_exon",
        "t.id = e.parent_transcript"
    ];
    return db.any(`
        SELECT u.id, u.chromosome, u.start, u.stop, u.project, u.score, u.strand, direction, u.phase, parent_exon, parent_protein, u.tag
          FROM \${schema~}.\${tableName~} AS u, \${schema~}.\${exonTableName~} AS e, \${schema~}.\${transcriptTableName~} AS t
         WHERE ${whereClause(conditions)}
         ${ utr_parameters.limit ? ` LIMIT ${utr_parameters.limit}` : "" }
    `, { schema, tableName, transcriptTableName, u: utr_parameters, t: transcript_parameters });
}

/**
 * Selects all UTRs for genes which match search criteria.
 * @param assembly the genomic assembly to search.
 * @param gene_parameters parameters by which to filter genes.
 * @param utr_parameters parameters by which to filter UTRs matching the filtered genes.
 * @param db connection to the database.
 */
export async function selectUTRsByGene(
    assembly: string, gene_parameters: GeneParameters, utr_parameters: UTRParameters, db: IDatabase<any>
): Promise<UTRResult[]> {
    const version = getGencodeVersion(gene_parameters, assembly);
    const schema = featureSchema(gene_parameters.source || DEFAULT_FEATURE_SOURCE);
    const tableName = `${schema}.utr_${assembly.toLowerCase()}_${version}`;
    const geneTableName = `${schema}.gene_${assembly.toLowerCase()}_${version}`;
    gene_parameters.name_prefix = gene_parameters?.name_prefix?.map(x => x + "%");
    utr_parameters.name_prefix = utr_parameters?.name_prefix?.map(x => x + "%");
    const conditions = [
        ...conditionClauses(gene_parameters, GENE_PARAMETERS, "g"),
        ...conditionClauses(utr_parameters, UTR_PARAMETERS, "u"),
        "e.name = u.parent_exon",
        "t.id = e.parent_transcript",
        "g.id = t.parent_gene"
    ];
    return db.any(`
        SELECT u.id, u.chromosome, u.start, u.stop, u.project, u.score, u.strand, direction, u.phase, parent_exon, parent_protein, u.tag
          FROM \${tableName~} AS u, \${exonTableName~} AS e, \${transcriptTableName~} AS t, \${geneTableName~} AS g
         WHERE ${whereClause(conditions)}
         ${ utr_parameters.limit ? ` LIMIT ${utr_parameters.limit}` : "" }
    `, { tableName, geneTableName, u: utr_parameters, g: gene_parameters });
}
