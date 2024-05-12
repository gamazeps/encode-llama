import { QuantificationDataSource, QuantificationDataSourceType, FeatureDataSource, FeatureDataSourceType } from "./types";
import { encodeSchema, psychEncodeSchema, gencodeSchema, userSchema } from "./connection";
import { selectUserCollection } from "./user-collection/select";

export function quantMetadataSchema(source: QuantificationDataSource|undefined): string {
    if (!source || source.type === QuantificationDataSourceType.ENCODE) {
        return encodeSchema;
    } else if (source.type === QuantificationDataSourceType.PSYCH_ENCODE) {
        return psychEncodeSchema;
    } else {
        return userSchema;
    }
}

export async function quantSchema(source: QuantificationDataSource|undefined): Promise<string> {
    if (!source || source.type === QuantificationDataSourceType.ENCODE) {
        return encodeSchema;
    } else if (source.type === QuantificationDataSourceType.PSYCH_ENCODE) {
        return psychEncodeSchema;
    } else {
        if (source.user_collection === undefined) {
            throw new Error("user_collection required for user source");
        }
        const userCollection = await selectUserCollection(source.user_collection);
        const schema = userCollection?.quant_data_schema;
        if (!schema) throw new Error("Imported schema not found for that collection.");
        return schema;
    }
}

export function featureSchema(source: FeatureDataSource|undefined): string {
    if (!source || source.type === FeatureDataSourceType.GENCODE) {
        return gencodeSchema;
    } else {
        // TODO
        throw new Error("User sources not supported yet!");
    }
}

export class DbColsBuilder {
    private readonly cols: Record<string, string> = {};

    addRequired(col: string, prop: string = col) {
        this.cols[col] = prop;
    }

    add(col: string, ifDefined: any, prop: string = col) {
        if (ifDefined !== undefined) this.cols[col] = prop;
    }

    build(): Record<string, string> {
        const built: Record<string, string> = {};
        for(let col of Object.keys(this.cols)) {
            built[col] = `\${${this.cols[col]}}`;
        }
        return built;
    }
}
