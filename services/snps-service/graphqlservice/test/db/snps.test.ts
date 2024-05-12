import { db, selectSNPs, selectSnpsSuggestionsbyId, selectSNPDensity, selectSNPAssociations, selectGwasSNPAssociations, selectGwasIntersectingSNPWithCcres, selectGwasIntersectingSNPWithBcres } from "../../src/postgres";
import { SNPResult, SNPDensityResult, SnpAssociation, GwasSnpAssociation, GwasIntersectingSnpsWithCcre, GwasIntersectingSnpsWithBcre } from "../../src/postgres/types";

describe("snp queries by id", () => {

    test("should select one snp for given id", async () => {
        const results: SNPResult[] = await selectSNPs({ snpids: ["rs171", "rs242"], assembly: "hg38" }, db);
        expect(results.length).not.toEqual(0);
        expect(results.length).toEqual(2);
    });

    test("should select all SNPs for given range", async () => {
        const results: SNPResult[] = await selectSNPs(
            { assembly: "hg38", coordinates: [{ chromosome: "chr1", start: 175261678, end: 175261680 }] }, db
        );
        expect(results.length).not.toEqual(0);
        expect(results.length).toEqual(1);
        expect(results[0]).toEqual({
            af: null,
            chrom: "chr1",
            refallele: null,
            snp: "rs171",
            start: 175261678,
            stop: 175261679,
        })
    });

    test("should select one common SNP for chr1:1000000-1001000", async () => {
        const results: SNPResult[] = await selectSNPs(
            { assembly: "hg38", coordinates: [{ chromosome: "chr1", start: 500000, end: 1000000 }], common: true }, db
        );
        expect(results.length).toBe(45);
    });

    test("should select SNP density", async () => {
        const results: SNPDensityResult[] = await selectSNPDensity(
            { assembly: "hg38", coordinates: [{ chromosome: "chr1", start: 0, end: 200000 }], resolution: 100000 }, db
        );
        expect(results.length).toBe(3);
        expect(results).toContainEqual({
            chrom: 'chr1',
            start: 0,
            stop: 100000,
            total_snps: 467,
            common_snps: 12
        });
        expect(results).toContainEqual({
            chrom: 'chr1',
            start: 100000,
            stop: 200000,
            total_snps: 179,
            common_snps: 2
        });
        expect(results).toContainEqual({
            chrom: 'chr1',
            start: 200000,
            stop: 300000,
            total_snps: 56,
            common_snps: 0
        });
    });

});

describe("snp suggestion queries by id", () => {

    test("should return top 10 snp suggestions for given id", async () => {
        const results: SNPResult[] = await selectSnpsSuggestionsbyId({ assembly: "hg38", snpid: "rs171" }, db);
        expect(results.length).toEqual(1);
    });

});

describe("snp associatiom queries by disease", () => {

    test("should return snp associations for given disease", async () => {
        const results: SnpAssociation[] = await selectSNPAssociations({ disease: "AgeFirstBirth" }, db);
        expect(results.length).toEqual(19);
    });

    test("should return snp associations for given disease and snpid", async () => {
        const results: SnpAssociation[] = await selectSNPAssociations({ disease: "AgeFirstBirth", snpid: "rs12562034" }, db);
        expect(results.length).toEqual(1);
        expect(results).toContainEqual({
            a1: "A", a2: "G", chisq: null, disease: "AgeFirstBirth", n: 222037, snpid: "rs12562034", z: -0.4
        });
    });

});





describe("gwas snp association queries by disease", () => {

    test("should return gwas snp associations for given disease", async () => {
        const results: GwasSnpAssociation[] = await selectGwasSNPAssociations({ disease: "YearsEducation" }, db);
        expect(results.length).toEqual(193);
    });

    test("should return gwas snp associations for given disease and snpid", async () => {
        const results: GwasSnpAssociation[] = await selectGwasSNPAssociations({ disease: "YearsEducation", snpid: "rs12134151" }, db);
        expect(results.length).toEqual(1);        
        expect(results[0]).toEqual({
            analyses_identifying_snp: 1, associated_gene: "LINC02607", chrom: "chr1", start: 95736887, stop:95736887, 
             disease: "YearsEducation", riskallele: "C", snpid: "rs12134151", association_p_val: [1e-8]
        });
    });

});




describe("gwas intersecting snps with ccres queries by disease", () => {

    test("should return gwas snp associations for given disease", async () => {
        const results: GwasIntersectingSnpsWithCcre[] = await selectGwasIntersectingSNPWithCcres({ disease: "ASD" }, db);
        expect(results.length).toEqual(28);
    });

    test("should return gwas snp associations for given disease and snpid", async () => {
        const results: GwasIntersectingSnpsWithCcre[] = await selectGwasIntersectingSNPWithCcres({ disease: "ASD", snpid: "rs11072298" }, db);
        expect(results.length).toEqual(1);        
        
    });

});



describe("gwas intersecting snps with ccres queries by disease", () => {

    test("should return  intersecting snps with bcres for given disease", async () => {
        const results: GwasIntersectingSnpsWithBcre[] = await selectGwasIntersectingSNPWithBcres({ disease: "ASD", bcre_group: "adult" }, db);
        expect(results.length).toEqual(6);
    });

    test("should return  intersecting snps with bcres for given disease and snpid", async () => {
        const results: GwasIntersectingSnpsWithBcre[] = await selectGwasIntersectingSNPWithBcres({ disease: "ASD", snpid: "rs34509057" }, db);
        expect(results.length).toEqual(2);        
        
    });

});



