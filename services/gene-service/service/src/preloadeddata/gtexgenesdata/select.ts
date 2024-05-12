import * as tf from "@tensorflow/tfjs";
import { Config } from "../../init";
type ScoreTensor = {
    rows?: number[];
    cols?: number[];
    tensor: tf.Tensor;
};

export type GtexGenes = {
gene_id: string,
description: string,
tissue_type: string,
tissue_type_detail: string,
val: number

}

export function select_gtex_genes_tensor(parameters: { gene_id: string[], tissue?: string[], tissue_subcategory?: string[]}, config: Config): ScoreTensor | undefined { 

    const geneIds  = config.gtex_genesId_list.filter(x=>{
        return parameters.gene_id.includes(x.gene_id)
    }).map(y=>y.gene_id);

    const rows = geneIds.map(x=> config.gtex_genes_order[x]).filter(y=>y!=undefined)

    const tissueCols = config.gtex_tissue_order.filter(x=>{
        if(parameters.tissue){
            return parameters.tissue.includes(x.tissue_type)
        }  else if(parameters.tissue_subcategory) {
            return parameters.tissue_subcategory.includes(x.tissue_type_detail)
        }
        else {
            return true
        }
    })
    const cols = tissueCols.map(g=>g.id)   
    if (rows?.length === 0 || cols?.length === 0) return;

    const rowFiltered = rows ? tf.gather(config.gtex_genes_tpm_matrices['tpm'], rows) : config.gtex_genes_tpm_matrices['tpm'];
    const tensor = cols ? tf.gather(rowFiltered, cols, 1) : rowFiltered;
    return { rows, cols, tensor };

}

export async function select_gtext_genes(parameters:  { gene_id: string[], tissue?: string[], tissue_subcategory?: string[]}, config: Config): Promise<GtexGenes[]> {

    const tpmTensor = select_gtex_genes_tensor(parameters, config);
    if (tpmTensor === undefined) return [];
    let { rows, cols, tensor } = tpmTensor;
    const colCount = cols?.length || config.gtex_genes_tpm_matrices['tpm'].shape[1]!;
    if (rows === undefined) rows = [ ...Array(tensor.shape[0]).keys() ];
    if (cols === undefined) cols = [ ...Array(tensor.shape[1]).keys() ];
    
    const tpm = (await tensor.data()) as Float32Array;
    let res: GtexGenes[] = [];

    tpm.forEach( (x: number, i: number, _: Float32Array) => {        
        
        let tissue = config.gtex_tissue_order[cols![i % colCount]]
        res.push({
            tissue_type: tissue.tissue_type,
            tissue_type_detail: tissue.tissue_type_detail,
            gene_id: config.gtex_genesId_list[rows![Math.floor(i / colCount)]].gene_id,
            description: config.gtex_genesId_list[rows![Math.floor(i / colCount)]].description,
            val: x      
        });
    });

    return res
}
