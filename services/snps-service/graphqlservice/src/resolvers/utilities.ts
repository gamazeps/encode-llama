import { groupBy } from "queryz";

/**
 * Groups a set of database rows according to unique keys derived from their contents. The groups are returned as an
 * array, where the indices correspond to a list of IDs of known order which is given as an argument. If a row produces
 * a key which is not in the list, it is ignored.
 *
 * @param ids the list of IDs known to account for all IDs in the database rows, in desired order.
 * @param objects the database rows, with the IDs from the list in the first column.
 * @param idKey function for obtaining a unique key from a row.
 */
export function groupByKey<T>(ids: string[], objects: any[], idKey: (object: T) => string): T[][] {
    const r = groupBy(objects, idKey, x => x);
    return ids.map(x => r.get(x) || []);
}

/**
 * Groups a set of database rows according to ID. The groups are returned as an array, where the indices correspond to
 * a list of IDs of known order which is given as an argument.
 *
 * @param ids the list of IDs known to account for all IDs in the database rows, in desired order.
 * @param objects the database rows, with the IDs from the list in the first column.
 * @param idKey the field within each row which contains the row's ID.
 */
export function groupById<T>(ids: string[], objects: T[], idKey: string): T[][] {
    return groupByKey(ids, objects, (object: any): string => object[idKey]);
}

/**
 * Groups a set of database rows according to ID. Each ID is assumed to correspond to exactly one element. The indices
 * correspond to a list of IDs of known order which is given as an argument.
 *
 * @param ids the list of IDs known to account for all the IDs in the database rows, in desired order.
 * @param objects the database rows, with the IDs from the list in the first column.
 * @param idKey the field within each row which contains the row's ID.
 */
export function groupByIdSingle<T>(ids: string[], objects: T[], idKey: string): T[] {
    return groupById(ids, objects, idKey).map( (result: any[]): any => result[0] );
}

/**
 * Groups a set of database rows according to unique keys derived from their contents. The groups are returned as an
 * array, where the indices correspond to a list of IDs of known order which is given as an argument. If a row produces
 * a key which is not in the list, it is ignored.
 *
 * @param ids the list of IDs known to account for all IDs in the database rows, in desired order.
 * @param objects the database rows, with the IDs from the list in the first column.
 * @param idKey function for obtaining a unique key from a row.
 */
export function groupByKeySingle<T>(ids: string[], objects: T[], idKey: (object: any) => string): T[] {
    return groupByKey(ids, objects, idKey).map(x => x[0]);
}
