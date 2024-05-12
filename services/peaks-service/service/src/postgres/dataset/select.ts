import { IDatabase } from "pg-promise";
import { conditionClauses, fieldMatchesAny, ParameterMap, whereClause } from "queryz";

import { DatasetRow, DatasetCountRow } from "../types";
import { DatasetSelectionParameters } from "./types";

export const DATASET_PARAMETERS: ParameterMap<DatasetSelectionParameters> = new Map([
    [ "target_prefix", tableName => `${tableName}.target ILIKE \${${tableName}.target_prefix} || '%%'` ],
    [ "biosample", tableName => `lower(${tableName}.biosample) = lower(\${${tableName}.biosample})` ],
    [ "biosample_prefix", tableName => `${tableName}.biosample ILIKE \${${tableName}.biosample_prefix} || '%%'` ],
    [ "target", tableName => `lower(${tableName}.target) = lower(\${${tableName}.target})` ],
    [ "lab", tableName => `lower(${tableName}.lab_name) = lower(\${${tableName}.lab}) OR lower(${tableName}.lab_friendly_name) = lower(\${${tableName}.lab})`],
    [ "project", tableName => `lower(${tableName}.project) = lower(\${${tableName}.project})` ],
    [ "species", tableName => `lower(${tableName}.species) = lower(\${${tableName}.species})` ],
    [ "source", tableName => `lower(${tableName}.source) = lower(\${${tableName}.source})`],
    [ "include_investigatedas", tableName => `${tableName}.investigated_as && \${${tableName}.include_investigatedas}`],
    [ "exclude_investigatedas", tableName => `NOT (${tableName}.investigated_as && \${${tableName}.exclude_investigatedas})` ],
    [ "accession", fieldMatchesAny("accession") ],
    [ "replicated_peak_accession", (tableName, parameters) => `
        ${tableName}.accession = (
            SELECT dataset_accession FROM ${parameters.assay}_replicated_peaks WHERE accession = \${${tableName}.replicated_peak_accession}
        )
    `],
    [ "developmental_slims", tableName => `\${${tableName}.developmental_slims} && ${tableName}.developmental_slims` ],
    [ "cell_slims", tableName => `\${${tableName}.cell_slims} && ${tableName}.cell_slims` ],
    [ "organ_slims", tableName => `\${${tableName}.organ_slims} && ${tableName}.organ_slims` ],
    [ "system_slims", tableName => `\${${tableName}.system_slims} && ${tableName}.system_slims` ],
    [ "processed_assembly", (tableName, parameters) => parameters.replicated_peaks ? `
        ${tableName}.accession IN (        
            SELECT DISTINCT(dataset_accession)
            FROM (           
                SELECT dataset_accession FROM ${parameters.assay}_replicated_peaks WHERE lower(assembly) = lower(\${${tableName}.processed_assembly})
            ) allfiles
        )
    ` : `
        ${tableName}.accession IN (
            SELECT DISTINCT(dataset_accession)
            FROM (
                SELECT dataset_accession FROM ${parameters.assay}_unfiltered_alignments WHERE lower(assembly) = lower(\${${tableName}.processed_assembly})
                UNION ALL
                SELECT dataset_accession FROM ${parameters.assay}_filtered_alignments WHERE lower(assembly) = lower(\${${tableName}.processed_assembly})
                UNION ALL
                SELECT dataset_accession FROM ${parameters.assay}_unreplicated_peaks WHERE lower(assembly) = lower(\${${tableName}.processed_assembly})
                UNION ALL
                SELECT dataset_accession FROM ${parameters.assay}_replicated_peaks WHERE lower(assembly) = lower(\${${tableName}.processed_assembly})
                UNION ALL
                SELECT dataset_accession FROM ${parameters.assay}_normalized_signal WHERE lower(assembly) = lower(\${${tableName}.processed_assembly})
            ) allfiles
        )
    `]
]);

/**
 * Creates a promise for selecting dataset rows from the database by target and/or biosample and/or lab and/or project.
 * @param parameters object containing search parameters, including target, biosample, lab, project, and species.
 * @param db connection to the database.
 */
export async function selectDatasets(parameters: DatasetSelectionParameters, db: IDatabase<any>): Promise<DatasetRow[]> {
    return db.any(`
        SELECT accession, target, released, biosample, lab_name, investigated_as,
               lab_friendly_name, project, source, species, developmental_slims, cell_slims, organ_slims, system_slims
          FROM ${parameters.assay?.replace("-", "_")}_datasets AS datasets
         WHERE ${whereClause(conditionClauses(parameters, DATASET_PARAMETERS, "datasets"))}
    `, { datasets: parameters });
}

/**
 * Creates a promise for selecting dataset rows from the database by dataset accessions.
 * @param accessions list of dataset accessions.
 * @param db connection to the database.
 */
export async function selectDatasetsByAccessions(accessions: string[], db: IDatabase<any>, assay: string): Promise<DatasetRow[]> {
    return db.any(`
        SELECT accession, target, released, biosample, lab_name, lab_friendly_name, project
               source, species, developmental_slims, cell_slims, organ_slims, system_slims
          FROM ${assay.replace("-", "_")}_datasets AS datasets
          JOIN unnest(\${accessions}) WITH ORDINALITY AS t(accession, ord) ON datasets.accession = t.accession
         ORDER BY t.ord ASC
    `, { accessions });
}

/**
 * Creates a promise for counting unique features of dataset rows from the database for a given set of dataset accessions.
 * @param datasets list of dataset accessions
 * @param db connection to the database
 */
export async function selectDatasetCounts(datasets: string[], db: IDatabase<any>, assay: string[]): Promise<DatasetCountRow> {
    const query: string = assay.map( a => `       
        SELECT COUNT(*)::INT AS total, COUNT(DISTINCT target)::INT AS targets, COUNT(DISTINCT biosample)::INT AS biosamples,
            COUNT(DISTINCT species)::INT AS species, COUNT(DISTINCT project)::INT AS projects, COUNT(DISTINCT lab_name)::INT AS labs
            FROM ${a.replace("-", "_")}_datasets AS datasets
        WHERE datasets.accession = ANY(${"${datasets}"})
    `).join(" UNION ALL ");
    let total = 0, targets = 0, biosamples = 0, species = 0, projects = 0, labs = 0;
    (await db.any(query, { datasets })).forEach((d) => {
        total += d.total;
        targets += d.targets;
        biosamples += d.biosamples;
        species += d.species;
        projects += d.projects;
        labs += d.labs;
    });
    return {
        total,
        targets,
        biosamples,
        species,
        projects,
        labs
    };
}
