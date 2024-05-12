import { GenomicRange } from "../types";
import { FeatureResult } from "../postgres/types";
import { ForbiddenError } from "apollo-server-express";
import { groupBy } from "queryz";

export async function userCheck(user: any) {
    if (user === undefined) {
        throw new ForbiddenError("You must be logged in to perform this operation!");
    }
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
export function groupByKey<T>(ids: string[], objects: T[], idKey: (object: T) => string): T[][] {
    const g = groupBy(objects, idKey, x => x);
    return ids.map(x => g.get(x) || []);
}

/**
 * Groups a set of database rows according to keys derived form their contents. Each key is assumed to correspond to
 * exactly one element. The indices correspond to a list of IDs of known order which is given as an argument.
 *
 * @param ids the list of IDs known to account for all the IDs in the database rows, in desired order.
 * @param objects the database rows, with the IDs from the list in the first column.
 * @param idKey function for obtaining a unique key from a row.
 */
export function groupByKeySingle(ids: string[], objects: any[], idKey: (object: any) => string): any[] {
    return groupByKey(ids, objects, idKey).map( (result: any[]): any => result[0] );
}

/**
 * Groups a set of database rows according to ID. The groups are returned as an array, where the indices correspond to
 * a list of IDs of known order which is given as an argument.
 *
 * @param ids the list of IDs known to account for all IDs in the database rows, in desired order.
 * @param objects the database rows, with the IDs from the list in the first column.
 * @param idKey the field within each row which contains the row's ID.
 */
export function groupById(ids: string[], objects: any[], idKey: string): any[][] {
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
export function groupByIdSingle(ids: string[], objects: any[], idKey: string): any[] {
    return groupById(ids, objects, idKey).map( (result: any[]): any => result[0] );
}

export function resolveCoordinates(obj: FeatureResult): GenomicRange {
    return {
        chromosome: obj.chromosome,
        start: obj.start,
        end: obj.stop
    };
}
