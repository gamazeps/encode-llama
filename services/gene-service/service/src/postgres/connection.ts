import { IMain, IDatabase, IInitOptions } from "pg-promise";
import pgPromise from "pg-promise";

const initOptions: IInitOptions<{}> = {
    error(err, e) {
        if (e.cn) {
            console.error("Connection error: ", err);
            return;
        }
        console.error("Error when executing query: ", e.query, e.params ? "\nwith params: " : "", e.params ? e.params : "", e);
    },
    query() {
        // console.log('QUERY:', e.query);
    }
};

function dbEnv(name: string): string {
    let env = process.env[name];
    if (env === null || env === undefined) {
        throw new Error(`Environment Variable ${name} must be defined!`);
    }
    return env;
}

const pgp: IMain = pgPromise(initOptions);
const user: string = dbEnv("POSTGRES_USER");
const password: string = process.env["POSTGRES_PASS"] || "";
const host: string = process.env["POSTGRES_HOST"] || "localhost";
const port: string =  process.env["POSTGRES_PORT"] || "5432";
const dbname: string = process.env["POSTGRES_DB"] || "postgres";
const cn: string = `postgres://${user}:${password}@${host}:${port}/${dbname}`;
export const db: IDatabase<any> = pgp(cn);

export const gencodeSchema: string = dbEnv("POSTGRES_GENCODE_SCHEMA");
export const encodeSchema: string = dbEnv("POSTGRES_ENCODE_SCHEMA");
export const psychEncodeSchema: string = dbEnv("POSTGRES_PSYCHENCODE_SCHEMA");
export const userSchema: string = dbEnv("POSTGRES_USER_SCHEMA");
