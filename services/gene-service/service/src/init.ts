import fetch from "node-fetch";
import { Tensor2D } from '@tensorflow/tfjs';
import { parse } from "./npy";
import { StringifyOptions } from "querystring";

type CellTypeDetails = {
  id: number,
  barcodekey: string,
  n_genes: number,
  n_counts: number,
  channel: string,
  anno: string,
  subclass: string,
  azimuth: string,
  celltype: string,
  sampleid: string,
  individualid: string,
  umap_1: number,
  umap_2: number
}[]

type GeneDetails = {
  id: number,
  featurekey: string,
  featureid: string,
  n_cells: number,
  percent_cells: number
}[]


type RowOrder =  { [id: string]: number } 
type GenesRowIdList = { id: number, gene_id: string, description: string }[] 
type ColOrder  = { id : number, tissue_id: string, tissue_type: string, tissue_type_detail: string}[] 
type tissueDetails = { tissue_sample_id: string, tissue_type: string, tissue_type_details: string }[]
type ValTypeTensorMap = { [valtype: string]: Tensor2D };

type RampageRowIdList = { id: number, transcript_id: string, chrom: string, start: number,end: number, gene_id: string,  strand: string, type: string }[] 
type RampageColOrder = {  id : number, fileAccession: string, expAccession: string, tissue: string,  name: string,  organ: string, lifestage: string, 
   biosampleType: string }[]

type TssRampagePeakGenes =  { geneid: string,peakid: string,
  genename: string, locustype: string}[] 
type TssRampageRowIdList = { id: number,  chrom: string, start: number,end: number,
   start1: number, end1: number, strand: string, peakid: string, genes:  {geneid: string, peakid: string,
    genename: string, locustype: string}[], col1: string, col2: string }[]

type TssRampageColOrder  = {
  id: number, expAccession: string, biosampleType: string, biosampleName: string,
   organ: string, biosampleSummary: string 
}[]    

type SinglecellRowOrder = { [disease: string]: RowOrder}
type SinglecellRowList = { [disease: string]: CellTypeDetails }
type SinglecellColOrder = { [disease: string]: GeneDetails}

export type Config = {
    
    //Rows 
    gtex_genes_order:  RowOrder,    
    //Rows
    gtex_genesId_list: GenesRowIdList    
    //Cols
    gtex_tissue_order:  ColOrder,
    //Matrix 
    gtex_genes_tpm_matrices: ValTypeTensorMap,

    singlecell_genesmatrices: ValTypeTensorMap,

    singlecell_roworder: SinglecellRowOrder,

    singlecell_rowlist: SinglecellRowList,

    singlecell_colorder: SinglecellColOrder,

     rampage_rowOrder: RowOrder,
     rampage_rowIdList: RampageRowIdList,
     rampage_colOrder: RampageColOrder,
     rampage_matrices: ValTypeTensorMap,

     tssrampage_rowOrder: RowOrder,
     tssrampage_rowIdList: TssRampageRowIdList,
     tssrampage_colOrder: TssRampageColOrder,
     tssrampage_matrices: ValTypeTensorMap

};
const GTEX_GENES_TPM_MATRICES = process.env["GTEX_GENES_TPM_MATRICES"] 


/*
 CMC-CellHashing
 IsoHuB
 DevBrain
 Urban-DLPFC
 SZBDMulti-Seq
 UCLA-ASD
*/

const SINGLE_CELL_MATRICES = process.env["SINGLE_CELL_MATRICES"]

const RAMPAGE_MATRICES = process.env["RAMPAGE_MATRICES"]
const TSSRAMPAGE_MATRICES = process.env["TSSRAMPAGE_MATRICES"]

const gtex_genesmatrices: [ string, string ][] = (GTEX_GENES_TPM_MATRICES?.split("|").map(x => x.split("=")).filter(x => x.length === 2) as [string, string][] | undefined) || [];
const singlecell_genesmatrices: [ string, string ][] = (SINGLE_CELL_MATRICES?.split("|").map(x => x.split("=")).filter(x => x.length === 2) as [string, string][] | undefined) || [];

const rampage_matrices: [string,string][] =  (RAMPAGE_MATRICES?.split("|").map(x => x.split("=")).filter(x => x.length === 2) as [string, string][] | undefined) || [];
const tssrampage_matrices: [string,string][] =  (TSSRAMPAGE_MATRICES?.split("|").map(x => x.split("=")).filter(x => x.length === 2) as [string, string][] | undefined) || [];
 
const matrix_chunk_size = process.env["MATRIX_CHUNK_SIZE"] ? +process.env["MATRIX_CHUNK_SIZE"] : undefined;

async function loadRampageMatrices(): Promise<ValTypeTensorMap> {
  const mmatrices: ValTypeTensorMap = {};
    const m = await Promise.all(rampage_matrices.map(async (x: [string, string]) => [ x[0], await parse(x[1], matrix_chunk_size) ]));
    m.forEach(x => mmatrices[x[0] as string] = x[1] as Tensor2D);
    return mmatrices;
}
async function loadTssRampageMatrices(): Promise<ValTypeTensorMap> {
  const mmatrices: ValTypeTensorMap = {};
    const m = await Promise.all(tssrampage_matrices.map(async (x: [string, string]) => [ x[0], await parse(x[1], matrix_chunk_size) ]));
    m.forEach(x => mmatrices[x[0] as string] = x[1] as Tensor2D);
    return mmatrices;
}

async function loadMatrices(): Promise<ValTypeTensorMap> {    
    const mmatrices: ValTypeTensorMap = {};
    const m = await Promise.all(gtex_genesmatrices.map(async (x: [string, string]) => [ x[0], await parse(x[1], matrix_chunk_size) ]));
    m.forEach(x => mmatrices[x[0] as string] = x[1] as Tensor2D);
    return mmatrices;
}

async function loadSingleCellMatrices(): Promise<ValTypeTensorMap> {    
  const mmatrices: ValTypeTensorMap = {};
  const m = await Promise.all(singlecell_genesmatrices.map(async (x: [string, string]) => [ x[0], await parse(x[1], matrix_chunk_size) ]));
  m.forEach(x => mmatrices[x[0] as string] = x[1] as Tensor2D);
  return mmatrices;
}


async function init(): Promise<Config> {

      const gtex_tpm_genes_matrices = await loadMatrices();  
      const singlecell_genesmatrices = await loadSingleCellMatrices();  
      const rampage_matrices = await loadRampageMatrices();
      const tssrampage_matrices = await loadTssRampageMatrices();

      //single cell rows  

      const singlecell_roworder: SinglecellRowOrder ={}
      const singlecell_rowlist: SinglecellRowList ={}
      const singlecell_colorder: SinglecellColOrder ={}
      
      const diseases  =[ "IsoHuB","DevBrain-snRNAseq","CMC","UCLA-ASD","SZBDMulti-Seq","MultiomeBrain-DLPFC","PTSDBrainomics","LIBD"]
 
      for(const d of diseases) {
        let cellroworder: RowOrder = {}
        let celltype_details: CellTypeDetails = [];
        let geneDetailsCols: GeneDetails = []
        let url =`http://gcp.wenglab.org/gene-service-files/psychscreen/${d}_umap_metadata_subset.csv` 
        
        let celltypelist  = await fetch(url)
        let celltypeRows = await celltypelist.text()
        celltypeRows.split("\n").forEach((gn,i)=>{ 
          //RowOrder
          
          let str = gn.trim()
          let vals = str.split(",").map(s=>s.trim())
          if(vals.length>1)
          {
            cellroworder[vals[0]] = i
           
            
              celltype_details.push({id: i,
                barcodekey: vals[0], n_genes: +vals[1], n_counts: +vals[2], channel: vals[3],
                anno: vals[4], subclass: vals[5], azimuth: vals[6], sampleid: vals[7], individualid: vals[8], umap_1: +vals[10],
                umap_2: +vals[11], celltype: vals[9]});    
 
            
            
           }
          
        })
        
        let genelist  = await fetch( `http://gcp.wenglab.org/gene-service-files/psychscreen/${d}_gene_metadata.csv`)
        
        let geneCols = await genelist.text()
        geneCols.split("\n").forEach((gn,i)=>{ 
          //RowOrder
          let str = gn.trim()
          let vals = str.split(",").map(s=>s.trim())
        
          if(vals.length>1)
          { 
            geneDetailsCols.push({id: i, featurekey: vals[0], featureid: vals[1], n_cells: +vals[2], percent_cells: +vals[3]});    

          }
       
          

        })  
        singlecell_roworder[d] = cellroworder
        singlecell_rowlist[d] = celltype_details
        singlecell_colorder[d] = geneDetailsCols
      }

      //Rows
      const gtex_roworder: RowOrder = {};
      const gtex_genes: GenesRowIdList = [];
      const gtex_tissues: ColOrder = [];
      const tissue_details: tissueDetails = [];

      const rampage_rowOrder: RowOrder = {};
      const rampage_rowIdList: RampageRowIdList  =[];
      const rampage_colOrder: RampageColOrder = [];

      
      const tssrampage_rowOrder: RowOrder = {};
      const tssrampage_rowIdList: TssRampageRowIdList  =[];
      const tssrampage_colOrder: TssRampageColOrder = [];      
      const tssrampagePeakGenes: TssRampagePeakGenes = [];

      let rampagePeakGenes =  await fetch(`http://gcp.wenglab.org/gene-service-files/rampage-hg38-rPeak-Gene-Assignments.txt`)
      let rampagPeakGenesList =  await rampagePeakGenes.text()
      let d = rampagPeakGenesList.split("\n")
      console.log("genes file length", d.length)
      d.forEach((rg,i)=>{
        
        let str = rg.trim()
        let vals = str.split("\t").map(s=>s.trim())
        if(vals.length>2) {
          tssrampagePeakGenes.push({peakid: vals[0],geneid: "", genename: vals[1], locustype: vals[2]})
        }

       })
      
      let rampagePeaks =  await fetch(`http://gcp.wenglab.org/gene-service-files/hg38-rPeaks.bed`)
      let rampagPeaksList =  await rampagePeaks.text()
      let p = rampagPeaksList.split("\n")
      console.log("peaks file length", p.length)
      p.forEach((rg,i)=>{
        let str = rg.trim()
        let vals = str.split("\t").map(s=>s.trim())
        if(vals.length>2)  {
          let peakid = vals[3]
          let r =  tssrampagePeakGenes.filter(t=>t.peakid===peakid)
          tssrampage_rowOrder[peakid] = i
          if(r && r.length>0)
          {
            
            tssrampage_rowIdList.push({id:i, chrom: vals[0], start: +vals[1], end: +vals[2], peakid,
             genes : r, 
               strand: vals[5],  col1: vals[10], col2: vals[11], start1: +vals[6], end1: +vals[7]})
          
          } else {
            tssrampage_rowIdList.push({id:i, chrom: vals[0], start: +vals[1], end: +vals[2], peakid,
              genes:  [{geneid: "",genename:  "", locustype:  "",peakid}], 
               strand: vals[5], col1: vals[10], col2: vals[11], start1: +vals[6], end1: +vals[7]})
          }
            
          
        } 
      })
      
      
      let tssrampageAccessions = await fetch(`http://gcp.wenglab.org/gene-service-files/Output-RAMPAGE-List.txt`)
      let tssrampageAccessionsList = await tssrampageAccessions.text()
      tssrampageAccessionsList.split("\n").forEach((rg,i)=>{ 
         let str = rg.trim()
          let vals = str.split("\t").map(s=>s.trim())
          
          if(vals.length>2) {
            
            tssrampage_colOrder.push({id:i, expAccession: vals[0], biosampleName: vals[4],
                biosampleType: vals[2], organ: vals[5], biosampleSummary: vals[1]})
          } 
      })

      let rampageTranscripts =  await fetch(`http://gcp.wenglab.org/gene-service-files/GRCh38-tss-filtered.bed`)
      let rampageTranscriptsList =  await rampageTranscripts.text()
      rampageTranscriptsList.split("\n").forEach((rg,i)=>{ 
          let str = rg.trim()
          let vals = str.split("\t").map(s=>s.trim())
          if(vals[0]!==undefined) {
            let tid = vals[3]
            rampage_rowOrder[tid] = i
            rampage_rowIdList.push({id: i, chrom: vals[0], start: +vals[1], end: +vals[2], type: vals[7], transcript_id: vals[3], gene_id: vals[6], strand: vals[5]}); 
          }
          
       })

      let rampageAccessions = await fetch(`http://gcp.wenglab.org/gene-service-files/rampage_cols.txt`)
      let rampageAccessionsList = await rampageAccessions.text()
      rampageAccessionsList.split("\n").forEach((rg,i)=>{ 
         let str = rg.trim()
          let vals = str.split("\t").map(s=>s.trim())
          if(vals[0]!==undefined) {
            rampage_colOrder.push({id:i, fileAccession: vals[1], expAccession: vals[0],
               tissue: vals[2], biosampleType: vals[3], lifestage: vals[4], organ: vals[5], name: vals[6]})
          }
      })

      let geneNamesList  = await fetch(`http://data.genomealmanac.org/gtex_genes.txt`)
      let geneNames = await geneNamesList.text()
      geneNames.split("\n").forEach((gn,i)=>{            
        let str = gn.trim()
        let vals = str.split("\t").map(s=>s.trim())
        if(vals[1]!==undefined) 
        {
            let geneid = vals[0].split(".")[0]            
            gtex_roworder[geneid] = i
            gtex_genes.push({id: i, gene_id: geneid, description: vals[1]});    
        }
        
      })
      let tissueDetailsList  = await fetch(`http://data.genomealmanac.org/gtex_tissues_details.txt`)
      let tissueDetails = await tissueDetailsList.text()
      let lines = tissueDetails.split("\n")
      lines.slice(1,lines.length).forEach((td,i)=>{            
        let str = td.trim()
        let vals = str.split("\t").map(s=>s.trim())
        if(vals[1]!==undefined) 
        {
            
            tissue_details.push({tissue_sample_id: vals[0], tissue_type: vals[1], tissue_type_details: vals[2]});    
        }
        
      })
      let tissueIdList  = await fetch(`http://data.genomealmanac.org/gtex_tissue_ids.txt`)
      let tissueIds = await tissueIdList.text()
      let tissuesampleIDs = tissueIds.split("\n")
      let tIds = tissuesampleIDs[0].split("\t")
      tIds.forEach((t,i)=>{
        let r =  tissue_details.find(td=>td.tissue_sample_id===t)
        gtex_tissues.push({ id:i, tissue_id:t, tissue_type:r!!.tissue_type, tissue_type_detail: r!!.tissue_type_details})
      })

    return {
        gtex_genes_tpm_matrices: gtex_tpm_genes_matrices,
        gtex_genes_order:  gtex_roworder,            
        gtex_genesId_list: gtex_genes,
        gtex_tissue_order:  gtex_tissues,
        
        singlecell_genesmatrices,
        singlecell_roworder,
        singlecell_rowlist,
        singlecell_colorder,
        rampage_rowOrder,
        rampage_rowIdList,
        rampage_colOrder,
        rampage_matrices,

        tssrampage_rowOrder,
        tssrampage_rowIdList,
        tssrampage_colOrder,        
        tssrampage_matrices

    };

};
export default init;
