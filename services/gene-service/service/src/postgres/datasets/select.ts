import { DatasetParameters, Dataset } from "./types";
import { quantMetadataSchema } from '../utilities';
import { QuantificationDataSourceType } from "../types";
import { DEFAULT_QUANT_SOURCE } from "../../constants";
import { db } from "..";
import { ParameterMap, whereClause, conditionClauses, fieldMatchesAny } from "queryz";

const FILTER_PARAMETERS: ParameterMap<DatasetParameters> = new Map([
    [ "diagnosis", fieldMatchesAny("diagnosis") ],
    [ "study", fieldMatchesAny("study") ],
    [ "life_stage", (tableName: string): string => `${tableName}.agedeath_\${parameters.life_stage#} IS NOT NULL` ],
    [ "sex", fieldMatchesAny("sex") ],
    [ "tissue", fieldMatchesAny("study") ],
    [ "biosample", fieldMatchesAny("biosample") ],
    [ "lab", fieldMatchesAny("lab") ],
    [ "cell_compartment", fieldMatchesAny("cell_compartment") ],
    [ "biosample_type", fieldMatchesAny("biosample_type") ],
    [ "assay_term_name", fieldMatchesAny("assay_term_name") ],
    [ "accession", fieldMatchesAny("accession") ],
    [ "user_collection_accession", fieldMatchesAny("user_collection_accession") ]
]);

/**
 * Selects all matching RNA-seq datasets from the database.
 * @param parameters the search parameters by which to filter datasets.
 * @param db connection to the database.
 * @param source if set, the project from which to select datasets; defaults to ENCODE.
 */
export async function selectDatasets(parameters: DatasetParameters): Promise<Dataset[]> {
    
    const source = parameters.source || DEFAULT_QUANT_SOURCE;
    const schema = quantMetadataSchema(parameters.source);
    
    if (source.type === QuantificationDataSourceType.ENCODE)
        return (await db.any(`
            SELECT * FROM \${schema~}.encode_datasets AS e
             WHERE ${whereClause(conditionClauses(parameters, FILTER_PARAMETERS, "e"))}
            ORDER BY accession
            ${parameters.limit ? ` LIMIT ${parameters.limit}` : ""}
            ${parameters.offset ? ` OFFSET ${parameters.offset}` : ""}
        `, { e: parameters, schema })).map(d => ({ ...d, source }));
    else if (source.type === QuantificationDataSourceType.PSYCH_ENCODE)
        return (await db.any(`
            SELECT accession, biosample, biosample_type, tissue, cell_compartment, lab_name, lab_friendly_name,
                   assay_term_name, d.study, m.age_death, m.fetal, m.sex, FALSE, d.diagnosis
              FROM \${schema~}.psychencode_datasets AS d
              LEFT JOIN \${schema~}.psychencode_datasets_metadata AS m ON d.individualid = m.individualid AND d.study = m.study
             WHERE ${whereClause(conditionClauses(parameters, FILTER_PARAMETERS, "d"))}
             ${parameters.limit ? ` LIMIT ${parameters.limit}` : ""}
             ${parameters.offset ? ` OFFSET ${parameters.offset}` : ""}
        `, { d: parameters, schema })).map(d => ({ ...d, source }));
    else
        return (await db.any(`
            SELECT * FROM \${schema~}.user_datasets AS e
            WHERE ${whereClause(conditionClauses(parameters, FILTER_PARAMETERS, "e"))}
            ORDER BY accession
            ${parameters.limit ? ` LIMIT ${parameters.limit}` : ""}
            ${parameters.offset ? ` OFFSET ${parameters.offset}` : ""}
        `, { e: parameters, schema })).map(d => ({ ...d, source }));

}
