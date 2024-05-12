import DataLoader from "dataloader";

import { db, selectMAF } from "../postgres";
import { groupById } from './utilities';
import { MAFResult } from "../postgres/types";
import { groupBy } from "queryz";

export function mafLoader() {
    return new DataLoader<string, MAFResult[]>(
        async (snpids: string[]): Promise<MAFResult[][]> => (
            groupById(snpids, await selectMAF({ snpids }, db), "snp")
        )
    );
}

export const mafResolvers = {
    AlleleFrequency: {
        sequence: (object: MAFResult): string => object.altallele,
        frequency: (object: MAFResult): number => object.af
    }
};

export const mafQueries = {
    maf: async (_: any, parameters: { chromosome: string, position: number }[] | any) => {
        const results = await selectMAF({
            positions: parameters.positions.map((x: { chromosome: string, position: number }) => ({ chromosome: x.chromosome, start: x.position }))
        }, db);
        const groups = groupBy(results, x => `${x.chrom}:${x.start}`, x => x);
        return [ ...groups.keys() ].map( k => ({
            snp: groups.get(k)![0].snp,
            refAllele: groups.get(k)![0].refallele,
            minorAlleles: groups.get(k)!,
            position: {
                chromosome: groups.get(k)![0].chrom,
                position: groups.get(k)![0].start
            }
        }));
    }
};
