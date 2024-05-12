import * as tf from "@tensorflow/tfjs";
import { Config } from "../../init";
type ScoreTensor = {
    rows?: number[];
    cols?: number[];
    tensor: tf.Tensor;
};

export type RampageResponse = {
    transcriptId: string,
    geneId: string,
    expAccession: string,
    fileAccession: string,
    chrom: string,
    start: number,
    end: number,
    strand: string,
    type: string,
    organ: string,
    lifeStage: string,
    tissue: string,
    name: string,
    biosampleType: string,
    value: number

}

export type TssRampageResponse = {
    peakId: string,
    geneId?: string,
    geneName?: string,
    locusType?: string,
    expAccession: string,
    organ: string,
    biosampleName: string,
    biosampleSummary: string,
    chrom: string,
    start1: number,
    end1: number,
    start: number,
    end: number,
    strand: string,
    col1: string,        
    col2: string,
    biosampleType: string,
    value: number

}
export function select_rampage_tensor(parameters: { transcript_ids: string[]}, config: Config): ScoreTensor | undefined { 

    const transcriptIds  = config.rampage_rowIdList.filter(x=>{
        return parameters.transcript_ids.includes(x.transcript_id)
    }).map(y=>y.transcript_id);

    const rows = transcriptIds.map(x=> config.rampage_rowOrder[x]).filter(y=>y!=undefined)

    const fileCols = config.rampage_colOrder
    const cols = fileCols.map(g=>g.id)   
    if (rows?.length === 0 || cols?.length === 0) return;

    const rowFiltered = rows ? tf.gather(config.rampage_matrices['GRCh38'], rows) : config.rampage_matrices['GRCh38'];
    const tensor = cols ? tf.gather(rowFiltered, cols, 1) : rowFiltered;
    return { rows, cols, tensor };

}
export function select_tssrampage_tensor(parameters: { genename: string}, config: Config): ScoreTensor | undefined { 

    const peaks  = config.tssrampage_rowIdList.filter(x=>{
        let r = x.genes.filter(value => value.genename===parameters.genename);
        return r && r.length>0
    }).map(y=>y.peakid);

    console.log(peaks,"peaks")

    const rows = peaks.map(x=> config.tssrampage_rowOrder[x]).filter(y=>y!=undefined)
    console.log(rows,"rows")

    const fileCols = config.tssrampage_colOrder
    const cols = fileCols.map(g=>g.id)   
    console.log(cols?.length,"cols?.length")
    if (rows?.length === 0 || cols?.length === 0) return;

    const rowFiltered = rows ? tf.gather(config.tssrampage_matrices['GRCh38'], rows) : config.tssrampage_matrices['GRCh38'];
    const tensor = cols ? tf.gather(rowFiltered, cols, 1) : rowFiltered;
    return { rows, cols, tensor };

}

export async function select_tssrampagedata(parameters:  { genename: string}, config: Config): Promise<TssRampageResponse[]> { 
    const tssrampageTensor = select_tssrampage_tensor(parameters, config);
    if (tssrampageTensor === undefined) return [];
    let { rows, cols, tensor } = tssrampageTensor;
    console.log("col len", cols?.length)
    const colCount = cols?.length || config.tssrampage_matrices['GRCh38'].shape[1]!;
    console.log("col count", colCount)
    if (rows === undefined) rows = [ ...Array(tensor.shape[0]).keys() ];
    if (cols === undefined) cols = [ ...Array(tensor.shape[1]).keys() ];
    console.log("columns", cols)
    const values = (await tensor.data()) as Float32Array;
    let res: TssRampageResponse[] = [];

    values.forEach( (x: number, i: number, _: Float32Array) => {        
        
        let rampageCol = config.tssrampage_colOrder[cols![i % colCount]]
        res.push({
            expAccession: rampageCol.expAccession,
            biosampleName: rampageCol.biosampleName,
            biosampleSummary: rampageCol.biosampleSummary,
            organ: rampageCol.organ,
            biosampleType: rampageCol.biosampleType,           
            geneId: config.tssrampage_rowIdList[rows![Math.floor(i / colCount)]].genes.find(g=>g.genename===parameters.genename)?.geneid,
            strand: config.tssrampage_rowIdList[rows![Math.floor(i / colCount)]].strand,
            start1: config.tssrampage_rowIdList[rows![Math.floor(i / colCount)]].start1,
            end1: config.tssrampage_rowIdList[rows![Math.floor(i / colCount)]].end1,
            chrom: config.tssrampage_rowIdList[rows![Math.floor(i / colCount)]].chrom,
            start: config.tssrampage_rowIdList[rows![Math.floor(i / colCount)]].start,
            end: config.tssrampage_rowIdList[rows![Math.floor(i / colCount)]].end,
            col1: config.tssrampage_rowIdList[rows![Math.floor(i / colCount)]].col1,
            col2: config.tssrampage_rowIdList[rows![Math.floor(i / colCount)]].col2,
            peakId: config.tssrampage_rowIdList[rows![Math.floor(i / colCount)]].peakid,
            locusType: config.tssrampage_rowIdList[rows![Math.floor(i / colCount)]].genes.find(g=>g.genename===parameters.genename)?.locustype,
            geneName: config.tssrampage_rowIdList[rows![Math.floor(i / colCount)]].genes.find(g=>g.genename===parameters.genename)?.genename,
            value: x
        });
    });

    return res

}

export async function select_rampagedata(parameters:  { transcript_ids: string[]}, config: Config): Promise<RampageResponse[]> {

    const rampageTensor = select_rampage_tensor(parameters, config);
    if (rampageTensor === undefined) return [];
    let { rows, cols, tensor } = rampageTensor;
    const colCount = cols?.length || config.rampage_matrices['GRCh38'].shape[1]!;
    if (rows === undefined) rows = [ ...Array(tensor.shape[0]).keys() ];
    if (cols === undefined) cols = [ ...Array(tensor.shape[1]).keys() ];
    
    const values = (await tensor.data()) as Float32Array;
    let res: RampageResponse[] = [];

    values.forEach( (x: number, i: number, _: Float32Array) => {        
        
        let rampageCol = config.rampage_colOrder[cols![i % colCount]]
        res.push({
            expAccession: rampageCol.expAccession,
            fileAccession: rampageCol.fileAccession,
            name: rampageCol.name,
            organ: rampageCol.organ,
            biosampleType: rampageCol.biosampleType,
            tissue: rampageCol.tissue,
            lifeStage: rampageCol.lifestage,
            geneId: config.rampage_rowIdList[rows![Math.floor(i / colCount)]].gene_id,
            strand: config.rampage_rowIdList[rows![Math.floor(i / colCount)]].strand,
            transcriptId: config.rampage_rowIdList[rows![Math.floor(i / colCount)]].transcript_id,
            chrom: config.rampage_rowIdList[rows![Math.floor(i / colCount)]].chrom,
            start: config.rampage_rowIdList[rows![Math.floor(i / colCount)]].start,
            end: config.rampage_rowIdList[rows![Math.floor(i / colCount)]].end,
            type: config.rampage_rowIdList[rows![Math.floor(i / colCount)]].type,
            value: x
        });
    });

    return res
}
