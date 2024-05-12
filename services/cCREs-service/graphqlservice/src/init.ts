import Client from "pg-native";
import fetch from "node-fetch";
import { Tensor2D, Tensor3D } from '@tensorflow/tfjs';
import { BigWigReader, DataLoader } from 'bigwig-reader';

import { BiosampleEntry } from "./postgres/types";
import { parse } from "./npy";
import { createReadStream } from "fs";
import { Readable } from "stream";

const schema: string = process.env["POSTGRES_SCHEMA"] || "default";
const user: string = process.env["POSTGRES_USER"] || "postgres";
const password: string = process.env["POSTGRES_PASS"] || "";
const host: string = process.env["POSTGRES_HOST"] || "localhost";
const port: string = process.env["POSTGRES_PORT"] || "5432";
const database: string = process.env["POSTGRES_DB"] || "postgres";
const matrices: [ string, string ][] = (process.env["MATRICES"]?.split("|").map(x => x.split("=")).filter(x => x.length === 2) as [string, string][] | undefined) || [];
const pca_matrices: [ string, string, string, string ][] = (process.env["PCA_MATRICES"]?.split("|").map(x => x.split("=")).filter(x => x.length === 4) as [string, string, string, string][] | undefined) || [];
const umap_matrices: [ string, string, string ][] = (process.env["UMAP_MATRICES"]?.split("|").map(x => x.split("=")).filter(x => x.length === 3) as [string, string, string][] | undefined) || [];
const gtex_annotations: [ string, string ][] = (process.env["GTEX_DECORATIONS"]?.split("|").map(x => x.split("=")).filter(x => x.length === 2) as [string, string][] | undefined) || [];
const matrix_chunk_size = process.env["MATRIX_CHUNK_SIZE"] ? +process.env["MATRIX_CHUNK_SIZE"] : undefined;
const sequence_readers = (process.env["SEQUENCE_READERS"]?.split("|").map(x => x.split("=")).filter(x => x.length === 2) as [string, string][] | undefined) || [];

export class ArrayBufferDataLoader implements DataLoader {
    constructor(private buffer: ArrayBuffer) {}
    async load(start: number, size?: number): Promise<ArrayBuffer> {
	    return this.buffer.slice(start, size && start + size);
    }
}

const SELECT_TABLE_NAMES = `
SELECT table_name, table_schema
FROM information_schema.tables
WHERE table_schema = '${schema}'
ORDER BY table_name;
`;

const SELECT_EXPERIMENT_IDS = (assembly: string) => `
SELECT id, accession, ontology, sample_type, life_stage
FROM ${assembly}_experiments
ORDER BY id ASC
`;

const SELECT_RDHS_IDS = (assembly: string) => `
SELECT id, accession
FROM ${assembly}_rdhss
ORDER BY id ASC
`;

const SELECT_CCRE_RDHSS = (assembly: string) => `
SELECT id, accession, rdhs
FROM ${assembly}_ccres
ORDER BY id ASC
`;

type BiosampleAssayMap = { [assay: string]: string[] };
type BiosampleAssayOrder = { [assay: string]: { [experiment: string]: number } };
type AssemblyTensorMap = { [assembly: string]: Tensor2D };
type AssemblyAssayTensorMap = { [assembly: string]: { [assay: string]: Tensor2D } };

type GTEXDecoration = {
    active: "active" | "repressed" | "bivalent";
    proximal: boolean;
    ctcf_bound: boolean;
    allele_specific: boolean;
    tissue: string;
};

type LDRDataFrame = {
    studies: Map<string, number>;
    biosamples: Map<string, number>;
    data: Tensor3D;
    studyOrder: string[];
    biosampleOrder: string[];
};

export type Config = {
    biosamples: { [assembly: string]: BiosampleAssayMap };
    biosample_order: { [assembly: string]: BiosampleAssayOrder };
    experiment_order: { [assembly: string]: { [experiment: string]: { id: number, ontology: string, sample_type: string } } };
    experiment_list: { [assembly: string]: string[] };
    rdhs_order: { [assembly: string]: { [accession: string]: number } };
    rdhs_list: { [assembly: string]: string[] };
    matrices: AssemblyTensorMap;
    ccre_indexes: { [assembly: string]: { [accession: string]: number } };
    pca_element_matrices: AssemblyAssayTensorMap;
    pca_experiment_matrices: AssemblyAssayTensorMap;
    umap_matrices: AssemblyAssayTensorMap;
    biosample_name_map: { [assembly: string]: { [name: string]: string } };
    gtex_annotations: { [assembly: string]: { [name: string]: GTEXDecoration[] } };
    ldr: LDRDataFrame;
    sequenceReaders: { [ assembly: string ]: BigWigReader };
};

function parse_state(header: string): GTEXDecoration {
    const p = header.split(".");
    return {
        active: p[0] as "active" | "repressed" | "bivalent",
        proximal: p[1] === "proximal",
        ctcf_bound: p[2].split("-")[0] === "CTCF",
        allele_specific: p.length >= 4 && p[3].split("-")[0] === "AS",
        tissue: p[p.length - 1].split("-")[p[p.length - 1].split("-").length - 1]
    };
}

async function loadGTExDecorations(url: string): Promise<{ [name: string]: GTEXDecoration[] }> {
    const d = await (await fetch(url)).buffer();
    let cpartial = "", states: GTEXDecoration[] = [];
    const r: { [name: string]: GTEXDecoration[] } = {};
    const bpartlength = d.length >= 200000000 ? Math.ceil(d.length / 20) : d.length;
    for (let i = 0; i < (d.length >= 200000000 ? 20 : 1); ++i) {
        const b = d.slice(i * bpartlength, (i + 1) * bpartlength).toString();
        const lines = b.split("\n");
        if (i === 0) states = lines[0].split("\t").slice(1).map(parse_state);
        cpartial = lines[lines.length - 1];
        lines.slice(i === 0 ? 1 : 0, -1).forEach((line, ii) => {
            const x = (ii === 0 ? cpartial + line : line).split("\t");
            r[x[0]] = x.slice(1).map((x, i) => [ x, i ]).filter(x => x[0] === "1").map(x => states[x[1] as number]);
        });
    }
    return r;
}

async function loadZScoreMatrices(): Promise<AssemblyTensorMap> {
    const mmatrices: AssemblyTensorMap = {};
    const m = await Promise.all(matrices.map(async (x: [string, string]) => [ x[0], await parse(x[1], matrix_chunk_size) ]));
    m.forEach(x => mmatrices[x[0] as string] = x[1] as Tensor2D);
    return mmatrices;
}

async function loadUMAPMatrices(): Promise<AssemblyAssayTensorMap> {
    const umatrices: AssemblyAssayTensorMap = {};
    const u = await Promise.all(umap_matrices.map(async (x: [string, string, string]) => [ x[0], x[1], await parse(x[2], matrix_chunk_size) ]));
    u.forEach(x => {
        if (umatrices[x[0] as string] === undefined) umatrices[x[0] as string] = {};
        umatrices[x[0] as string][x[1] as string] = x[2] as Tensor2D;
    });
    return umatrices;
}

async function loadPCAMatrices(): Promise<[ AssemblyAssayTensorMap, AssemblyAssayTensorMap ]> {
    const pmatrices: AssemblyAssayTensorMap = {};
    const pematrices: AssemblyAssayTensorMap = {};
    const pm = await Promise.all(pca_matrices.map(async (x: [string, string, string, string]) => [
        x[0], x[1], await parse(x[2], matrix_chunk_size), await parse(x[3], matrix_chunk_size)
    ]));
    pm.forEach(x => {
        if (pmatrices[x[0] as string] === undefined) {
            pmatrices[x[0] as string] = {};
            pematrices[x[0] as string] = {};
        }
        pmatrices[x[0] as string][x[1] as string] = x[2] as Tensor2D;
        pematrices[x[0] as string][x[1] as string] = x[3] as Tensor2D;
    });
    return [ pmatrices, pematrices ]
}

async function indexMap(url: string): Promise<[ string[], Map<string, number> ]> {
    const r = await fetch(url);
    const t = await r.text();
    const v = t.split("\n").filter(x => x !== "");
    return [ v, new Map(v.map((x, i) => [ x, i ])) ];
}

async function init(): Promise<Config> {

    const mmatrices = await loadZScoreMatrices();
    const umatrices = await loadUMAPMatrices();
    const [ pmatrices, pematrices ] = await loadPCAMatrices();

    const client = new Client();
    client.connectSync(`postgresql://${user}:${password}@${host}:${port}/${database}`);
    client.querySync(`SET search_path TO ${schema}`);

    const assemblies: string[] = [];
    const r: { [assembly: string]: BiosampleAssayMap } = {};
    const e: { [assembly: string]: { [experiment: string]: { id: number, ontology: string, sample_type: string, life_stage: string } } } = {};
    const rr: { [assembly: string]: { [accession: string]: number } } = {};
    const ee: { [assembly: string]: string[] } = {};
    const rrr: { [assembly: string]: string[] } = {};
    const cr: { [assembly: string]: { [accession: string]: string } } = {};
    const bao: { [assembly: string]: BiosampleAssayOrder } = {};
    const bmap: { [assembly: string]: { [accession: string]: string } } = {};
    const dmap: { [assembly: string]: { [name: string]: GTEXDecoration[] }} = {};

    await Promise.all(gtex_annotations.map(async x => {
        dmap[x[0]] = await loadGTExDecorations(x[1]);
    }));

    client.querySync(SELECT_TABLE_NAMES)
        .filter((row: { table_name: string }) => row.table_name.endsWith("_biosamples"))
        .forEach((row: { table_name: string }) => {
            const assembly = row.table_name.split("_")[0];
            assemblies.push(assembly);
        });

    assemblies.forEach(assembly => {
        e[assembly] = {};
        ee[assembly] = [];
        rr[assembly] = {};
        rrr[assembly] = [];
        cr[assembly] = {};
        client.querySync(SELECT_EXPERIMENT_IDS(assembly)).forEach((row: { id: number, accession: string, ontology: string, sample_type: string, life_stage: string }) => {
            e[assembly][row.accession] = { id: row.id - 1, ontology: row.ontology, sample_type: row.sample_type, life_stage: row.life_stage };
            ee[assembly].push(row.accession);
        });
        client.querySync(SELECT_RDHS_IDS(assembly)).forEach((row: { id: number, accession: string }) => {
            rr[assembly][row.accession] = row.id - 1;
            rrr[assembly].push(row.accession);
        });
        client.querySync(SELECT_CCRE_RDHSS(assembly)).forEach((row: { id: number, accession: string, rdhs: string }) => {
            cr[assembly][row.accession] = row.rdhs;
        });
    });

    client.querySync(SELECT_TABLE_NAMES)
        .filter((row: { table_name: string }) => row.table_name.endsWith("_biosamples"))
        .forEach((row: { table_name: string }) => {
            const assembly = row.table_name.split("_")[0];
            bao[assembly] = {};
            const rows: BiosampleEntry[] = client.querySync(`SELECT * FROM ${row.table_name}`);
            r[assembly] = {};
            bmap[assembly] = {};
            if (rows.length === 0) return;
            const columns = Object.keys(rows[0]).filter(x => x.endsWith("_experiment"));
            columns.forEach( column => {
                r[assembly][column.split("_")[0]] = rows.map(x => x[column]).filter(x => x !== null).map(x => x as string);
                bao[assembly][column.split("_")[0]] = {};
                const cmap: { [key: string]: number } = {};
                rows.map((x, j) => [ x[column], j ]).filter(x => x[0] !== null).forEach(x => {
                    cmap[x[0]!] = e[assembly][x[0]!].id;
                    bmap[assembly][rows[x[1] as number].biosample_name] = x[0]! as string;
                });
                const sAcc = Object.keys(cmap).sort( (a, b) => cmap[a] - cmap[b] );
                sAcc.forEach( (xx, i) => { bao[assembly][column.split("_")[0]][xx] = i; });
            });
        });

    const ccr: { [assembly: string]: { [accession: string]: number } } = {};
    assemblies.forEach( assembly => {
        ccr[assembly] = {};
        Object.keys(cr[assembly]).forEach(ccre => {
            ccr[assembly][ccre] = rr[assembly][ccre];
        });
    });

    client.end();

    const studyOrder = await indexMap(process.env["LDR_STUDIES"]!);
    const biosampleOrder = await indexMap(process.env["LDR_BIOSAMPLES"]!);

    const sr: { [key: string]: BigWigReader } = {};
    const v = await Promise.all(assemblies.map( async assembly => {
        const m = sequence_readers.find(x => x[0] === assembly);
        if (!m) return;
        const data = await (await fetch(m[1])).arrayBuffer();
        return new BigWigReader(new ArrayBufferDataLoader(data));
    }));
    v.forEach((x, i) => { if (x) sr[assemblies[i]] = x; });

    return {
        biosamples: r,
        matrices: mmatrices,
        experiment_order: e,
        rdhs_order: rr,
        experiment_list: ee,
        rdhs_list: rrr,
        ccre_indexes: ccr,
        pca_element_matrices: pematrices,
        pca_experiment_matrices: pmatrices,
        umap_matrices: umatrices,
        biosample_order: bao,
        biosample_name_map: bmap,
        gtex_annotations: dmap,
        ldr: {
            data: await parse(process.env["LDR_MATRIX"]!, matrix_chunk_size) as Tensor3D,
            studies: studyOrder[1],
            biosamples: biosampleOrder[1],
            biosampleOrder: biosampleOrder[0],
            studyOrder: studyOrder[0]
        },
        sequenceReaders: sr
    };

};
export default init;
