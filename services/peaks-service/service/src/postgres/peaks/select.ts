import { IDatabase } from "pg-promise";
import { PeaksSelectionParameters, PeaksByRangeSelectionParameters } from "./types";
import { Peak, StreamPeak } from "../types";
import { Dataset } from "./../types";

function selectPeaksBaseQuery(tablename: string, assay: string): string {
    return `SELECT * FROM ${tablename} join ${assay}_datasets on ${tablename}.experiment_accession=${assay}_datasets.accession `;
}
function selectPeaksRangeBaseQuery(tablename: string): string {
    return `SELECT experiment_accession ,file_accession ,chrom ,chrom_start , chrom_end ,p_value, q_value,target,biosample FROM ${tablename} `;
}
function selectPeaksRangeCountBaseQuery(tablename: string): string {
    return `SELECT count(*) >  FROM ${tablename} `;
}

export async function selectPeakCount(assay: string, assembly: string, db: IDatabase<any>): Promise<number> {
    return (await db.one(`SELECT count FROM ${assay.replace("-", "_")}_peak_counts WHERE assembly = \${assembly}`, {
        assembly
    })).count;
}

function peaksQuery(parameters: PeaksSelectionParameters): string {
    if (parameters.assembly === undefined) {
        throw Error("Peaks query must contain assembly.");
    }

    let whereClauses = [];
    if (parameters.range && parameters.range.length > 0) {
        const rangewherecond: string[] = [];
        parameters.range.forEach((r) => {
            rangewherecond.push(` (chrom='${r.chrom}' AND 
        (chrom_start <= ${r.chrom_end} AND chrom_end >= ${r.chrom_start})) `);
        });
        whereClauses.push("(" + rangewherecond.join(" OR ") + ")");
    } else {
        throw Error("Invalid peaks query. chrom, chrom_start, and chrom_end must be given together.");
    }

    if (parameters.experiment_accession !== undefined) {
        whereClauses.push("experiment_accession = ${experiment_accession}");
    }

    if (parameters.file_accession !== undefined) {
        whereClauses.push("file_accession = ${file_accession}");
    }

    if (parameters.target !== undefined) {
        whereClauses.push("lower(target) = ${target}");
    }

    if (parameters.type !== undefined) {
        whereClauses.push("investigated_as @> ${type}");
    }

    if (whereClauses.length === 0) {
        throw Error("At least one accession or chrom range is required for peaks query.");
    }
    //console.log(selectPeaksBaseQuery(`${parameters.assay}_peaks_${parameters.assembly}`, parameters.assay!) + " WHERE " + whereClauses.join(" AND "));
    return selectPeaksBaseQuery(`${parameters.assay}_peaks_${parameters.assembly}`, parameters.assay!) + " WHERE " + whereClauses.join(" AND ");
}

/**
 * Selects peaks for the given range from the database.
 *
 * @param db connection to the database.
 */
export async function selectPeaks(parameters: PeaksSelectionParameters, db: IDatabase<any>): Promise<Peak[]> {
    const peaksParameters = { ...parameters, target: parameters.target && parameters.target.toLowerCase() };
    let result: Peak[] = (await db.any(peaksQuery(peaksParameters), peaksParameters)).map((p: any) => {
        const dataset: Dataset = {
            accession: p.accession,
            target: p.target,
            released: p.released,
            project: p.project,
            lab: { name: p.lab_name, friendly_name: p.lab_friendly_name },
            source: p.source,
            biosample: p.biosample,
            species: p.species,
            assay: parameters.assay!,
            developmental_slims: p.developmental_slims,
            cell_slims: p.cell_slims ,
            organ_slims: p.organ_slims,
            system_slims: p.system_slims
            
        };
        return {
                    experiment_accession: p.experiment_accession,
                    file_accession: p.file_accession,
                    chrom: p.chrom,
                    chrom_start: p.chrom_start,
                    chrom_end: p.chrom_end,
                    name: p.name,
                    assay: parameters.assay!,
                    assembly:  parameters.assembly!,
                    score: p.score,
                    strand: p.strand,
                    signal_value: p.signal_value,
                    p_value: p.p_value,
                    q_value: p.q_value,
                    peak: p.peak,
                    dataset
         };
    });
    return result;
}

function peaksrangestreamQuery(parameters: PeaksByRangeSelectionParameters, selectQuery: (tablename: string) => string): string {
    if (parameters.assembly === undefined) {
        throw Error("Peaks range query must contain assembly.");
    }
    let whereClauses: string[] = [];
    if (parameters.experiment_accession !== undefined) {
        whereClauses.push("experiment_accession = ${experiment_accession}");
    }

    if (parameters.file_accession !== undefined) {
        whereClauses.push("file_accession = ${file_accession}");
    }
    if (parameters.target !== undefined) {
        whereClauses.push("lower(target) = ${target}");
    }

    if (parameters.biosample !== undefined) {
        whereClauses.push("lower(biosample) = ${biosample}");
    }
    let resq: string[] = [];
    if (parameters.range && parameters.range.length > 0) {
        let chromRanges: Record<string, any> = {};
        parameters.range.forEach((r) => {
            if (chromRanges[r.chrom]) {
                chromRanges[r.chrom] = [...chromRanges[r.chrom], { start: r.chrom_start, end: r.chrom_end }];
            } else {
                chromRanges[r.chrom] = [{ start: r.chrom_start, end: r.chrom_end }];
            }
        });

        Object.keys(chromRanges).forEach((k, i) => {
            const rangeORwherecond: string[] = [];

            chromRanges[k].forEach((r: any) => {
                rangeORwherecond.push(` 
                (chrom_start > ${r.start - 2000} AND chrom_start < ${r.end} AND chrom_end > ${r.start} AND chrom_end < ${r.end + 2000})`);
            });
            let e = ` ( chrom='${k}' AND ` + "(" + rangeORwherecond.join(" OR ") + ") )";

            resq.push(
                selectQuery(`${parameters.assay}_peaks_with_metadata_${parameters.assembly}`) +
                    " WHERE " +
                    e +
                    (whereClauses.length !== 0 ? " AND " : "") +
                    (whereClauses.length !== 0 ? whereClauses.join(" AND ") : "") +
                    (parameters.orderby ? `  order by chrom  ` : "") +
                    (parameters.limit !== undefined ? `  LIMIT ${parameters.limit} ` : "") +
                    (parameters.offset !== undefined ? `  OFFSET ${parameters.offset} ` : "")
            );
        });
    } else {
        throw Error("Invalid peaks query. chrom, chrom_start, and chrom_end must be given together.");
    }
    return resq.join(" UNION ALL ");
}

export async function streamPeaks(parameters: PeaksByRangeSelectionParameters, db: IDatabase<any>): Promise<StreamPeak[]> {
    const peaksParameters = {
        ...parameters,
        target: parameters.target && parameters.target.toLowerCase(),
        biosample: parameters.biosample && parameters.biosample.toLowerCase()
    };

    return db.any(peaksrangestreamQuery(peaksParameters, selectPeaksRangeBaseQuery), peaksParameters);
}

function peaksrangeQuery(parameters: PeaksByRangeSelectionParameters, selectQuery: (tablename: string) => string): string {
    if (parameters.assembly === undefined) {
        throw Error("Peaks range query must contain assembly.");
    }
    let whereClauses = [];
    if (parameters.experiment_accession !== undefined) {
        whereClauses.push("experiment_accession = ${experiment_accession}");
    }

    if (parameters.file_accession !== undefined) {
        whereClauses.push("file_accession = ${file_accession}");
    }
    if (parameters.target !== undefined) {
        whereClauses.push("lower(target) = ${target}");
    }

    if (parameters.biosample !== undefined) {
        whereClauses.push("lower(biosample) = ${biosample}");
    }

    if (parameters.range && parameters.range.length > 0) {
        let chromRanges: Record<string, any> = {};
        parameters.range.forEach((r) => {
            if (chromRanges[r.chrom]) {
                chromRanges[r.chrom] = [...chromRanges[r.chrom], { start: r.chrom_start, end: r.chrom_end }];
            } else {
                chromRanges[r.chrom] = [{ start: r.chrom_start, end: r.chrom_end }];
            }
        });

        const chromwherecond: string[] = [];

        Object.keys(chromRanges).forEach((k, i) => {
            const rangeORwherecond: string[] = [];

            chromRanges[k].forEach((r: any) => {
                rangeORwherecond.push(` 
                ( coordinates && int4range(${r.start},${r.end})) `);
            });
            if (i == 0) {
                chromwherecond.push(` (( chrom='${k}' AND ` + "(" + rangeORwherecond.join(" OR ") + ") )");
            } else {
                chromwherecond.push(` ( chrom='${k}' AND ` + "(" + rangeORwherecond.join(" OR ") + ") )");
            }
        });
        whereClauses.push(chromwherecond.join(" OR ") + ")");
    } else {
        throw Error("Invalid peaks query. chrom, chrom_start, and chrom_end must be given together.");
    }
    if (whereClauses.length === 0) {
        throw Error("At least chrom range or target or biosample is required for peaks query.");
    }
    //chip_seq_peaks_grch38_partitions

    return (
        selectQuery(`${parameters.assay}_peaks_${parameters.assembly}_partitions`) +
        " WHERE " +
        whereClauses.join(" AND ") +
        (parameters.orderby ? `  order by chrom  ` : "") +
        (parameters.limit !== undefined ? `  LIMIT ${parameters.limit} ` : "") +
        (parameters.offset !== undefined ? `  OFFSET ${parameters.offset} ` : "")
    );
}

export async function selectPeaksByRange(parameters: PeaksByRangeSelectionParameters, db: IDatabase<any>): Promise<any> {
    const peaksParameters = {
        ...parameters,
        target: parameters.target && parameters.target.toLowerCase(),
        biosample: parameters.biosample && parameters.biosample.toLowerCase()
    };
    const result = await db.any(peaksrangeQuery(peaksParameters, selectPeaksRangeBaseQuery), peaksParameters);

    return result;
}
/**
 * Creates a promise for counting unique features of dataset rows from the database for a given set of dataset accessions.
 *
 * @param datasets list of dataset accessions
 * @param db connection to the database
 */
export async function selectDatasetCountsByTarget(db: IDatabase<any>, target: string | null, assay: string[]): Promise<number> {
    let query: string[] = [];
    assay.forEach((a, i) => {
        const trgt = target == null ? `IS null` : ` = '${target}'`;
        query.push(
            `
        (SELECT COUNT(*)::INT 
        FROM ${a.replace("-", "_")}_datasets 
        WHERE target ` +
                trgt +
                `)`
        );
    });
    let q = `SELECT ` + query.join(`+`) + ` AS total `;

    const res = await db.one(q, { target });
    return res.total;
}
