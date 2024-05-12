/**
 * Represents a genomic coordinate.
 * @member chromosome the chromosome on which the region resides.
 * @member start the starting base pair of the region.
 * @member end the ending base pair of the region.
 */
export interface GenomicRange {
    chromosome: string;
    start: number;
    end: number;
};

export interface Range {
    start: number;
    end: number;
};

/** Maps fields to a SQL strings for filtering on corresponding values. */
export type ParameterMap = { [key: string]: (tableName: string, parameters: Parameters) => string };

/**
 * Generic object representing parameters for filtering results.
 * @member limit maximum number of rows to return.
 * @member offset index of the first row to return from the results set.
 */
export interface Parameters {
    limit?: number;
    offset?: number;
    [key: string]: any;
};

/**
 * Parameters for filtering eQTL results.
 * @member assembly genomic assembly from which to select eQTLs.
 * @member strand select eQTLs residing on the given strand, either + or -.
 * @member coordinates select eQTLs falling within the given genomic range.
 * @member geneId select eQTLs involving the given gene.
 * @member snpId select eQTLs involving the given SNP.
 */
export interface QTLParameters extends Parameters {
    assembly: string;
    strand?: string;
    coordinates?: GenomicRange;
    geneId?: string;
    snpId?: string;
};

export interface GTExQTLParameters extends Parameters {
    assembly: string;
    coordinates?: GenomicRange[];
    gene_id?: string[];
    ma_samples?: number;
    ma_count?: number;
    maf_max?: number;
    maf_min?: number;
    pval_beta?: number;
    tissue?: string[];
};

export type GTExQTLResult = {
    chromosome: string;
    position: number;
    gene_id: string;
    ma_samples: number;
    ma_count: number;
    maf: number;
    pval_nominal: number;
    slope: number;
    slope_se: number;
    pval_nominal_threshold: number;
    min_pval_nominal: number;
    pval_beta: number;
};

export interface SNPDensityParameters extends Parameters {
    assembly?: string;
    resolution?: number;
    coordinates?: GenomicRange[];
};

export interface SNPDensityResult {
    chrom: string;
    start: number;
    stop: number;
    total_snps: number;
    common_snps: number;
};

/**
 * Represents a single eQTL row from the database.
 * @member gene_id the ID of the involved gene.
 * @member strand the strand on which the gene resides.
 * @member n_tested_snps number of SNPs tested in identifying this eQTL.
 * @member distance_to_tss the distance between the SNP and gene.
 * @member chromosome the chromosome on which the SNP resides.
 * @member start starting base pair of the SNP.
 * @member stop ending base pair of the SNP.
 * @member pval p-vale associated with the eQTL.
 * @member regression_slope slope of the regression line associated with the eQTL.
 * @member is_top_snp true if this is the strongest eQTL for the given gene.
 * @member fdr false discovery rate associated with this eQTL.
 */
export interface QTLResult {
    gene_id?: string;
    peak_id?: string;
    strand: string;
    n_tested_snps: number;
    distance_to_tss?: number;
    distance?: number;
    snp_id: string;
    chromosome: string;
    start: number;
    stop: number;
    pval: number;
    regression_slope: number;
    is_top_snp: boolean;
    fdr: number;
};

/**
 * Parameters for filtering SNP results.
 * @member assembly genomic assembly from which to select SNPs.
 * @member coordinates select SNPs falling within the given genomic range.
 * @member af_threshold select SNPs with a minor allele frequency of at least this value.
 * @member snpids select SNPs with these IDs.
 */
export interface SNPParameters extends Parameters {
    assembly?: string;
    coordinates?: GenomicRange[];
    af_threshold?: number;
    snpids?: string[];
    common?: boolean;
};

export interface SNPParametersWithRange extends Parameters {
    assembly?: string;
    coordinates?: Range[];
    af_threshold?: number;
    snpids?: string[];
    common?: boolean;
}


 export interface SNPAssociationsParameters extends Parameters {
    disease?: string;
    snpid?: string;    
};

export interface GwasIntersectingSNPWithBcreParameters extends Parameters {
    disease?: string;
    snpid?: string;  
    bcre_group?: string;    
};



/**
 * Represents a single SNP row from the database.
 * @member snp the ID of the SNP.
 * @member chrom the chromosome on which the SNP resides.
 * @member start the starting base pair of the SNP.
 * @member stop the ending base pair of the SNP.
 * @member af the minor allele frequency of the SNP.
 * @member refallele the reference allele.
 */
export interface SNPResult {
    snp: string;
    chrom: string;
    start: number;
    stop: number;
    af: number;
    refallele: string;
    sml?: number;
};

export interface SnpAssociation {
    disease: string;
    snpid: string;
    a1: string;
    a2: string;
    n: number;
    z: number;
    chisq?: number;
};

/**
 * Extends the SNPResult class with a genomic assembly so loaders know how to group results.
 * @member assembly the genomic assembly from which the SNPResult originates.
 */
export interface SNPResultWithAssembly extends SNPResult {
    assembly: string;
};

/**
 * Extends the SNPResult class with study name so loaders know which study to group the result with.
 * @member refname the study from which the SNPResult originates.
 */
export interface SNPResultWithRefName extends SNPResultWithAssembly {
    refname: string;
};

/**
 * Parameters for filtering LD results.
 * @member population the population for which to select LD values.
 * @member snpids the IDs of the SNPs for which to select LD information.
 */
export interface LDParameters extends Parameters {
    population: string;
    snpids: string[];
    subpopulation?: string;
};

/**
 * Represents a single LD row from the database.
 * @member snp1 the ID of the SNP.
 * @member ldlinks string containing all SNPs in LD with the lead SNP, with coefficients.
 */
export interface LDResult {
    snp1: string;
    ldlinks: string;
}

/**
 * Parameters for filtering MAF results.
 * @member coordinates select SNPs falling within the given genomic range.
 * @member af_threshold select SNPs with a minor allele frequency of at least this value.
 * @member snpids select SNPs with these IDs.
 */
export interface MAFParameters extends Parameters {
    positions?: GenomicRange[];
    af_threshold?: number;
    snpids?: string[];
};

/**
 * Represents a single SNP row from the database.
 * @member snp the ID of the SNP.
 * @member altallele the alternative allele.
 * @member af the overall minor allele frequency.
 * @member eas_af the East Asian MAF.
 * @member sas_af the South Asian MAF.
 * @member eur_af the European MAF.
 * @member amr_af the American MAF.
 * @member afr_af the African MAF.
 */
export interface MAFResult {
    snp: string;
    refallele: string;
    altallele: string;
    af: number;
    eas_af: number;
    sas_af: number;
    eur_af: number;
    amr_af: number;
    afr_af: number;
    chrom: string;
    start: number;
};

/**
 * Parameters for selecting GWAS from the database.
 * @member pm_id PubMed ID of the study.
 * @member authorPrefix start of the study's author's name.
 * @member namePrefix start of the study's name.
 */
export interface StudyParameters extends Parameters {
    assembly: string;
    pmIds?: string[];
    refnames?: string[];
    authorPrefix?: string;
    namePrefix?: string;
};

/**
 * Parameters for selecting associations between SNPs and GWAS.
 * @member lead_ids selects study/SNP pairs where the lead SNP ID is contained in this list.
 * @member snp_ids selects study/SNP pairs where the SNP ID is contained in this list.
 */
export interface StudySNPAssociationParameters extends StudyParameters {
    lead_ids?: string[];
    snp_ids?: string[];
};

/**
 * Parameters for selecting cell interface enrichment data for GWAS.
 * @member encodeid the ENCODE accession number of the experiment paired with the GWAS.
 * @member fe_threshold minimum fold enrichment of LD blocks over simulated controls for the pair.
 * @member fdr_threshold minimum false discovery rate of enrichment for the pair.
 * @member pValue maximum p-value of the association.
 */
export interface StudyCellTypeEnrichmentParameters extends StudyParameters {
    encodeid?: string;
    fe_threshold?: number;
    fdr_threshold?: number;
    pValue_threshold?: number;
};

/**
 * Represents a single GWAS entry from the database.
 * @member pm_id the PubMed ID of the study.
 * @member author the first author of the study.
 * @member name the name of the study.
 * @member refname
 */
export interface StudyResult {
    pm_id: number;
    author: string;
    name: string;
    refname: string;
};

/**
 * Extends the StudyResult class with genomic assembly so loaders know which assembly to query.
 * @member assembly the genomic assembly from which the StudyResult originates.
 */
export interface StudyResultWithAssembly extends StudyResult {
    assembly: string;
};

/**
 * Represents a single GWAS/SNP pair.
 * @member snpId the ID of the associated SNP.
 * @member leadid the ID of the lead SNP, if this SNP is in LD with the lead SNP.
 */
export interface StudySNPAssociationResult extends StudyResult {
    snpId: string;
    leadid: string;
};

/**
 * Represents a pairing between a GWAS and an ENCODE experiment enriched for intersection with the GWAS.
 * @member encodeid the ENCODE accession ID of the associated experiment.
 * @member fdr false discovery rate of the cell interface association.
 * @member fe fold enrichment of LD blocks intersecting elements from the study vs. control blocks.
 * @member pValue p-value of the association.
 */
export interface StudyCellTypeEnrichmentResult extends StudyResult {
    encodeid: string;
    fdr: number;
    fe: number;
    pValue: number;
};

/**
 * Parameters for filtering lead SNPs from GWAS studies.
 * @member linkedSNP return only lead SNPs in LD with this SNP (rsID).
 */
export interface StudyLeadSNPParameters extends Parameters {
    linkedSNP?: string;
};

/**
 * Contains a SNP prefix for which to provide autocomplete suggestions.
 * @member assembly the genomic assembly for which to provide suggestions.
 * @member snpid the rsID to autocomplete.
 * @member common if set, return only common SNPs (MAF >= 5%)
 */
export interface AutocompleteParameters extends Parameters {
    assembly: string;
    snpid: string;
    common?: boolean;
};

export interface GwasSnpAssociation {
    disease: string;
    snpid: string;
    riskallele: string;
    chrom: string;
    start: number;
    stop: number;
    association_p_val: number[];
    analyses_identifying_snp: number;
    associated_gene: string;
};



export interface GwasIntersectingSnpsWithCcre {
    disease: string;
    snpid: string;
    riskallele: string;
    snp_chrom: string;
    snp_start: number;
    snp_stop: number;
    association_p_val: number[];
    associated_gene: string;
    ccre_chrom: string;
    ccre_start: number;
    ccre_stop: number;
    rdhsid: string;
    ccreid: string;
    ccre_class: string;
};


export interface GwasIntersectingSnpsWithBcre {
    disease: string;
    snpid: string;
    riskallele: string;
    snp_chrom: string;
    snp_start: number;
    snp_stop: number;
    association_p_val: number[];
    associated_gene: string;
    ccre_chrom: string;
    ccre_start: number;
    ccre_stop: number;
    rdhsid: string;
    ccreid: string;
    ccre_class: string;
    bcre_group: string;
};