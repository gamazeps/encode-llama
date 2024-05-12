import com.github.ajalt.clikt.core.CliktCommand
import com.github.ajalt.clikt.parameters.options.*
import com.github.ajalt.clikt.parameters.types.file
import com.github.ajalt.clikt.parameters.types.int
import import.*
import source.*
import com.zaxxer.hikari.*
import javax.sql.DataSource
import java.sql.DriverManager
import mu.KotlinLogging
import util.withEnvvarSplit
import java.io.File
import model.*

private val log = KotlinLogging.logger {}

interface Importer {
    fun import(dataSource: DataSource)
}

fun main(args: Array<String>) = Cli().main(args)

class Cli : CliktCommand() {

    private val dbUrl by option("--db-url", envvar = "DB_URL").required()
    private val dbUsername by option("--db-username", envvar = "DB_USERNAME")
    private val dbPassword by option("--db-password", envvar = "DB_PASSWORD")
    private val dbSchema by option("--db-schema", envvar = "DB_SCHEMA")
    private val gff3Files by option("--gff3-files", envvar = "GFF3_FILES")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple()
    private val gff3FtpUrls by option("--gencode-gff3-urls", envvar = "GFF3_FTP_URLS")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple()
    private val encodeApiPar by option("--encode-api-par",
            envvar = "ENCODE_API_PAR",
            help = "Parallelism for requests to the encode api. Used for encode peaks and metadata lookup. Default 150.")
            .int()
            .default(150)
    private val encodeMetadataAssemblies by option("--encode-metadata-assemblies",
            envvar = "ENCODE_METADATA_ASSEMBLIES",
            help = "Import metadata for encode experiments that use given assemblies via encode http service")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple()
    private val peDatasets by option("--pe-datasets",
            envvar = "PE_DATASETS",
            help = "Import pe datasets avg exp by ct")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple() 
private val qtlsigassocType by option("--qtlsigassoc-qtls",
            envvar = "QTLSIGASSOC_TYPE",
            help = "Import qtl sig assoc ")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple() 
private val qtlsigassocUrls by option("--qtlsigassoc-urls",
            envvar = "QTLSIGASSOC_URLS",
            help = "Import qtl sig assoc urls")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple() 
    private val caQTLType by option("--ca-qtls",
            envvar = "CAQTL_TYPE",
            help = "Import caqtls ")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple() 
    private val caqtlsUrls by option("--ca-qtl-urls",
            envvar = "CAQTL_URLS",
            help = "Import caQtl urls")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple() 
private val degUrls by option("--deg-urls",
            envvar = "DEG_URLS",
            help = "Import deg urls")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple() 
    private val deconQTLType by option("--decon-qtls",
            envvar = "DECONQTL_TYPE",
            help = "Import deconqtls ")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple() 
    private val deconqtlsUrls by option("--decon-qtl-urls",
            envvar = "DECONQTL_URLS",
            help = "Import deconQtl urls")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple() 
    private val peDatasetsAvgExpByCtUrls by option("--pe-datasets-avgexpbyct",
            envvar = "PE_DATASET_AVGEXP_BYCT_URL",
            help = "Import pe datasets avg exp by ct urls")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple()        
    private val peDatasetsAvgExpByScUrls by option("--pe-datasets-avgexpbysc",
            envvar = "PE_DATASET_AVGEXP_BYSC_URL",
            help = "Import pe datasets avg exp by sc urls")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple() 
        private val peDatasetsPctExpByCtUrls by option("--pe-datasets-pctexpbyct",
            envvar = "PE_DATASET_PCTEXP_BYCT_URL",
            help = "Import pe datasets pct exp by ct urls")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple()        
    private val peDatasetsPctExpByScUrls by option("--pe-datasets-pctexpbysc",
            envvar = "PE_DATASET_PCTEXP_BYSC_URL",
            help = "Import pe datasets pct exp by sc urls")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple()                 
            
    private val genesAssociationFiles by option("-genesassocf", "--genes-assoc-files", envvar = "GENES_ASSOC_FILES",
            help = "gens association files")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple()
    private val genesAssociationGSBase by option("-genesassocgsbase","--genes-assoc-gsdir",
            envvar = "GENES_ASSOC_GS_DIR", help = "Import genes association from files in the given google storage base path.")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple()
    private val singlecellboxplotFiles by option("-singlecellboxplot", "--single-cell-box-plot-files", envvar = "SINGLECELL_BOX_PLOT_FILES",
            help = "single cell box plot files")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple()
    private val singlecellboxplotGSBase by option("-singlecellboxplotgsbase","--single-cell-box-plo-gsdir",
            envvar = "SINGLECELL_BOX_PLOT_GS_DIR", help = "Import single cell box plot from files in the given google storage base path.")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple()
    private val encodeMetadataFiles by option("--encode-metadata-files",
            envvar = "ENCODE_METADATA_FILES",
            help = "Import metadata for encode experiments in given files")
            .file()
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple()
    private val encodeQuantAssemblies by option("--encode-quantification-assemblies",
            envvar = "ENCODE_QUANTIFICATION_ASSEMBLIES",
            help = "Import gene and transcript quantification files for encode experiments that use the given assemblies")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple()
    private val encodeQuantFilePar by option("--encode-quantification-par",
            envvar = "ENCODE_QUANTIFICATION_PAR",
            help = "Parallelism for downloading / importing encode quantification files. Default 1.")
            .int()
            .default(1)
    private val localGeneQuantFiles by option("--local-gene-quantification-files",
            envvar = "LOCAL_GENE_QUANTIFICATION_FILES",
            help = "Import gene quantification files given by assembly and file accession, eg. mm10<file1.tsv")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple()
    private val localTranscriptQuantFiles by option("--local-transcript-quantification-files",
            envvar = "LOCAL_TRANSCRIPT_QUANTIFICATION_FILES",
            help = "Import transcript quantification files given by assembly, eg. mm10<file1.tsv")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple()
    private val localQuantFilePar by option("--quantification-file-par",
            envvar = "QUANTIFICATION_FILE_PAR",
            help = "Parallelism for downloading / importing local quantification files. Default 1.")
            .int()
            .default(1)
    private val quantPostProcessingPar by option("--quantification-post-processing-par",
            envvar = "QUANTIFICATION_POST_PROCESSING_PAR",
            help = "Parallelism for tasks in the peaks import post-processing step.")
            .int()
            .default(1)
    private val replaceSchema by option("--replace-schema", envvar = "REPLACE_SCHEMA",
            help = "Set to drop the given schema first before creating it again.")
            .flag(default = false)
    private val psychEncodeClinicalMetadataUrl by option("--psychencode-clinical-metadata-url",
            envvar = "PSYCHENCODE_CLINICAL_METADATA_URL",
            help = "URL for the PsychENCODE RNA-seq metadata TSV.")
    private val psychEncodeClinicalMetadataFile by option("--psychencode-clinical-metadata-file",
            envvar = "PSYCHENCODE_CLINICAL_METADATA_FILE",
            help = "Import PsychENCODE RNA-seq metadata from local file")
            .file()
    private val psychEncodeDatasetMetadataUrl by option("--psychencode-dataset-metadata-url",
            envvar = "PSYCHENCODE_DATASET_METADATA_URL",
            help = "URL for the PsychENCODE dataset metadata TSV.")
    private val psychEncodeDatasetMetadataFile by option("--psychencode-dataset-metadata-file",
            envvar = "PSYCHENCODE_DATASET_METADATA_FILE",
            help = "Import dataset metadata for psychencode experiments in local file")
            .file()
    private val psychEncodeQuantificationUrl by option("--psychencode-quantification-url",
            envvar = "PSYCHENCODE_QUANTIFICATION_URL",
            help = "base URL for the PsychENCODE quantification files.")
    private val psychEncodeParallelism by option("--psychencode-parallelism", envvar = "PSYCHENCODE_PARALLELISM",
            help = "Parallelism for PsychENCODE quantification import.").int().default(1)
    private val gsQuantBucket by option("--gs-quant-bucket",
            envvar = "GS_QUANT_BUCKET",
            help = "Google Storage bucket to import user quantification files from.")
    private val gsQuantUserCollection by option("--gs-quant-user-collection",
            envvar = "GS_QUANT_USER_COLLECTION",
            help = "User Collection for Google Storage based quantification data import.")

    override fun run() {
        val importers = mutableListOf<Importer>()

        val qtlsigAssocImp  = QtlSigAssocImporter(
                qtlsigassocUrls.mapIndexed {i, it ->
                QtlSigAssocHttpSource(it, qtlsigassocType[i])
                }
        )

        val deconQTLImp = DeconqtlsImporter(
                deconqtlsUrls.mapIndexed {i, it ->
                DeconqtlsHttpSource(it, deconQTLType[i])
                }
        )

        val degImp = DegImporter(
                degUrls.mapIndexed {i, it ->
                DegHttpSource(it)
                }
        )

        val caQTLImp = CaqtlsImporter(
                caqtlsUrls.mapIndexed {i, it ->
                CaqtlsHttpSource(it, caQTLType[i])
                }
        )
        val peDatasetsAvgExpByCtImp = PsychEncodeAvgExpByCtImporter(
            peDatasetsAvgExpByCtUrls.mapIndexed { i, it ->
                PsychEncodeAvgExpByCtHttpSource(it, peDatasets[i])
            }
        )

        val peDatasetsAvgExpByScImp = PsychEncodeAvgExpByScImporter(
            peDatasetsAvgExpByScUrls.mapIndexed { i, it ->
                PsychEncodeAvgExpByScHttpSource(it, peDatasets[i])
            }
        )
        val peDatasetsPctExpByCtImp = PsychEncodePctExpByCtImporter(
            peDatasetsPctExpByCtUrls.mapIndexed { i, it ->
                PsychEncodePctExpByCtHttpSource(it, peDatasets[i])
            }
        )

        val peDatasetsPctExpByScImp = PsychEncodePctExpByScImporter(
            peDatasetsPctExpByScUrls.mapIndexed { i, it ->
                PsychEncodePctExpByScHttpSource(it, peDatasets[i])
            }
        )
        importers += peDatasetsAvgExpByCtImp
        importers += peDatasetsAvgExpByScImp
        importers += peDatasetsPctExpByCtImp
        importers += peDatasetsPctExpByScImp
        importers += caQTLImp
        
        importers += deconQTLImp
        importers += degImp
        importers += qtlsigAssocImp
        



        // import lists of genes, transcripts, exons, and UTRs
        val featureSources = mutableListOf<FeatureSource>()
        if (gff3Files.isNotEmpty()) {
            featureSources += Gff3FileFeatureSource(gff3Files.map { it.split(";") }.groupBy({ it[0] }, {
                val file = File(it[1])
                if (!file.exists()) throw Exception("given GFF3 file $file does not exist.")
                return@groupBy file
            }))
        }
        if (gff3FtpUrls.isNotEmpty()) {
            featureSources += Gff3FtpFeatureSource(gff3FtpUrls.map { it.split(";") }.groupBy({ it[0] }, { it[1] }))
        }
        if (featureSources.isNotEmpty()) importers += FeatureImporter(featureSources)

        // import ENCODE RNA-seq metadata
        val metadataSources = mutableListOf<MetadataSource>()
        if (encodeMetadataAssemblies.isNotEmpty()) metadataSources += EncodeMetadataHttpSource(encodeMetadataAssemblies, encodeApiPar)
        if (encodeMetadataFiles.isNotEmpty()) metadataSources += EncodeMetadataFileSource(encodeMetadataFiles)
        if (metadataSources.isNotEmpty()) importers += MetadataImporter(metadataSources)

        // import gene and transcript quantification files
        val quantSources = mutableListOf<QuantificationSource>()
        if (localGeneQuantFiles.isNotEmpty() || localTranscriptQuantFiles.isNotEmpty()) {
            // local gene and transcript quantifications
            quantSources += FileQuantificationSource(
                    localGeneQuantFiles.map { it.split(";") }.groupBy({ it[0] }, {
                        val file = File(it[3])
                        if (!file.exists()) throw Exception("given gene quantification file $file does not exist.")
                        return@groupBy LocalQuantificationFile(it[1], it[2], file)
                    }),
                    localTranscriptQuantFiles.map { it.split(";") }.groupBy({ it[0] }, {
                        val file = File(it[3])
                        if (!file.exists()) throw Exception("given transcript quantification file $file does not exist.")
                        return@groupBy LocalQuantificationFile(it[1], it[2], file)
                    }),
                    localQuantFilePar
            )
        }
        val quantSources = mutableListOf<QuantificationSource>()
        if (encodeQuantAssemblies.isNotEmpty()) {
            // ENCODE gene and transcript quantifications
            quantSources += EncodeQuantificationSource(encodeQuantAssemblies, encodeApiPar, encodeQuantFilePar)
        }

        if (quantSources.isNotEmpty()) importers += QuantificationImporter(quantSources, quantPostProcessingPar)

        // PsychENCODE clinical metadata
        val psychEncodeMetadataSrcs = mutableListOf<PsychEncodeMetadataSource>()
        if (psychEncodeClinicalMetadataUrl != null) {
            psychEncodeMetadataSrcs += PsychEncodeMetadataHttpSource(psychEncodeClinicalMetadataUrl!!)
        }
        if (psychEncodeClinicalMetadataFile != null) {
            psychEncodeMetadataSrcs += PsychEncodeMetadataFileSource(psychEncodeClinicalMetadataFile!!)
        }
        if(psychEncodeMetadataSrcs.isNotEmpty()) {
            importers += PsychEncodeMetadataImporter(psychEncodeMetadataSrcs)
        }

        // PsychENCODE dataset metadata
        val psychEncodeDSMetaSrcs = mutableListOf<PsychEncodeDatasetMetadataSource>()
        if (psychEncodeDatasetMetadataUrl != null) {
            psychEncodeDSMetaSrcs += PsychEncodeDatasetMetadataHttpSource(psychEncodeDatasetMetadataUrl!!)
        }
        if (psychEncodeDatasetMetadataFile != null) {
            psychEncodeDSMetaSrcs += PsychEncodeDatasetMetadataFileSource(psychEncodeDatasetMetadataFile!!)
        }
        if (psychEncodeDSMetaSrcs.isNotEmpty()) importers += PsychEncodeDatasetMetadataImporter(psychEncodeDSMetaSrcs)

        // PsychENCODE gene and transcript quantification files
        if (psychEncodeClinicalMetadataUrl != null && psychEncodeQuantificationUrl != null) {
            quantSources += PsychEncodeQuantificationSource("hg19", psychEncodeClinicalMetadataUrl!!,
                    psychEncodeQuantificationUrl!!, psychEncodeParallelism)
        }

        if (gsQuantBucket != null && gsQuantUserCollection != null) {
            quantSources += GSQuantificationSource(gsQuantBucket!!, gsQuantUserCollection!!)
        }
        if (quantSources.isNotEmpty()) importers += QuantificationImporter(quantSources, quantPostProcessingPar)

        //import genes associations
        val geneAssociationsSources = mutableListOf<GeneAssociationSource>()
        if(genesAssociationGSBase.isNotEmpty()){
            geneAssociationsSources += genesAssociationGSBase.map { GSGeneAssociationsSource(it.toGSDirectory()) }
        }

        if(genesAssociationFiles.isNotEmpty()){
            geneAssociationsSources += genesAssociationFiles.map { GeneAssociationFileSource(listOf(File(it))) }
        }

        if(geneAssociationsSources.isNotEmpty()) importers += GeneAssociationImporter(geneAssociationsSources)

        //import single cell genes box plot 
        val singlecellboxplotSources = mutableListOf<SingleCellDiseaseBoxPlotSource>()
        if(singlecellboxplotGSBase.isNotEmpty()){
            singlecellboxplotSources += singlecellboxplotGSBase.map { GSSingleCellDiseaseBoxPlotSource(it.toGSDirectory()) }
        }

        if(singlecellboxplotFiles.isNotEmpty()){
            singlecellboxplotSources += singlecellboxplotFiles.map { SingleCellDiseaseBoxPlotFileSource(listOf(File(it))) }
        }

        if(singlecellboxplotSources.isNotEmpty()) importers += SingleCellDiseaseBoxPlotImporter(singlecellboxplotSources)
        
        runImporters(dbUrl, dbUsername, dbPassword, dbSchema, replaceSchema, importers)
    }

}

fun runImporters(dbUrl: String,
                 dbUsername: String? = null,
                 dbPassword: String? = null,
                 dbSchema: String? = null,
                 replaceSchema: Boolean = false,
                 importers: List<Importer>) {

    // Create the schema if it does not exist.
    DriverManager.getConnection(dbUrl, dbUsername, dbPassword).use { conn ->
        conn.createStatement().use { stmt ->
            if (replaceSchema) {
             // stmt.executeUpdate("DROP SCHEMA IF EXISTS $dbSchema CASCADE")
            }
            stmt.executeUpdate("CREATE SCHEMA IF NOT EXISTS $dbSchema")
            log.info { "created dbschema $dbSchema" }           
        }
    }

    val config = HikariConfig()
    config.jdbcUrl = dbUrl
    config.username = dbUsername
    config.password = dbPassword
    config.schema = dbSchema!!.toLowerCase()
    config.minimumIdle = 1
    config.maximumPoolSize = 100

    HikariDataSource(config).use { dataSource ->
        for (importer in importers) {
           importer.import(dataSource)
        }
    }

}
