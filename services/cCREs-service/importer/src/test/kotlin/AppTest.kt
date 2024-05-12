import import.*
import io.kotlintest.*
import io.kotlintest.specs.StringSpec
import okhttp3.mockwebserver.*
import okio.*
import source.*
import java.io.File
import java.nio.file.*
import java.sql.*

const val BASE_DB_URL = "jdbc:postgresql://localhost:5555/postgres"
const val TEST_SCHEMA = "ccres"
const val DB_URL = "$BASE_DB_URL?currentSchema=$TEST_SCHEMA"
const val DB_USERNAME = "postgres"

class AppTest : StringSpec() {

    override fun beforeTest(description: Description) {
        executeAdminUpdates("DROP SCHEMA IF EXISTS $TEST_SCHEMA CASCADE", "CREATE SCHEMA $TEST_SCHEMA")
    }

    override fun afterTest(description: Description, result: TestResult) {
        executeAdminUpdates("DROP SCHEMA $TEST_SCHEMA CASCADE")
    }

    init {

        "Orthology import from local file" {
            val testFile = File(AppTest::class.java.getResource("hg38-mm10-Homologous.txt").file)
            val importers: List<Importer> = listOf(OrthologImporter(listOf(OrthologFileSource(listOf(testFile)))))
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers = importers)
            
            // check length
            checkQuery("SELECT COUNT(*) FROM grch38_mm10_ortholog ") { result ->
                result.next()
                result.getInt(1) shouldBe 537822
            }

            // check contents
            checkQuery("SELECT * FROM grch38_mm10_ortholog LIMIT 1") { result ->
                result.next()
                result.getString("grch38") shouldBe "EH38E3031186"
                result.getString("mm10") shouldBe "EM10E0487046"
            }

        }
        
         "Linked Genes import from local file" {
            val testFile = File(AppTest::class.java.getResource("GRCh38_Gene-Links.BETA.txt").file)
            val importers: List<Importer> = listOf(
                LinkedGenesImporter(listOf(LinkedGenesFileSource(listOf(testFile))))
            )
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers = importers)
            
            checkQuery("SELECT COUNT(*) FROM linked_genes ") { result ->
                result.next()
                result.getInt(1) shouldBe 10
            }
        }

        "Versioning import from local file" {
            val testFile = File(AppTest::class.java.getResource("2020_01_GRCh38.tsv").file)

            val importers: List<Importer> = listOf(
                VersioningImporter(listOf(VersioningFileSource(listOf(testFile))))
            )
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers = importers)
            checkQuery("SELECT COUNT(*) FROM grch38_ground_level_versions ") { result ->
                result.next()
                result.getInt(1) shouldBe 9045
            }
            checkQuery("SELECT * FROM grch38_ground_level_versions LIMIT 1") { result ->
                result.next()
                result.getString("version") shouldBe "2020-1"
            }
        }

        "should import hg38 rDHSs from a local file" {
            val localFile = File(AppTest::class.java.getResource("GRCh38-rDHSs.subset.bed.gz").file)
            val importers = listOf(
                rDHSImporter(
                    listOf(
                        rDHSFileSource(localFile, "GRCh38")
                    )
                )
            )
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers=importers)
            checkQuery("SELECT COUNT(*) FROM GRCh38_rDHSs") { result ->
                result.next()
                result.getInt(1) shouldBe 66784
            }
        }

        "should import hg38 rDHSs over HTTP" {
            val server = MockWebServer()
            server.start()
            val baseUrl = server.url("test.gz").toString()
            server.queueBytesFromResource("GRCh38-rDHSs.subset.bed.gz")
            val importers = listOf(
                rDHSImporter(
                    listOf(
                        rDHSHTTPSource(baseUrl, "GRCh38")
                    )
                )
            )
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers=importers)
            checkQuery("SELECT COUNT(*) FROM GRCh38_rDHSs") { result ->
                result.next()
                result.getInt(1) shouldBe 66784
            }
        }

        "should import hg38 cCREs from a local file" {
            val localFile = File(AppTest::class.java.getResource("GRCh38-cCREs-subset.bed.gz").file)
            val importers = listOf(
                cCREImporter(
                    listOf(
                        cCREFileSource(localFile, "GRCh38")
                    )
                )
            )
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers=importers)
            checkQuery("SELECT COUNT(*) FROM GRCh38_cCREs") { result ->
                result.next()
                result.getInt(1) shouldBe 16784
            }
        }

        "should import hg38 cCREs over HTTP" {
            val server = MockWebServer()
            server.start()
            val baseUrl = server.url("test.gz").toString()
            server.queueBytesFromResource("GRCh38-cCREs-subset.bed.gz")
            val importers = listOf(
                cCREImporter(
                    listOf(
                        cCREHTTPSource(baseUrl, "GRCh38")
                    )
                )
            )
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers=importers)
            checkQuery("SELECT COUNT(*) FROM GRCh38_cCREs") { result ->
                result.next()
                result.getInt(1) shouldBe 16784
            }
        }

        "should import hg38 biosamples from local files" {

            val localFile = File(AppTest::class.java.getResource("GRCh38-rDHSs.subset.bed.gz").file)
            val dnase = File(AppTest::class.java.getResource("dnase-list.txt.gz").file)
            val h3k4me3 = File(AppTest::class.java.getResource("h3k4me3-list.txt.gz").file)
            val importers = listOf(
                rDHSImporter(
                    listOf(
                        rDHSFileSource(localFile, "GRCh38")
                    )
                ),
                BiosampleImporter(
                    listOf(
                        BiosampleFileSource(dnase, "GRCh38", "dnase"),
                        BiosampleFileSource(h3k4me3, "GRCh38", "h3k4me3")
                    )
                )
            )
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers=importers)
            checkQuery("SELECT COUNT(*) FROM GRCh38_biosamples") { result ->
                result.next()
                result.getInt(1) shouldBe 734
            }
            checkQuery("SELECT COUNT(*) FROM GRCh38_biosamples WHERE dnase_experiment IS NULL") { result ->
                result.next()
                result.getInt(1) shouldBe 217
            }
            checkQuery("SELECT * FROM GRCh38_experiments WHERE accession = 'ENCSR000EPH'") { result ->
                result.next()
                result.getString("ontology") shouldBe "epithelium"
                result.getString("sample_type") shouldBe "cell line"
                result.getString("life_stage") shouldBe "adult"
            }
        }

        "should import hg38 biosamples over HTTP" {
            
            val localFile = File(AppTest::class.java.getResource("GRCh38-rDHSs.subset.bed.gz").file)
            val dServer = MockWebServer()
            dServer.start()
            val dBaseUrl = dServer.url("dnase.gz").toString()
            dServer.queueBytesFromResource("dnase-list.txt.gz")

            val eServer = MockWebServer()
            eServer.start()
            val eBaseUrl = eServer.url("h3k4me3.gz").toString()
            eServer.queueBytesFromResource("h3k4me3-list.txt.gz")

            val importers = listOf(
                rDHSImporter(
                    listOf(
                        rDHSFileSource(localFile, "GRCh38")
                    )
                ),
                BiosampleImporter(
                    listOf(
                        BiosampleHTTPSource(dBaseUrl, "GRCh38", "dnase"),
                        BiosampleHTTPSource(eBaseUrl, "GRCh38", "h3k4me3")
                    )
                )
            )
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers=importers)
            checkQuery("SELECT COUNT(*) FROM GRCh38_biosamples") { result ->
                result.next()
                result.getInt(1) shouldBe 734
            }
            checkQuery("SELECT * FROM GRCh38_biosamples WHERE biosample_name = 'A549'") { result ->
                result.next()
                result.getString("dnase_experiment") shouldBe "ENCSR000ELW"
                result.getString("dnase_file") shouldBe "ENCFF688CJL"
                result.getString("h3k4me3_experiment") shouldBe "ENCSR000DPD"
                result.getString("h3k4me3_file") shouldBe "ENCFF152LRB"
            }
        }

        "should import hg38 biosamples with Z-scores over HTTP" {
            val localFile = File(AppTest::class.java.getResource("GRCh38-rDHSs.subset.bed.gz").file)
            val dServer = MockWebServer()
            dServer.start()
            val dBaseUrl = dServer.url("dnase.gz").toString()
            dServer.queueBytesFromResource("dnase-list.1.txt.gz")
            val sServer = MockWebServer()
            sServer.start()
            sServer.queueBytesFromResource("ENCSR000EPH-ENCFF924FJR.txt")
            val importers = listOf(
                rDHSImporter(
                    listOf(
                        rDHSFileSource(localFile, "GRCh38")
                    )
                ),
                BiosampleImporter(
                    listOf(
                        BiosampleHTTPSource(dBaseUrl, "GRCh38", "dnase")
                    )
                )
            )
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers=importers)
            checkQuery("SELECT COUNT(*) FROM GRCh38_biosamples") { result ->
                result.next()
                result.getInt(1) shouldBe 1
            }
        }

    }

}

fun checkQuery(sql: String, check: (result: ResultSet) -> Unit) {
    DriverManager.getConnection(DB_URL, DB_USERNAME, null).use { conn ->
        conn.createStatement().use { stmt ->
            check(stmt.executeQuery(sql))
        }
    }
}

fun executeAdminUpdates(vararg sqlUpdates: String) {
    DriverManager.getConnection(BASE_DB_URL, DB_USERNAME, null).use { conn ->
        conn.createStatement().use { stmt ->
            for(sql in sqlUpdates) stmt.executeUpdate(sql)
        }
    }
}

fun MockWebServer.queueBytesFromResource(resource: String) {
    val body = Buffer()
    body.writeAll(Okio.source(File(AppTest::class.java.getResource(resource).file)))
    this.enqueue(MockResponse().setBody(body))
}
