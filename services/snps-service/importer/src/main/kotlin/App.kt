import com.github.ajalt.clikt.core.CliktCommand
import com.github.ajalt.clikt.parameters.options.*
import com.github.ajalt.clikt.parameters.types.*
import import.*

import source.*
import com.zaxxer.hikari.*
import javax.sql.DataSource
import util.withEnvvarSplit
import java.sql.DriverManager
import java.io.*
import mu.KotlinLogging
import java.nio.file.*
import model.*
private val log = KotlinLogging.logger {}	

fun main(args: Array<String>) = Cli().main(args)



class Cli : CliktCommand() {

    private val nihBaseUrls by option("-nihurl", "--nih-base-urls",
            envvar = "NIH_BASE_URLS",
            help = "NIH base URLs paired with assemblies (URL;assembly|URL;assmebly)")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple()
    private val densityResolutions by option("-densityres", "--density-resolution",
            envvar = "DENSITY_RESOLUTIONS",
            help = "resolutions for density views in basepairs")
            .int().withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple()
    private val ldBlockBroadBaseUrl by option("-ldurl", "--broad-base-url",
            envvar = "LD_BLOCK_BROAD_BASE_URL",
            help = "LD Block base URL")
    private val studyFileUrls by option("-studyurl", "--study-file-urls",
            envvar = "STUDY_FILE_URLS",
            help = "GWAS study list URLs, paired with assemblies (URL;assembly|URL;assembly)")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple()
    private val cellTypeFdrUrls by option("-fdrurl", "--cell-type-fdr-urls",
            envvar = "CT_FDR_URLS",
            help = "URLs for cell type enrichment FDRs, paried with assemblies (URL;assembly|URL;assembly)")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple()
    private val cellTypeFoldEnrichmentUrls by option("-feurl", "--cell-type-fold-enrichment-urls",
            envvar = "CT_FE_URLS",
            help = "URLs for cell type fold enrichment values, paired with assemblies (URL;assembly|URL;assembly)")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple()
    private val cellTypePValueUrls by option("-pvalueurl", "--cell-type-pvalue-url",
            envvar = "CT_P_VALUE_URLS",
            help = "URLs for cell type p-values, paired with assemblies (URL;assembly|URL;assembly)")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple()
    private val psychencodeEqtlUrl by option("-peqtlurl", "--psychencode-eqtl-urls",
            envvar = "PSYCHENCODE_EQTL_URLS",
	        help = "URLs for PsychENCODE eQTLs, paired with assemblies (URL;assembly|URL;assembly)")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple()
    private val psychencodeCqtlUrl by option("-pcqtlurl", "--psychencode-cqtl-urls",
            envvar = "PSYCHENCODE_CQTL_URLS",
            help = "URLs for PsychENCODE cQTLs, paired with assemblies (URL;assembly|URL;assembly)")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple()
    private val snpPostProcessingPar by option("-spp", "--snps-post-processing-par",
            envvar = "SNPS_POST_PROCESSING_PAR",
            help = "Parallelism for tasks in the snps import post-processing step. This should be no greater " +
                    "than the number of cores on the postgres server.")
            .int()
            .default(1)
    private val ldblocksPopulations by option("-ldpops", "--ldblock-populations",
            envvar = "LD_BLOCK_POPULATIONS",
            help = "Import LD files from the Broad for the given populations")
            .withEnvvarSplit(Regex.fromLiteral(","))
            .multiple()
    private val snpFilePar by option("-sfp", "--snp-file-par",
            envvar = "SNP_FILE_PAR",
            help = "Parallelism for requests for SNP files. Default 30.")
            .int()
            .default(30)
    private val nihSnpChroms by option("-nsc", "--nih-snps-chroms",
            envvar = "SNPS_CHROMOSOMES",
            help = "Import SNP files from NIH for the given chromosomes")
            .withEnvvarSplit(Regex.fromLiteral(","))
            .multiple()
    private val snpFiles by option("-sf", "--snps-files",
            envvar = "SNPS_FILES",
            help = "Import the given SNP files")
            .file(exists = true)
            .multiple()
    private val ldblockFiles by option("-ldf", "--ldblocks-files",
            envvar = "LD_BLOCK_FILES",
            help = "Import the given LD block files")
            .file(exists = true)
            .multiple()
    private val mafFiles by option("-mf", "--maf-files",
            envvar = "MAF_FILES",
            help = "Import the given MAF files")
            .file(exists = true)
            .multiple()
    private val snpAssemblies by option("-sa", "--snps-assemblies",
            envvar = "SNPS_ASSEMBLIES",
            help = "Assemblies matching local SNP files").multiple()
    private val ldPopulations by option("-lp", "--local-ld-populations",
            envvar = "LD_POPULATIONS",
            help = "Populations matching local SNP files").multiple()
    private val studyEnrichmentFiles by option("-se", "--study-enrichment-files",
            envvar = "STUDY_ENRICHMENT_FILES",
	    help = "Local files containing study cell type enrichment information")
	    .file(exists = true).multiple()
    private val studyEnrichmentAssemblies by option("-sea", "--study-enrichment-assemblies",
            envvar = "STUDY_ENRICHMENT_ASSEMBLIES",
	    help = "Assemblies and value types matching local cell type enrichment files")
	    .withEnvvarSplit(Regex.fromLiteral("|")).multiple()
    private val studySNPFiles by option("-ss", "--study-snp-files",
            envvar = "STUDY_SNP_FILES", help = "Local files containing SNP/GWAS associations")
	    .file(exists = true).multiple()
    private val studySNPAssemblies by option("-ssa", "--study-snp-assemblies",
            envvar = "STUDY_SNP_ASSEMBLIES",
        help = "Assemblies matching local SNP/GWAS files")
        .withEnvvarSplit(Regex.fromLiteral("|")).multiple()
    private val gtexQTLFiles by option("-gtexf", "--gtex-eqtl-files", envvar = "GTEX_EQTL_FILES",
        help = "local GTEx eQTL files").withEnvvarSplit(Regex.fromLiteral("|")).multiple()
    private val snpAssociationFiles by option("-snpassocf", "--snp-assoc-files", envvar = "SNP_ASSOC_FILES",
        help = "snp association files").withEnvvarSplit(Regex.fromLiteral("|")).multiple()
    private val snpAssociationGSBase by option("-snpassocgsbase","--snp-assoc-gsdir",
        envvar = "SNP_ASSOC_GS_DIR", help = "Import target motif data from files in the given google storage base path.")
        .withEnvvarSplit(Regex.fromLiteral("|")).multiple()
    private val gwassnpAssociationFiles by option("-gwassnpassocf", "--gwassnp-assoc-files", envvar = "GWAS_SNP_ASSOC_FILES",
        help = "snp association files").withEnvvarSplit(Regex.fromLiteral("|")).multiple()
    private val gwassnpAssociationGSBase by option("-gwassnpassocgsbase","--gwassnp-assoc-gsdir",
        envvar = "GWAS_SNP_ASSOC_GS_DIR", help = "Import target motif data from files in the given google storage base path.")
        .withEnvvarSplit(Regex.fromLiteral("|")).multiple()
    private val gwasintersectingsnpwithccresFiles by option("-gwasintersectingsnpwithccresf", "--gwas-intersectingsnp-withccres-files", envvar = "GWAS_INTERSECTING_SNP_WITHCCRE_FILES",
        help = "gwas intersecting snp with ccres").withEnvvarSplit(Regex.fromLiteral("|")).multiple()
    private val gwasintersectingsnpwithccresGSBase by option("-gwasintersectingsnpwithccresgsbase","--gwas-intersectingsnp-withccres-gsdir",
        envvar = "GWAS_INTERSECTING_SNP_WITHCCRE_GS_DIR", help = "Import gwas intersecting snp with ccre from files in the given google storage base path.")
        .withEnvvarSplit(Regex.fromLiteral("|")).multiple()
    private val gwasintersectingsnpwithbcresFiles by option("-gwasintersectingsnpwithbcresf", "--gwas-intersectingsnp-withbcres-files", envvar = "GWAS_INTERSECTING_SNP_WITHBCRE_FILES",
        help = "gwas intersecting snp with bcres").withEnvvarSplit(Regex.fromLiteral("|")).multiple()
    private val gwasintersectingsnpwithbcresGSBase by option("-gwasintersectingsnpwithbcresgsbase","--gwas-intersectingsnp-withbcres-gsdir",
        envvar = "GWAS_INTERSECTING_SNP_WITHBCRE_GS_DIR", help = "Import gwas intersecting snp with bcre from files in the given google storage base path.")
        .withEnvvarSplit(Regex.fromLiteral("|")).multiple()
    private val gtexQTLUrls by option("-gtexu", "--gtex-eqtl-urls", envvar = "GTEX_EQTL_URLS",
        help = "GTEx eQTL URLs").withEnvvarSplit(Regex.fromLiteral("|")).multiple()
    private val dbUrl by option("--db-url", envvar = "DB_URL").required()
    private val dbUsername by option("--db-username", envvar = "DB_USERNAME")
    private val dbPassword by option("--db-password", envvar = "DB_PASSWORD")
    private val dbSchema by option("--db-schema", envvar = "DB_SCHEMA")
    private val replaceSchema by option("--replace-schema", envvar = "REPLACE_SCHEMA",
            help = "Set to drop the given schema first before creating it again.")
            .flag(default = false)
    private val genomesBaseUrl by option("-genomeurl", "--genomes-base-url",	
            envvar = "GENOMES_BASE_URLS",	
            help = "1000 genomes base URL")	
    private val schemaExists by option("--exists-schema", envvar = "EXISTS_SCHEMA",	
            help = "Set to drop the given schema first before creating it again.")	
            .flag(default = false)	
    private val chromNames by option("-chromnames", "--chrom-names",	
            envvar = "CHROM_NAMES",	
            help = "Import LD files from the Broad for the given chromosomes")	
            .withEnvvarSplit(Regex.fromLiteral(","))	
            .multiple()
    override fun run(){

        val snpSources = nihBaseUrls.map {
            val s = it.split(";")
            return@map NihSnpsSource(
                    nihSnpChroms.map { chrom -> "${s[0]}bed_chr_$chrom.bed.gz" }, snpFilePar, s[1]
            )
        } + snpFiles.withIndex().groupBy { snpAssemblies[it.index] }.map { e ->
            FileSnpsSource(e.value.map { it.value }, e.key)
        }
        var populationChrom = mutableMapOf<String,List<String>>()	
        ldblocksPopulations.forEach {	
            if(chromNames.isNotEmpty())	
            {	
                populationChrom[it] =	
                        chromNames.map {c ->	
                            "${genomesBaseUrl}LD_${c}_${it}.tsv.gz"                	
                        }	
            } else {	
                populationChrom[it] =  listOf("${genomesBaseUrl}LD_${it}.tsv.gz")	
            }	
            	
        }
        log.info { "populationChrom Map: ${populationChrom}" }
        val importers: List<Importer> = listOf(

            // import PsychENCODE eQTLs, cQTLs
            PsychEncodeQTLImporter(
                listOf(PsychEncodeQTLHTTPSource(
                    psychencodeEqtlUrl, 1
                )), "hg38", 1, "e"
            ),
            PsychEncodeQTLImporter(
                listOf(PsychEncodeQTLHTTPSource(
                    psychencodeCqtlUrl, 1
                )), "hg38", 1, "c"
            ),

            // import GWAS studies and associated SNPs
            StudyImporter(
                studyFileUrls.map {
                    val s = it.split(";")
                    return@map StudiesSource(listOf(s[0]), 1, s[1])
                } + studySNPFiles.withIndex().groupBy { studySNPAssemblies[it.index] }.map { e ->
                    FileStudiesSource(e.value.map { it.value }, e.key)
                }
            ),
            SnpStudyImporter(
                studyFileUrls.map {
                    val s = it.split(";")
                    return@map SnpsStudySource(listOf(s[0]), 1, s[1])
                } + studySNPFiles.withIndex().groupBy { studySNPAssemblies[it.index] }.map { e ->
                    FileSnpStudiesSource(e.value.map { it.value }, e.key)
                }
            ),

            // import cell type enrichment values for GWAS
            CellTypeEnrichmentImporter(
                cellTypeFdrUrls.map {
                    val s = it.split(";")
                    return@map CellTypeEnrichmentsSource(listOf(s[0]), 1, s[1])
                } + studyEnrichmentFiles.withIndex().groupBy { studyEnrichmentAssemblies[it.index] }.filter { e ->
                    e.key.split(";")[1] == "fdr"
                }.map { e ->
                    FileCellTypeEnrichmentsSource(e.value.map { it.value }, e.key.split(";")[0])
                }, "fdr", true
            ),
            CellTypeEnrichmentImporter(
                cellTypeFoldEnrichmentUrls.map {
                    val s = it.split(";")
                    return@map CellTypeEnrichmentsSource(listOf(s[0]), 1, s[1])
                } + studyEnrichmentFiles.withIndex().groupBy { studyEnrichmentAssemblies[it.index] }.filter { e ->
                    e.key.split(";")[1] == "fe"
                }.map { e ->
                    FileCellTypeEnrichmentsSource(e.value.map { it.value }, e.key.split(";")[0])
                }, "fe", false
            ),
            CellTypeEnrichmentImporter(
                cellTypePValueUrls.map {
                    val s = it.split(";")
                    return@map CellTypeEnrichmentsSource(listOf(s[0]), 1, s[1])
                } + studyEnrichmentFiles.withIndex().groupBy { studyEnrichmentAssemblies[it.index] }.filter { e ->
                    e.key.split(";")[1] == "pvalue"
                }.map { e ->
                    FileCellTypeEnrichmentsSource(e.value.map { it.value }, e.key.split(";")[0])
                }, "pValue", false
            ),

           // import LD blocks	
           LdBlocksImporter(	
            ldblocksPopulations.map {	
            BroadLdBlockSource(populationChrom[it]!!, it)	
            } + ldblockFiles.withIndex().groupBy { ldPopulations[it.index] }.map { e ->	
                FileLdBlockSource(e.value.map { it.value }, e.key)	
            }	
            ),

            // import MAF
            MafImporter(
                listOf(
                    GenomesMafSource(
                        nihSnpChroms.map {
                            when (it) {
                                "X" -> "ftp://ftp.1000genomes.ebi.ac.uk/vol1/ftp/release/20130502/ALL.chr$it.phase3_shapeit2_mvncall_integrated_v1c.20130502.genotypes.vcf.gz"
                                "Y" -> "ftp://ftp.1000genomes.ebi.ac.uk/vol1/ftp/release/20130502/ALL.chr$it.phase3_integrated_v2b.20130502.genotypes.vcf.gz"
                                else -> "ftp://ftp.1000genomes.ebi.ac.uk/vol1/ftp/release/20130502/ALL.chr$it.phase3_shapeit2_mvncall_integrated_v5b.20130502.genotypes.vcf.gz"
                            }
                        }, snpFilePar
                    ),
                    FileMafSource(mafFiles)
                )
            ),

            GTeXeQTLImporter(
                gtexQTLFiles.map { GTeXeQTLTarFileSource(File(it)) } + gtexQTLUrls.map { GTeXeQTLTarHTTPSource(it) },
                "hg38", 1
            ),
            // import SNPs with coordinates
            SnpsImporter(
                snpSources, snpPostProcessingPar
            ),
            SnpAssociationsImporter(
                snpAssociationFiles.map { SnpAssociationsFileSource(listOf(File(it))) } + snpAssociationGSBase.map { GSSnpAssociationsSource(it.toGSDirectory()) }
            ),
            //import gwas snp associations
            GwasSnpAssociationsImporter(
                gwassnpAssociationFiles.map { GwasSnpAssociationsFileSource(listOf(File(it))) } + gwassnpAssociationGSBase.map { GSGwasSnpAssociationsSource(it.toGSDirectory()) }
            ),
            GwasIntersectingSnpsWithCcreImporter(
                gwasintersectingsnpwithccresFiles.map { GwasIntersectingSnpsWithCcreFileSource(listOf(File(it))) } + gwasintersectingsnpwithccresGSBase.map { GSGwasIntersectingSnpsWithCcreSource(it.toGSDirectory()) }
            ),
            GwasIntersectingSnpsWithBcreImporter(
                gwasintersectingsnpwithbcresFiles.map { GwasIntersectingSnpsWithBcreFileSource(listOf(File(it))) } + gwasintersectingsnpwithbcresGSBase.map { GSGwasIntersectingSnpsWithBcreSource(it.toGSDirectory()) }
            )

        )

        runImporters(dbUrl, dbUsername, dbPassword, dbSchema, replaceSchema, schemaExists, importers + densityResolutions.map {
            DensityImporter(snpSources, it)
        }
        )

    }
}

interface Importer {
    fun import(dataSource: DataSource)
}

fun runImporters(dbUrl: String,
              dbUsername: String? = null,
              dbPassword: String? = null,
              dbSchema: String? = null,
              replaceSchema: Boolean = false,
              schemaExists: Boolean = false,
              importers: List<Importer>) {

    // Create the schema if it does not exist.
    DriverManager.getConnection(dbUrl, dbUsername, dbPassword).use { conn ->
        conn.createStatement().use { stmt ->
            if (replaceSchema) {
               stmt.executeUpdate("DROP SCHEMA IF EXISTS $dbSchema CASCADE")
            }
            if(schemaExists)	
            {	
                log.info { "schema exists which is: ${schemaExists}" }	
                	
            } else {                	
                stmt.executeUpdate("CREATE SCHEMA IF NOT EXISTS $dbSchema")	
                log.info { "${dbSchema} new schema created" }	
            }
           stmt.executeUpdate("CREATE SCHEMA IF NOT EXISTS $dbSchema")
        }
    }
    val config = HikariConfig()
    config.jdbcUrl = dbUrl
    config.username = dbUsername
    config.password = dbPassword
    config.schema = dbSchema
    config.minimumIdle = 1
    config.maximumPoolSize = 100

    HikariDataSource(config).use { dataSource ->
        for (importer in importers) {
            importer.import(dataSource)
        }
    }
}
