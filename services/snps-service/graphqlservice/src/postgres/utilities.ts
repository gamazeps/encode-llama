/**
 * Creates a closure for converting coordinate ranges into an SQL strings for filtering rows from tables.
 * @param startname within the coordinates object, the name of the field for the starting base pair.
 * @param endname within the coordinates object, the name of the field for the ending base pair.
 */
export function coordinateParameters(startname: string = "startcoordinate",
			                         endname: string = "endcoordinate"): (tableName: string) => string {
    return (tableName: string): string => {
	    return (
	        "(("
		        + tableName + "." + startname + " <= ${" + tableName + ".coordinates.start} AND "
		        + tableName + "." + endname + " >= ${" + tableName + ".coordinates.start}) OR ("
		        + tableName + "." + startname + " <= ${" + tableName + ".coordinates.end} AND "
		        + tableName + "." + endname + " >= ${" + tableName + ".coordinates.end}) OR ("
		        + tableName + "." + startname + " >= ${" + tableName + ".coordinates.start} AND "
		        + tableName + "." + endname + " <= ${" + tableName + ".coordinates.end}))"
	    );
    }
}

export function assembly_table_prefix(assembly: string): string {
	if (assembly.toLocaleLowerCase() === "grch38") return "hg38";
	return assembly.toLocaleLowerCase();
}
