import * as express from "express";
import { associateBy } from "queryz";

import { db, selectLD, selectSNPs } from '../postgres';
import { LDResult, GenomicRange, SNPResult } from "../postgres/types";

interface LDRESTParameters {
    snpids: string[];
    population: string;    
    rSquaredThreshold: number;
    assembly: string;
    subpopulation?: string;
}

const BATCH_SIZE = 100;

export async function streamLDByIDs(req: express.Request, res: express.Response) {
    try {
        return _streamLDByIDs(req, res);
    } catch {
        res.send("an ERROR occurred; some results may be missing");
        res.end();
    }
}

/**
 * Obtains a unqiue set of the IDs for all SNPs in LD with a lead SNP from a given set of LD results.
 * @param results the set of LD results.
 * @param rSquaredThreshold minimum r-squared value to include.
 */
function uniqueRsIDs(results: LDResult[], rSquaredThreshold: number = 0.7): Set<string> {
    const result: Set<string> = new Set();
    results.forEach( snp => { 
        snp.ldlinks.split(';').filter(s => s !== "").filter(
            (x: string) => +x.split(',')[1] > rSquaredThreshold
        ).forEach( x => { result.add(x.split(',')[0]); } )
    });
    return result;
}

export async function _streamLDByIDs(req: express.Request, res: express.Response) {

    const parameters = req.body as LDRESTParameters;
    res.setHeader("Content-Type", "text/plain");

    /* break into batches */
    for (let i = 0; i < parameters.snpids.length; i += BATCH_SIZE) {
        
        /* fetch LD blocks from database and filter linked SNPs by r-squared threshold*/
        const results = await selectLD({ ...parameters, snpids: parameters.snpids.slice(i, i + BATCH_SIZE) }, db);

        /* find the set of all rsIDs linked with any of the input SNPs at the given r-squared threshold */
        const uniqueIDs = uniqueRsIDs(results, parameters.rSquaredThreshold);

        /* fetch coordinates for all linked SNPs from database */
        const coordinates = associateBy<SNPResult, GenomicRange, string>(
            await selectSNPs({ snpids: [ ...uniqueIDs ], assembly: parameters.assembly }, db),
            x => x.snp, x => ({ chromosome: x.chrom, start: x.start, end: x.stop })
        );

        /* write results for this batch, with columns: chromosome, start, end, linked SNP, lead SNP */
        results.forEach( (value: LDResult) => {
            value.ldlinks.split(';').filter(s => s !== "").filter(
                (x: string) => +x.split(',')[1] > parameters.rSquaredThreshold
            ).forEach( (link: string) => {
                const lID = link.split(',')[0];
                const coordinate = coordinates.get(lID);
                if (coordinate)
                    res.write(`${coordinate.chromosome}\t${coordinate.start}\t${coordinate.end}\t${lID}\t${value.snp1}\n`);
            });
        });

    }

    /* complete */
    res.end();
    
};
