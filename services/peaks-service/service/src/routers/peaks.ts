import * as express from "express";

import { db, PeaksByRangeSelectionParameters } from "../postgres";
import { streamPeaks } from "../postgres/peaks/select";
import { StreamPeak } from "../postgres/types";
import { ChromRange } from "../postgres/peaks/types";

const overlaps = (a: ChromRange, b: ChromRange) => a.chrom === b.chrom && a.chrom_start < b.chrom_end && a.chrom_end >= b.chrom_start;

export const streampeaksinRangeHandler = (req: express.Request, res: express.Response) => {
    if (typeof req.body === "string" || req.body?.range) return _streampeaksinRangeHandler(typeof req.body === "string" ? JSON.parse(req.body) : req.body, res);
    let data = "";
    req.addListener('data', x => { data += x; });
    req.addListener('end', () => _streampeaksinRangeHandler(JSON.parse(data), res));
}

export async function _streampeaksinRangeHandler(data: any, res: express.Response) {
    const peaksRequests = data as PeaksByRangeSelectionParameters;
    let regions = peaksRequests.range.sort((a, b) => {
        if (a.chrom === b.chrom) return a.chrom_start - b.chrom_start;
        return a.chrom.localeCompare(b.chrom);
    });

    const inputBasesCovered = (() => {
        const state = { lastPos: undefined, totalBases: 0 } as { lastPos: ChromRange | undefined; totalBases: number };
        for (const range of regions) {
            // First range
            if (!state.lastPos) {
                state.lastPos = range;
                continue;
            }
            // If not overlapping, add bases
            if (state.lastPos.chrom !== range.chrom || state.lastPos.chrom_end < range.chrom_start) {
                state.totalBases += state.lastPos.chrom_end - state.lastPos.chrom_start;
                state.lastPos = range;
                continue;
            }
            // Ranges overlap
            state.lastPos.chrom_end = range.chrom_end;
        }
        if (state.lastPos)
            state.totalBases += state.lastPos.chrom_end - state.lastPos.chrom_start;
        return state.totalBases;
    })();
    const batchSize = 200;
    const smallRegions: ChromRange[] = [];
    const largeRegions: ChromRange[] = [];

    regions.forEach((rg) => {
        let regionSize = rg.chrom_end - rg.chrom_start;
        const maxRegionSize = regionSize >= 1000000 ? 1000000 : 1000;
        if (regionSize >= maxRegionSize) {
            let noofRegions = Math.ceil(regionSize / maxRegionSize);
            for (let i = 0; i < noofRegions; i++) {
                const a =
                    rg.chrom_start + (i + 1) * maxRegionSize <= rg.chrom_end
                        ? {
                              chrom: rg.chrom,
                              chrom_start: rg.chrom_start + i * maxRegionSize,
                              chrom_end: rg.chrom_start + (i + 1) * maxRegionSize
                          }
                        : {
                              chrom: rg.chrom,
                              chrom_start: rg.chrom_start + i * maxRegionSize,
                              chrom_end: rg.chrom_end
                          };
                if (regionSize >= 1000000) {
                    largeRegions.push(a);
                } else {
                    smallRegions.push(a);
                }
            }
        } else {
            smallRegions.push(rg);
        }
    });
    regions = smallRegions;
    const numOfBatches = Math.ceil(regions.length / batchSize);
    if (peaksRequests.dataformat === "bed") {
        res.setHeader("Content-Type", "text/plain");
    } else if (peaksRequests.dataformat === "json") {
        res.setHeader("Content-Type", "application/json");
    }
    for (let i = 0; i < numOfBatches + largeRegions.length; i += 1) {

        const rangeInBatch = i < numOfBatches ? regions.slice(i * batchSize, i * batchSize + batchSize) : [largeRegions[i - numOfBatches]];
        const peaks: StreamPeak[] = await streamPeaks({ ...peaksRequests, range: rangeInBatch }, db);
        const outputBatchSize = 10000;
        const numOfOuputBatches = Math.ceil(peaks.length / outputBatchSize);
        let inputPeakIndex = 0;
        for (let j = 0; j < numOfOuputBatches; j += 1) {
            const outputPeaksinBatch = peaks.slice(j * outputBatchSize, j * outputBatchSize + outputBatchSize);

            let outputBasesCovered = 0;
            let outputPeakIndex = 0;
            outer: 
            while (true) {
                if (inputPeakIndex >= rangeInBatch.length) {
                    break;
                }
                const testInputPeak = rangeInBatch[inputPeakIndex];
                let basesCoveredInPeak = 0;

                for (; outputPeakIndex < outputPeaksinBatch.length; outputPeakIndex++) {
                    const outputPeak = outputPeaksinBatch[outputPeakIndex];
                    const peaksOverlap = overlaps(testInputPeak, outputPeak);
                    if (peaksOverlap) {
                        basesCoveredInPeak = outputPeak.chrom_end - testInputPeak.chrom_start;
                    } else {
                        outputBasesCovered += testInputPeak.chrom_end - testInputPeak.chrom_start;
                        inputPeakIndex += 1;
                        continue outer;
                    }
                }
                outputBasesCovered += basesCoveredInPeak;
                break;
            }
            const percentBasesCoveredInBatch = outputBasesCovered / inputBasesCovered;
            const peaksWithProgress = {
                progress: percentBasesCoveredInBatch,
                peaks: outputPeaksinBatch
            };
            res.write(peaksRequests.dataformat === "bed"
                ? peaksWithProgress.peaks.map(x => `${x.chrom}\t${x.chrom_start}\t${x.chrom_end}\t${x.file_accession}\t.\t0\t.\t-1\t${x.p_value.toExponential(3)}\t${x.q_value.toExponential(3)}`).join("\n")
                : JSON.stringify(peaksWithProgress) + "endofbatch"
            );
            res.flush();
        }
    }
    res.end();
}
