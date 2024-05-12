import * as tf from "@tensorflow/tfjs";
import { Config } from "../../init";
type ScoreTensor = {
    rows?: number[];
    cols?: number[];
    tensor: tf.Tensor;
};
export type SingleCellGenes  ={
    barcodekey: string,
    n_genes: number,
    n_counts: number,
    channel: string,
    anno: string,
    subclass: string,
    azimuth: string,
    sampleid: string,
    individualid: string,
    celltype: string,
    umap_1: number,
    umap_2: number,
    featurekey: string,
    featureid: string,
    n_cells: number,
    percent_cells: number,
    val: number 
}
export type SingleCellTypeDetails  ={
    
    barcodekey: string,
    n_genes: number,
    n_counts: number,
    channel: string,
    anno: string,
    subclass: string,
    azimuth: string,
    sampleid: string,
    individualid: string,
    umap_1: number,
    umap_2: number,
    celltype: string 
}

export async function select_single_cell_umap_coords(parameters: { disease: string }, config: Config): Promise<SingleCellTypeDetails[]>{
    const res  = config.singlecell_rowlist[parameters.disease]    
    return res

}
export function select_single_cell_genes_tensor(parameters: { disease: string, barcodekey?: string[], featurekey?: string[], featureid?: string[] }, config: Config):ScoreTensor | undefined {
    const barcodeKeys  = parameters.barcodekey && config.singlecell_rowlist[parameters.disease].filter(x=>{
        return parameters.barcodekey!!.includes(x.barcodekey)
    }).map(y=>y.barcodekey);

    const rows =  barcodeKeys && barcodeKeys.map(x=> config.singlecell_roworder[parameters.disease][x]).filter(y=>y!=undefined) 

    const geneCols = config.singlecell_colorder[parameters.disease].filter(x=>{
        if(parameters.featurekey){
            return parameters.featurekey.includes(x.featurekey)
        }  else if(parameters.featureid) {
            return parameters.featureid.includes(x.featureid )
        }
        else {
            return true
        }
    })
    const cols = geneCols.map(g=>g.id)   
    const rowFiltered = rows ? tf.gather(config.singlecell_genesmatrices[parameters.disease], rows) : config.singlecell_genesmatrices[parameters.disease];
    
    const tensor = cols ? tf.gather(rowFiltered, cols, 1) : rowFiltered;
    return { rows, cols, tensor };

}


export async function select_single_cell_genes(parameters: { disease: string, barcodekey?: string[], featurekey?: string[], featureid?: string[] }, config: Config): Promise<SingleCellGenes[]>{
        
    console.log(parameters.disease,'disease')
    const singlecellTensor = select_single_cell_genes_tensor(parameters, config);
    if (singlecellTensor === undefined) return [];
    let { rows, cols, tensor } = singlecellTensor;
    const colCount = cols?.length || config.singlecell_genesmatrices[parameters.disease].shape[1]!;
    if (rows === undefined) rows = [ ...Array(tensor.shape[0]).keys() ];
    if (cols === undefined) cols = [ ...Array(tensor.shape[1]).keys() ];
    
    const values = (await tensor.data()) as Float32Array;
    let res: SingleCellGenes[] = [];
    
    values.forEach( (x: number, i: number, _: Float32Array) => {        
        
        let gene = config.singlecell_colorder[parameters.disease][cols![i % colCount]]
        res.push({
            featureid: gene.featureid,
            featurekey: gene.featurekey,
            n_cells: gene.n_cells,
            percent_cells: gene.percent_cells,
            barcodekey: config.singlecell_rowlist[parameters.disease][rows![Math.floor(i / colCount)]].barcodekey,
            anno: config.singlecell_rowlist[parameters.disease][rows![Math.floor(i / colCount)]].anno,
            azimuth: config.singlecell_rowlist[parameters.disease][rows![Math.floor(i / colCount)]].azimuth,
            channel: config.singlecell_rowlist[parameters.disease][rows![Math.floor(i / colCount)]].channel,
            individualid: config.singlecell_rowlist[parameters.disease][rows![Math.floor(i / colCount)]].individualid,
            n_counts: config.singlecell_rowlist[parameters.disease][rows![Math.floor(i / colCount)]].n_counts,
            n_genes: config.singlecell_rowlist[parameters.disease][rows![Math.floor(i / colCount)]].n_genes,
            sampleid: config.singlecell_rowlist[parameters.disease][rows![Math.floor(i / colCount)]].sampleid,
            subclass: config.singlecell_rowlist[parameters.disease][rows![Math.floor(i / colCount)]].subclass,
            celltype: config.singlecell_rowlist[parameters.disease][rows![Math.floor(i / colCount)]].celltype,
            umap_1: config.singlecell_rowlist[parameters.disease][rows![Math.floor(i / colCount)]].umap_1,
            umap_2: config.singlecell_rowlist[parameters.disease][rows![Math.floor(i / colCount)]].umap_2,
            val: x      
        });
    });

    return res

}