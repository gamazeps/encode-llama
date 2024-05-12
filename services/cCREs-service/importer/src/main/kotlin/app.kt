import com.github.ajalt.clikt.core.CliktCommand
import com.github.ajalt.clikt.parameters.options.*
import com.github.ajalt.clikt.parameters.types.*
import import.*
import source.*
import com.zaxxer.hikari.*
import javax.sql.DataSource
import util.withEnvvarSplit
import java.sql.DriverManager
import mu.KotlinLogging
import java.io.File
import model.*

private val log = KotlinLogging.logger {}
fun main(args: Array<String>) = Cli().main(args)

class Cli : CliktCommand() {

    private val dbUrl by option("--db-url", envvar = "DB_URL").required()
    private val dbUsername by option("--db-username", envvar = "DB_USERNAME")
    private val dbPassword by option("--db-password", envvar = "DB_PASSWORD")
    private val dbSchema by option("--db-schema", envvar = "DB_SCHEMA")
    private val replaceSchema by option("--replace-schema", envvar = "REPLACE_SCHEMA",
        help = "Set to drop the given schema first before creating it again.").flag(default = false)

    // rDHS
    private val rDHS_URLs by option("--rdhs-urls", envvar = "RDHS_URL").withEnvvarSplit(Regex.fromLiteral("|")).multiple()
    private val rDHS_URL_assemblies by option("--rdhs-url-assemblies", envvar = "RDHS_URL_ASSEMBLIES").withEnvvarSplit(Regex.fromLiteral("|")).multiple()
    private val rDHSLocal by option("--rdhs-local-paths", envvar = "RDHS_PATH").file(exists = true).withEnvvarSplit(Regex.fromLiteral("|")).multiple()
    private val rDHSLocalAssemblies by option("--rdhs-local-assemblies", envvar = "RDHS_LOCAL_ASSEMBLIES").withEnvvarSplit(Regex.fromLiteral("|")).multiple()

    // cCREs
    private val cCRE_URLs by option("--ccre-urls", envvar = "CCRE_URL").withEnvvarSplit(Regex.fromLiteral("|")).multiple()
    private val cCRE_URL_assemblies by option("--ccre-url-assemblies", envvar = "CCRE_URL_ASSEMBLIES").withEnvvarSplit(Regex.fromLiteral("|")).multiple()
    private val cCRELocal by option("--ccre-local-paths", envvar = "CCRE_PATH").file(exists = true).withEnvvarSplit(Regex.fromLiteral("|")).multiple()
    private val cCRELocalAssemblies by option("--ccre-local-assemblies", envvar = "CCRE_LOCAL_ASSEMBLIES").withEnvvarSplit(Regex.fromLiteral("|")).multiple()

    // biosamples
    private val biosample_URLs by option("--biosample-urls", envvar = "BIOSAMPLE_URL").withEnvvarSplit(Regex.fromLiteral("|")).multiple()
    private val biosample_URL_assemblies by option("--biosample-url-assemblies", envvar = "BIOSAMPLE_URL_ASSEMBLIES").withEnvvarSplit(Regex.fromLiteral("|")).multiple()
    private val biosample_URL_assays by option("--biosample-url-assays", envvar = "BIOSAMPLE_URL_ASSAYS").withEnvvarSplit(Regex.fromLiteral("|")).multiple()
    private val biosampleLocal by option("--biosample-local-paths", envvar = "BIOSAMPLE_PATH").file(exists = true).withEnvvarSplit(Regex.fromLiteral("|")).multiple()
    private val biosampleLocalAssemblies by option("--biosample-local-assemblies", envvar = "BIOSAMPLE_LOCAL_ASSEMBLIES").withEnvvarSplit(Regex.fromLiteral("|")).multiple()
    private val biosampleLocalAssays by option("--biosample-local-assays", envvar = "BIOSAMPLE_LOCAL_ASSAYS").withEnvvarSplit(Regex.fromLiteral("|")).multiple()
    
    // versioning
    private val versioningFiles by option("-versioningf", "--versioning-files", envvar = "VERSIONING_FILES",
        help = "versioning files").withEnvvarSplit(Regex.fromLiteral("|")).multiple()
    private val versioningGSBase by option("-versioningcgsbase","--versioning-gsdir", envvar = "VERSIONING_GS_DIR", 
        help = "Import versioning from files in the given google storage base path.").withEnvvarSplit(Regex.fromLiteral("|")).multiple()
    
    // linked genes
    private val linkedGenesFiles by option("-linkedgenesf", "--linkedgenes-files", envvar = "LINKEDGENES_FILES",
        help = "linked genes files").withEnvvarSplit(Regex.fromLiteral("|")).multiple()
    private val linkedGenesGSBase by option("-linkedgenesgsbase","--linkedgenes-gsdir", envvar = "LINKEDGENES_GS_DIR", 
        help = "Import linked genes from files in the given google storage base path.").withEnvvarSplit(Regex.fromLiteral("|")).multiple()

    // ortholog
    private val orthologFiles by option("-orthologf", "--ortholog-files", envvar = "ORTHOLOG_FILES",
        help = "ortholog files").withEnvvarSplit(Regex.fromLiteral("|")).multiple()
    private val orthologGSBase by option("-orthologgsbase","--ortholog-gsdir", envvar = "ORTHOLOG_GS_DIR", 
        help = "Import ortholog from files in the given google storage base path.").withEnvvarSplit(Regex.fromLiteral("|")).multiple()
     
    override fun run() {
        val importers: List<Importer> = listOf(

            // import rDHS IDs and coordinates
            rDHSImporter(
                rDHS_URLs.mapIndexed { i, it ->
                    rDHSHTTPSource(it, rDHS_URL_assemblies[i])
                } + rDHSLocal.mapIndexed { i, it ->
                    rDHSFileSource(it, rDHSLocalAssemblies[i])
                }
            ),

            // import cCRE IDs and coordinates
            cCREImporter(
                cCRE_URLs.mapIndexed { i, it ->
                    cCREHTTPSource(it, cCRE_URL_assemblies[i])
                } + cCRELocal.mapIndexed { i, it ->
                    cCREFileSource(it, cCRELocalAssemblies[i])
                }
            ),

            // import biosample metadata
            BiosampleImporter(
                biosample_URLs.mapIndexed { i, it ->
                    BiosampleHTTPSource(it, biosample_URL_assemblies[i], biosample_URL_assays[i])
                } + biosampleLocal.mapIndexed { i, it ->
                    BiosampleFileSource(it, biosampleLocalAssemblies[i], biosampleLocalAssays[i])
                }
            ),

            // import versioning
            VersioningImporter(
                versioningGSBase.map { GSVersioningSource(it.toGSDirectory()) }
                +
                versioningFiles.map { VersioningFileSource(listOf(File(it))) }
            ),

            // import linked genes
            LinkedGenesImporter(
                linkedGenesGSBase.map { GSLinkedGenesSource(it.toGSDirectory()) }
                +
                linkedGenesFiles.map { LinkedGenesFileSource(listOf(File(it))) }
            ),

            // import ortholog
            OrthologImporter(
                orthologGSBase.map { GSOrthologSource(it.toGSDirectory()) }
                +
                orthologFiles.map { OrthologFileSource(listOf(File(it))) }
            )
        )
        runImporters(dbUrl, dbUsername, dbPassword, dbSchema, replaceSchema, importers)
    }
}

interface Importer {
    fun import(dataSource: DataSource)
}

fun runImporters(
    dbUrl: String,
    dbUsername: String? = null,
    dbPassword: String? = null,
    dbSchema: String? = null,
    replaceSchema: Boolean = false,
    importers: List<Importer>
) {
    // Create the schema if it does not exist.
    DriverManager.getConnection(dbUrl, dbUsername, dbPassword).use { conn ->
        conn.createStatement().use { stmt ->
            if (replaceSchema) {
               stmt.executeUpdate("DROP SCHEMA IF EXISTS $dbSchema CASCADE")
            }
           stmt.executeUpdate("CREATE SCHEMA IF NOT EXISTS $dbSchema")
           stmt.executeUpdate("DROP EXTENSION IF EXISTS pg_trgm CASCADE")
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
