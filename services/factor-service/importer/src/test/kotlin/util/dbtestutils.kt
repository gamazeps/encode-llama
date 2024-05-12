package util

import java.sql.*

const val DB_URL = "jdbc:postgresql://localhost:5555/postgres"
const val TEST_SCHEMA = "test"
const val DB_URL_WITH_SCHEMA = "$DB_URL?currentSchema=$TEST_SCHEMA"
const val DB_USERNAME = "postgres"
const val DB_PASSWORD = "postgres"

fun dbUrl(): String {
    var dockerHost: String = System.getenv("TEST_DOCKER_HOST") ?: "localhost"
    return DB_URL.replace("localhost", dockerHost)
}

fun dbUrlWithSchema(): String {
    var dockerHost: String = System.getenv("TEST_DOCKER_HOST") ?: "localhost"
    return DB_URL_WITH_SCHEMA.replace("localhost", dockerHost)
}

fun setupTestDataSource() = setupDataSource(dbUrl(), DB_USERNAME, dbPassword = DB_PASSWORD, dbSchema = TEST_SCHEMA, replaceSchema = true)
fun dropTestSchema() = executeAdminUpdates("DROP SCHEMA $TEST_SCHEMA CASCADE")

fun checkQuery(sql: String, check: (result: ResultSet) -> Unit) {
    DriverManager.getConnection(dbUrlWithSchema(), DB_USERNAME, DB_PASSWORD).use { conn ->
        conn.createStatement().use { stmt ->
            check(stmt.executeQuery(sql))
        }
    }
}

fun executeAdminUpdates(vararg sqlUpdates: String) {
    DriverManager.getConnection(dbUrlWithSchema(), DB_USERNAME, DB_PASSWORD).use { conn ->
        conn.createStatement().use { stmt ->
            for(sql in sqlUpdates) stmt.executeUpdate(sql)
        }
    }
}
