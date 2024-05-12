import { IDatabase } from "pg-promise";
import { conditionClauses, fieldMatches, fieldMatchesAny, ParameterMap, whereClause } from "queryz";
import { FileType, FileRow } from "../types";
import { FileSelectionParameters } from "./types";

const SEQUENCE_READ_SELECTION_PARAMETERS: ParameterMap<FileSelectionParameters> = new Map([
    [ "accession", fieldMatchesAny("accession") ],
    [ "assembly", _ => "TRUE" ]
]);

const FILE_SELECTION_PARAMETERS: ParameterMap<FileSelectionParameters> = new Map([
    [ "accession", fieldMatchesAny("accession") ],
    [ "assembly", fieldMatches("assembly") ]
]);

export const FILE_SELECTION_PARAMETER_MAPS: Map<string, ParameterMap<FileSelectionParameters>> = new Map([
    [ "sequence_reads", SEQUENCE_READ_SELECTION_PARAMETERS ],
    [ "replicated_peaks", FILE_SELECTION_PARAMETERS ],
    [ "bigbed_replicated_peaks", FILE_SELECTION_PARAMETERS ],
    [ "bigbed_unreplicated_peaks", FILE_SELECTION_PARAMETERS ],
    [ "unfiletered_alignments", FILE_SELECTION_PARAMETERS ],
    [ "filtered_alignments", FILE_SELECTION_PARAMETERS ],
    [ "normalized_signal", FILE_SELECTION_PARAMETERS ]
]);

export const FILE_SELECTION_QUERIES = (assay: string): Record<FileType, string> => ({
    
    sequence_reads: `
        SELECT 'sequence_reads' AS type,
               accession,
               NULL AS assembly,
               paired_end,
               read_id,
               url,
               biorep,
               techrep,
               dataset_accession
          FROM ${assay}_sequence_reads AS sequence_reads
    `,

    replicated_peaks: `
        SELECT 'replicated_peaks' AS type,
               accession,
               assembly,
               NULL AS paired_end,
               NULL AS read_id,
               url,
               NULL AS biorep,
               NULL AS techrep,
               dataset_accession
          FROM ${assay}_replicated_peaks AS replicated_peaks
    `,

    bigbed_replicated_peaks: `
        SELECT 'bigbed_replicated_peaks' AS type,
               accession,
               assembly,
               NULL AS paired_end,
               NULL AS read_id,
               url,
               NULL AS biorep,
               NULL AS techrep,
               dataset_accession
          FROM ${assay}_bigbed_replicated_peaks AS bigbed_replicated_peaks
    `,

    unreplicated_peaks: `
        SELECT 'unreplicated_peaks' AS type,
               accession,
               assembly,
               NULL AS paired_end,
               NULL AS read_id,
               url,
               biorep,
               techrep,
               dataset_accession
          FROM ${assay}_unreplicated_peaks AS unreplicated_peaks
    `,

    bigbed_unreplicated_peaks: `
        SELECT 'bigbed_unreplicated_peaks' AS type,
               accession,
               assembly,
               NULL AS paired_end,
               NULL AS read_id,
               url,
               biorep,
               techrep,
               dataset_accession
          FROM ${assay}_bigbed_unreplicated_peaks AS bigbed_unreplicated_peaks
    `,

    unfiltered_alignments: `
        SELECT 'unfiltered_alignments' AS type,
               accession,
               assembly,
               NULL AS paired_end,
               NULL AS read_id,
               url,
               biorep,
               techrep,
               dataset_accession
          FROM ${assay}_unfiltered_alignments AS unfiltered_alignments
    `,

    filtered_alignments: `
        SELECT 'filtered_alignments' AS type,
               accession,
               assembly,
               NULL AS paired_end,
               NULL AS read_id,
               url,
               biorep,
               techrep,
               dataset_accession
          FROM ${assay}_filtered_alignments AS filtered_alignments
    `,

    normalized_signal: `
        SELECT 'normalized_signal' AS type,
               accession,
               assembly,
               NULL AS paired_end,
               NULL AS read_id,
               url,
               biorep,
               techrep,
               dataset_accession
         FROM ${assay}_normalized_signal AS normalized_signal
    `

});


export async function selectFiles(
    parameters: FileSelectionParameters, filetypes: FileType[], assay: string, db: IDatabase<any>, datasets?: string[]
): Promise<FileRow[]> {
    const fq = FILE_SELECTION_QUERIES(assay);
    const fileunion = filetypes.filter(x => FILE_SELECTION_PARAMETER_MAPS.get(x)).map(
        x => `(${fq[x]} WHERE ${whereClause(conditionClauses(parameters, FILE_SELECTION_PARAMETER_MAPS.get(x)!, x))})`
    ).join("UNION ALL");
    const parameterMap = (() => {
        const r: { [key: string]: FileSelectionParameters } = {};
        filetypes.forEach(x => { r[x] = parameters; });
        return r;
    })();
    assay = assay.replace("-", "_");
    return db.any(`
        SELECT datasets.accession AS datasetaccession,
            allfiles.accession AS fileaccession,
            allfiles.assembly AS fileassembly,
            allfiles.paired_end AS paired_end,
            allfiles.read_id AS read_id,
            allfiles.biorep AS biorep,
            allfiles.techrep AS techrep,
            allfiles.type AS filetype,
            allfiles.url AS url
        FROM ${assay}_datasets AS datasets
        INNER JOIN (${fileunion}) allfiles ON datasets.accession = allfiles.dataset_accession
        WHERE ${ datasets ? "datasets.accession = ANY(${datasets})" : "TRUE" }
    `, { ...parameterMap, datasets });
}

export async function selectUniqueAssemblies(assay: string, db: IDatabase<any>): Promise<string[]> {
    return db.any(`SELECT DISTINCT assembly FROM ${assay.replace("-", "_")}_replicated_peaks`);
}
