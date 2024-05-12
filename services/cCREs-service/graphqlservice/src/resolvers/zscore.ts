import DataLoader from "dataloader";
import { associateBy, groupBy } from "queryz";
import { select_rDHS_maxZ } from "../postgres/rdhs";
import { CCREMaxZEntry, ZScoreEntry, ZScoreParameters } from "../postgres/types";
import { select_z_scores } from "../postgres/zscore";
import { Config } from '../init';

export async function zScoreQuery(_: any, parameters: ZScoreParameters | any, context: { config: Config } | any): Promise<ZScoreEntry[]> {
    return select_z_scores(parameters, context.config);
};

export function zScoreLoader(assembly: string, experiment_accessions: string[], config: Config): DataLoader<string, ZScoreEntry[]> {
    return new DataLoader(async (keys: string[]) => {
        const results = groupBy(
            await select_z_scores({ experiment: experiment_accessions, assembly, rDHS: keys }, config),
            x => x.rdhs, x => x
        );
        return keys.map(k => results.get(k) || []);
    });
}

export function maxZScoreLoader(assembly: string, assay: string, config: Config): DataLoader<string, CCREMaxZEntry | undefined> {
    return new DataLoader(async (accession: string[]) => {
        const results = associateBy(
            await select_rDHS_maxZ({ assembly, assay, accession }, config),
            x => x.accession, x => x
        );
        return accession.map(k => results.get(k));
    });
}

export const zScoreResolvers = {
    ZScore: {
        experiment: (object: ZScoreEntry) => object.experiment_accession,
        rDHS: (object: ZScoreEntry) => object.rdhs
    }
};
