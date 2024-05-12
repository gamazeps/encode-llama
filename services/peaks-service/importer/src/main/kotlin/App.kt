import com.github.ajalt.clikt.core.CliktCommand
import com.github.ajalt.clikt.parameters.options.*
import com.github.ajalt.clikt.parameters.types.*
import import.*
import source.*
import com.zaxxer.hikari.*
import util.ENCODE_BASE_URL
import util.logMemory
import util.withEnvvarSplit
import java.io.File
import javax.sql.DataSource
import java.sql.DriverManager


fun main(args: Array<String>) = Cli().main(args)

class Cli : CliktCommand() {

    private val encodePeaksSpecies by option("-eps", "--encode-peaks-species",
            envvar = "ENCODE_PEAKS_SPECIES",
            help = "Import peaks files from ENCODE for the given species")
            .withEnvvarSplit(Regex.fromLiteral(","))
            .multiple()
    private val encodeApiPar by option("-eap", "--encode-api-par",
            envvar = "ENCODE_API_PAR",
            help = "Parallelism for requests to the encode api. Used for encode peaks and metadata lookup. Default 150.")
            .int()
            .default(150)
    private val encodeFilePar by option("-efp", "--encode-file-par",
            envvar = "ENCODE_FILE_PAR",
            help = "Parallelism for downloading / importing encode peaks files. Default 1.")
            .int()
            .default(1)
    private val peaksFiles by option("-pf", "--peaks-files",
            envvar = "PEAKS_FILES",
            help = "Import the given peaks files with experiment and file accessions. " +
                    "Use the format \"assembly:experiment_accession:file_accession:filename.ext\"")
            .multiple()
    private val peaksPostProcPar by option("-ppp", "--peaks-post-proc-par",
            envvar = "PEAKS_POST_PROC_PAR",
            help = "Parallelism for tasks in the peaks import post-processing step. This should be no greater " +
                    "than the number of cores on the postgres server.")
            .int()
            .default(1)
    private val importHistonePeaks by option("-ihp", "--import-histone-peaks",
            envvar = "IMPORT_HISTONE_PEAKS",
            help = "flag which tells whether to import histone peaks or not")
            .flag(default = false)
    private val encodeMetadataSpecies by option("-ems", "--encode-metadata-species",
            envvar = "ENCODE_METADATA_SPECIES",
            help = "Import metadata for encode experiments via encode http service for the given species")
            .withEnvvarSplit(Regex.fromLiteral(","))
            .multiple()
    private val encodeMetadataFiles by option("-emf", "--encode-metadata-files",
            envvar = "ENCODE_METADATA_FILES",
            help = "Import metadata for encode experiments from the given files")
            .file(exists = true)
            .multiple()
    private val dbUrl by option("--db-url", envvar = "DB_URL").required()
    private val dbUsername by option("--db-username", envvar = "DB_USERNAME")
    private val dbPassword by option("--db-password", envvar = "DB_PASSWORD")
    private val dbSchema by option("--db-schema", envvar = "DB_SCHEMA")
    private val replaceSchema by option("--replace-schema", envvar = "REPLACE_SCHEMA",
            help = "Set to drop the given schema first before creating it again.")
            .flag(default = false)

    override fun run() {
        val importers = mutableListOf<Importer>()

        //chip-seq metadata
            val chipseqMetadataSources = mutableListOf<MetadataSource>()
            if (encodeMetadataSpecies.isNotEmpty()) chipseqMetadataSources += EncodeHttpMetadataSource(encodeMetadataSpecies, "ChIP-seq", encodeApiPar)
            if (encodeMetadataFiles.isNotEmpty()) chipseqMetadataSources += EncodeFileMetadataSource(encodeMetadataFiles,"ChIP-seq")
            if(chipseqMetadataSources.isNotEmpty()) importers += MetadataImporter(chipseqMetadataSources,"ChIP-seq")

        //chip-seq peaks
            val chipPeakSources = mutableListOf<PeaksSource>()
            if (encodePeaksSpecies.isNotEmpty()) chipPeakSources += EncodePeaksSource(encodePeaksSpecies,"ChIP-seq", encodeApiPar,encodeFilePar, ENCODE_BASE_URL,importHistonePeaks)
            if (peaksFiles.isNotEmpty()) chipPeakSources += FilePeaksSource(parsePeaksFiles())
            if(chipPeakSources.isNotEmpty()) importers += PeaksImporter(chipPeakSources,"ChIP-seq",peaksPostProcPar)


        //dnase-seq metadata
            val dnaseseqMetadataSources = mutableListOf<MetadataSource>()
            if (encodeMetadataSpecies.isNotEmpty()) dnaseseqMetadataSources += EncodeHttpMetadataSource(encodeMetadataSpecies,"dnase-seq", encodeApiPar)
            if(dnaseseqMetadataSources.isNotEmpty()) importers += MetadataImporter(dnaseseqMetadataSources,"dnase-seq")


        //dnase-seq peaks
            val dnasePeakSources = mutableListOf<PeaksSource>()
            if (encodePeaksSpecies.isNotEmpty()) dnasePeakSources += EncodePeaksSource(encodePeaksSpecies,"dnase-seq", encodeApiPar,encodeFilePar)
            if(dnasePeakSources.isNotEmpty()) importers += PeaksImporter(dnasePeakSources,"dnase-seq",peaksPostProcPar)


        //atac-seq metadata
            val atacseqMetadataSources = mutableListOf<MetadataSource>()
            if (encodeMetadataSpecies.isNotEmpty()) atacseqMetadataSources += EncodeHttpMetadataSource(encodeMetadataSpecies,"atac-seq", encodeApiPar)
            if(atacseqMetadataSources.isNotEmpty())  importers += MetadataImporter(atacseqMetadataSources,"atac-seq")

        //atac-seq peaks
            val atacPeakSources = mutableListOf<PeaksSource>()
            if (encodePeaksSpecies.isNotEmpty()) atacPeakSources += EncodePeaksSource(encodePeaksSpecies,"atac-seq", encodeApiPar,encodeFilePar)
            if(atacPeakSources.isNotEmpty())  importers += PeaksImporter(atacPeakSources,"atac-seq",peaksPostProcPar)


        runImporters(dbUrl, dbUsername, dbPassword, dbSchema, replaceSchema,importers)
    }

    private fun parsePeaksFiles() = peaksFiles
            .map { it.split(":") }
            .groupBy({it[0]}, {
                val file = File(it[3])
                if (!file.exists()) throw Exception("Given peaks file $file does not exist.")
                PeaksFile(it[1], it[2], file)
            })
}

interface Importer {
    fun import(dataSource: DataSource)
}

fun runImporters(dbUrl: String,
              dbUsername: String? = null,
              dbPassword: String? = null,
              dbSchema: String? = null,
              replaceSchema: Boolean = false,
              importers: List<Importer>) {
    logMemory()

    // Create the schema if it does not exist.
    DriverManager.getConnection(dbUrl, dbUsername, dbPassword).use { conn ->
        conn.createStatement().use { stmt ->
            if (replaceSchema) {
                stmt.executeUpdate("DROP SCHEMA IF EXISTS $dbSchema CASCADE")
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