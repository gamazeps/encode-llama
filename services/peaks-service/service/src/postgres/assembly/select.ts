import { IDatabase } from "pg-promise";
import { conditionClauses, fieldMatches, fieldMatchesAny, ParameterMap, whereClause } from "queryz";
import { AssemblyRow } from "../types";
import { AssemblySelectionParameters } from "./types";

const ASSEMBLY_PARAMETERS: ParameterMap<AssemblySelectionParameters> = new Map([
    [ "species", fieldMatches("species") ],
    [ "assembly", tableName => `files.assembly = ANY(\${${tableName}.assembly})` ]
]);

const FILE_TYPES = ["unfiltered_alignments", "filtered_alignments", "unreplicated_peaks", "replicated_peaks", "normalized_signal"];

/**
 * Creates a promise for selecting all genome assemblies that match the given parameters.
 * @param parameters the parameters to match on.
 * @param db connection to the database.
 */
export async function selectAssemblies(parameters: AssemblySelectionParameters, db: IDatabase<any>): Promise<AssemblyRow[]> {
    return db.any(`
        SELECT assembly AS name, species
          FROM ${parameters.assay?.replace("-", "_")}_datasets AS datasets
         INNER JOIN (
            ${FILE_TYPES
                .map(x => `(SELECT assembly, dataset_accession FROM ${parameters.assay?.replace("-", "_")}_${x})`)
                .join(" UNION ALL ")
            }
         ) files ON files.dataset_accession = datasets.accession
         WHERE ${whereClause(conditionClauses(parameters, ASSEMBLY_PARAMETERS, "datasets"))}
         GROUP BY species, name
    `, { datasets: parameters });
}
