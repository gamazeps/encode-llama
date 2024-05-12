package util

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import mu.KotlinLogging
import org.postgresql.PGConnection
import org.postgresql.copy.*
import java.io.*
import java.sql.DriverManager
import javax.sql.DataSource


private val log = KotlinLogging.logger {}

/**
 * Utility class to help import data from free-form string values using Postgres COPY
 */
class CopyValueWriter(dataSource: DataSource, tableDef: String): Closeable {

    private val conn = dataSource.connection
    private val outStream = PGCopyOutputStream(conn.unwrap(PGConnection::class.java),
            """COPY $tableDef FROM STDIN (DELIMITER E'\t')""")

    fun write(vararg values: String?) = synchronized(this) {
        val line = values.joinToString(separator="\t", postfix="\n") { it ?: "\\N" }

        outStream.write(line.toByteArray())
    }

    override fun close() {
        outStream.close()
        conn.close()
    }
}


fun executeSqlResource(dataSource: DataSource, resourceName: String, replacements: Map<String, String>? = null) {
    var schemaText = CopyValueWriter::class.java.classLoader.getResource(resourceName).readText()
    replacements?.forEach { schemaText = schemaText.replace(it.key, it.value) }
    dataSource.connection.use { conn ->
        conn.createStatement().use { stmt ->
            stmt.executeUpdate(schemaText)
        }
    }


}
/*
 * DB Extension functions
 */
fun <T> List<T>.toDbString(transform: (T) -> String = { it.toString() }) =
        this.joinToString(",", "{", "}", transform = { transform(it) })

fun setupDataSource(dbUrl: String, dbUsername: String? = null, dbPassword: String? = null,
                    dbSchema: String? = null, replaceSchema: Boolean = false): HikariDataSource {
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

    return HikariDataSource(config)
}