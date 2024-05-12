/**
 * Utilities for searching for the nearest genes to a set of input coordinates.
 * 
 * Some code in this file was generated in part with ChatGPT, OpenAI’s large-scale
 * language-generation model. Upon generating draft code, the author reviewed, edited,
 * and revised the code to their own liking and takes ultimate responsibility for the
 * content of this file.
 */

import { groupBy } from "queryz";
import { GenomicRange } from "../types";

interface GenomicCoordinate {
    chromosome: string;
    position: number;
}

export function mergeGenomicCoordinates(coordinates: GenomicRange[]): GenomicRange[] {
    // Sort the coordinates by chromosome and start position
    const sortedCoordinates = coordinates.sort(sortGenomicCoordinates).map(x => ({ ...x }));
  
    // Merge overlapping coordinates
    const mergedCoordinates = [];
    let currentCoordinate = sortedCoordinates[0];
    for (let i = 1; i < sortedCoordinates.length; i++) {
        const nextCoordinate = sortedCoordinates[i];
        if (currentCoordinate.chromosome === nextCoordinate.chromosome && currentCoordinate.end >= nextCoordinate.start)
            currentCoordinate.end = Math.max(currentCoordinate.end, nextCoordinate.end);
        else {
            mergedCoordinates.push(currentCoordinate);
            currentCoordinate = nextCoordinate;
        }
    }
    mergedCoordinates.push(currentCoordinate);
  
    return mergedCoordinates;
}

export const sortGenomicCoordinates = (a: GenomicRange, b: GenomicRange) => {
    if (a.chromosome === b.chromosome)
        return a.start - b.start;
    return a.chromosome.localeCompare(b.chromosome);
}

export function flattenArray<T>(array: T[][]): T[] {
    return array.reduce((acc, val) => acc.concat(val), []);
}

export function findClosestCoordinates(
    list1: GenomicRange[],
    list2: GenomicRange[],
    limit: number = 3
): Map<GenomicRange, GenomicRange[]> {
    const result = new Map<GenomicRange, GenomicRange[]>();
    const midpoints1 = list1.map(x => ({ chromosome: x.chromosome, position: Math.floor((x.start + x.end) / 2) }));
    const midpoints2 = list2.map(x => ({ chromosome: x.chromosome, position: Math.floor((x.start + x.end) / 2) }));
    const chromosomeGroups = groupBy(midpoints2, x => x.chromosome, x => x);

    for (const coord1 in midpoints1) {
        // Initialize an array to hold the closest coordinates
        const closestCoords: (GenomicRange & { distance: number })[] = [];
        const m = chromosomeGroups.get(midpoints1[coord1].chromosome);
        if (m === undefined) {
            result.set(list1[coord1], []);
            continue;
        }
  
        // Find the index of the first element in list2 that comes after the current coordinate in list1
        const index = binarySearch(m, midpoints1[coord1]);
  
        // Search for closest coordinates within a window of three elements
        let left = Math.max(0, index - limit);
        let right = Math.min(m.length - 1, index + limit);

        for (let i = left; i <= right; ++i)
            if (list2[i].chromosome === midpoints1[coord1].chromosome)
                closestCoords.push({ ...list2[i], distance: Math.abs(midpoints1[coord1].position - m[i].position) });
        result.set(list1[coord1], closestCoords.sort((a, b) => a.distance - b.distance).slice(0, limit));
    }
  
    return result;
}

export function binarySearch(list: GenomicCoordinate[], target: GenomicCoordinate): number {
    let left = 0;
    let right = list.length - 1;
  
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
  
      if (list[mid].position === target.position) {
          if (mid === 0 || list[mid - 1].position < target.position)
              return mid;
          else
              right = mid - 1;
      } else if (list[mid].position < target.position)
          left = mid + 1;
      else
          right = mid - 1;
    }
  
    // Return the index of the first element in list that comes after the target
    return left;
}
