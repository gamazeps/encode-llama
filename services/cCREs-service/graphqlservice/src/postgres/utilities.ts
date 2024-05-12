import { groupBy } from "queryz";
import { CCREParameters, GenomicRange, RDHSParemeters } from "./types";

/**
 * Creates a closure for converting coordinate ranges into an SQL strings for filtering rows from tables.
 * @param startname within the coordinates object, the name of the field for the starting base pair.
 * @param endname within the coordinates object, the name of the field for the ending base pair.
 */
export function coordinateParameters(tableName: string, parameters: CCREParameters | RDHSParemeters): string {
	const groups = groupBy(parameters.coordinates!, x => x.chromosome, x => x);
	return Array.from(groups.entries()).map(([chromosome, ranges]) => `
		(\${${tableName}.coordinate_chromosomes.${chromosome}} = ${tableName}.chromosome AND (
			${ranges.map(x => `(${x.start} < ${tableName}.stop AND ${x.end} > ${tableName}.start)`).join(" OR ")}
		))
	`).join(" OR ");
}

export function sanitizableChromosomeMap(ranges: GenomicRange[]): { [key: string]: string } {
    const r: { [key: string]: string } = {};
    ranges.forEach( x => { r[x.chromosome] = x.chromosome; });
    return r;
}

export function sanitizableAssayMap(values: string[]): { [key: string]: string } {
    const r: { [key: string]: string } = {};
    values.forEach( x => { r[x] = `${x}_experiment`; });
    return r;
}
