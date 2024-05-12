import DataLoader from "dataloader";
import { groupBy } from "queryz";
import { Config } from "../init";
import { select_ldr } from "../postgres/ldr";
import { LDREntry, LDRParameters } from "../postgres/ldr/select";
import { biosampleLoader } from "./biosample";

export function ldrLoader(config: Config, studies?: string[]): DataLoader<string, LDREntry[]> {
    return new DataLoader(async (keys: string[]) => {
        const results = groupBy(
            await select_ldr({ biosamples: keys, studies }, config),
            x => x.biosample, x => x
        );
        return keys.map(k => results.get(k) || []);
    });
}

export const ldrQueryResolvers = {
    ldr: async (_: any, parameters: LDRParameters | any, context: { config: Config } | any) => select_ldr({
        biosamples: parameters.experiment, studies: parameters.study
    }, context.config),
};

export const ldrResolvers = {
    LDREnrichment: {
        biosample: async (object: LDREntry | any, _: any, context: { config: Config } | any) => {
            if (context.biosampleLoaders["GRCh38"] === undefined)
                context.biosampleLoaders["GRCh38"] = biosampleLoader("grch38");
            return context.biosampleLoaders["GRCh38"].load(object.biosample);
        }
    }
};
