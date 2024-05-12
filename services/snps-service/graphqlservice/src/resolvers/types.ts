import { GenomicRange } from '../postgres/types';

/**
 * Represents a single major or minor allele for a SNP.
 * @member allele the base pairs that make up this allele.
 * @member frequency the allelic frequency in the population.
 */
export interface Allele {
    sequence: string;
    frequency: number;
};

/**
 * Represents a single minor allele for a SNP.
 * @member eas_af the East Asian allele frequency.
 * @member eur_af the European allele frequency.
 * @member sas_af the South Asian allele frequency.
 * @member afr_af the African allele frequency.
 * @member amr_af the American allele frequency.
 */
export interface AlleleFrequency extends Allele {
    eas_af: number;
    eur_af: number;
    sas_af: number;
    afr_af: number;
    amr_af: number;
};

/**
 * Represents a SNP which is in linkage disequilibrium with a lead SNP.
 * @member id the ID of the linked SNP.
 * @member rSquared the correlation coefficient.
 * @member dPrime the normalized linkage coefficient.
 * @member coordinates the coordinates of the linked SNP.
 */
export interface LinkedSNP {
    id: string;
    rSquared: number;
    dPrime: number;
    coordinates?: GenomicRange;
};

/**
 * Parameters for filtering LD results.
 * @member population the population for which to select LD values.
 * @member rSquaredThreshold minimum correlation coefficient.
 * @member dPrimeThreshold minimum normalized linkage coefficient.
 */
export interface LDInputParameters {
    population: string;
    rSquaredThreshold: number;
    dPrimeThreshold: number;
};

/**
 * Represents a pairing between a GWAS and an ENCODE experiment enriched for intersection with the GWAS.
 * @member encodeid the ENCODE accession ID of the associated experiment.
 * @member fdr false discovery rate of the cell interface association.
 * @member fe fold enrichment of LD blocks intersecting elements from the study vs. control blocks.
 * @member pValue p-value of the association.
 */
export interface CellTypeEnrichment {
    encodeid: string;
    fdr: number;
    fe: number;
    pValue: number;
};
