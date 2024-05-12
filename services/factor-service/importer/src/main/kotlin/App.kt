import com.github.ajalt.clikt.core.CliktCommand
import com.github.ajalt.clikt.parameters.options.*
import com.github.ajalt.clikt.parameters.types.*
import import.*
import source.*
import com.zaxxer.hikari.*
import util.logMemory
import util.setupDataSource
import util.withEnvvarSplit
import java.io.File
import javax.sql.DataSource
import java.sql.DriverManager


fun main(args: Array<String>) = Cli().main(args)

class Cli : CliktCommand() {

    private val dbUrl by option("--db-url", envvar = "DB_URL").required()
    private val dbUsername by option("--db-username", envvar = "DB_USERNAME")
    private val dbPassword by option("--db-password", envvar = "DB_PASSWORD")
    private val dbSchema by option("--db-schema", envvar = "DB_SCHEMA")
    private val gff3Files by option("--gff3-files", envvar = "GFF3_FILES")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple()
    private val encodeFiles by option("--encode-files",
            envvar = "ENCODE_FILES",
            help = "Import metadata for encode experiments from the given files")
            .file(exists = true)
            .multiple()
    private val celltypeencodeFiles by option("--encode-celltype-files", envvar = "CT_ENCODE_FILES")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple()
    private val tfdbdFiles by option("--tfdbd-files",
            envvar = "TFDBD_FILES",
            help = "Import tf dbd from given file")
            .file(exists = true)
            .multiple()


    private val gff3FtpUrls by option("--gencode-gff3-urls", envvar = "GFF3_FTP_URLS")
            .withEnvvarSplit(Regex.fromLiteral("|"))
            .multiple()
    private val replaceSchema by option("--replace-schema", envvar = "REPLACE_SCHEMA",
            help = "Set to drop the given schema first before creating it again.")
            .flag(default = false)
    private val encodeApiPar by option("-eap", "--encode-api-par",
            envvar = "ENCODE_API_PAR",
            help = "Parallelism for requests to the encode api. Used for encode peaks and metadata lookup. Default 150.")
            .int()
            .default(150)

    override fun run() {

        val importers = mutableListOf<Importer>()

        val factorSources = mutableListOf<FactorSource>()
        val celltypeSources = mutableListOf<CellTypeSource>()
        if (gff3Files.isNotEmpty() && encodeFiles.isNotEmpty() && tfdbdFiles.isNotEmpty()) {
            val assembliesTogff3Files = gff3Files
                    .map { it.split(";") }
                    .groupBy({ it[0] }, {
                        val file = File(it[1])
                        if (!file.exists()) throw Exception("given GFF3 file $file does not exist.")
                        return@groupBy file
                    })
            factorSources += Gff3FileFactorSource(assembliesTogff3Files,encodeFiles,tfdbdFiles)


        }
        if(celltypeencodeFiles.isNotEmpty())        {

            val assembliesToCtEncodeFiles = celltypeencodeFiles
                    .map { it.split(";") }
                    .groupBy({ it[0] }, {
                        val file = File(it[1])
                        if (!file.exists()) throw Exception("given GFF3 file $file does not exist.")
                        return@groupBy file
                    })
            celltypeSources += FileCelltypeSource(assembliesToCtEncodeFiles)
        }
        if (gff3FtpUrls.isNotEmpty()) {
            val assembliesToFtpUrls = gff3FtpUrls
                    .map { it.split(";") }
                    .groupBy({ it[0] }, { it[1] })
            factorSources += Gff3FtpFactorSource(assembliesToFtpUrls,encodeApiPar)
            celltypeSources += HttpCelltypeSource(assembliesToFtpUrls.keys,encodeApiParallelism = encodeApiPar)
        }
        if (factorSources.isNotEmpty()) importers += FactorImporter(factorSources)
        if (celltypeSources.isNotEmpty()) importers += CellTypeDescImporter(celltypeSources)
        runImporters(dbUrl, dbUsername, dbPassword, dbSchema, replaceSchema,importers)
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

    setupDataSource(dbUrl, dbUsername, dbPassword, dbSchema, replaceSchema).use { ds->
       for (importer in importers) {
            importer.import(ds)
        }
    }
}