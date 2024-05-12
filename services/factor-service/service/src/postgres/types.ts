export interface GenomicCoordinates {
    chromosome: string;
    start: number;
    stop: number;
}
export interface GenomicRange {
    chromosome: string;
    start: number;
    end: number;
}

export interface GeneInputParameters {
    id?: string;
    name?: string;
    assembly: string;
}
