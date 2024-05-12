package util

import mu.KotlinLogging
import org.postgresql.PGConnection
import org.postgresql.copy.*
import org.postgresql.core.BaseConnection
import java.io.*
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.*
import java.util.concurrent.atomic.AtomicInteger
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

/**
 * Utility class to help import data directly from an input stream using Postgres COPY.
 * The input stream data must match the format of the given table exactly.
 */
class CopyStreamWriter(dataSource: DataSource, tableDef: String): Closeable {

    private val conn = dataSource.connection
    private val copyManager = CopyManager(conn.unwrap(BaseConnection::class.java))
    private val copySql = """COPY $tableDef FROM STDIN (DELIMITER E'\t')"""

    fun write(inputStream: InputStream) = synchronized(this) {
        copyManager.copyIn(copySql, inputStream)
    }

    override fun close() {
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

/**
 * Executes sql updates in a given sql resource file in parallel.
 *
 * Each update in the file will be delimited by "----"
 */
fun executeSqlResourceParallel(name: String, dataSource: DataSource, resourceName: String, parallelism: Int,
                               replacements: Map<String, String>? = null) {
   var schemaText = sqlResourceText(resourceName)
    replacements?.forEach { schemaText = schemaText.replace(it.key, it.value) }
    val schemaParts = schemaText.split("----").map { it.trim() }
    val counter = AtomicInteger()
    runParallel(name, schemaParts, parallelism, logProgress = false) { schemaPart ->
        val id = counter.incrementAndGet()
        log.info { "Executing sql update #$id: \n$schemaPart" }
        executeSql(dataSource, schemaPart)
        log.info { "Execution complete for sql update #$id" }
    }
}
fun sqlResourceText(resourceName: String) =
        CopyValueWriter::class.java.classLoader.getResource(resourceName).readText()

fun executeSql(dataSource: DataSource, sql: String) = dataSource.connection.use { conn ->
    conn.createStatement().use { stmt -> stmt.executeUpdate(sql) }
}

/*
 * DB Extension functions
 */
fun Date.toDbDate() = DateTimeFormatter.ISO_LOCAL_DATE.withZone(ZoneId.of("UTC")).format(this.toInstant())!!

/*
 * DB Extension functions
 */
fun <T> List<T>.toDbString(transform: (T) -> String = { it.toString() }) =
        this.joinToString(",", "{", "}", transform = { transform(it) })