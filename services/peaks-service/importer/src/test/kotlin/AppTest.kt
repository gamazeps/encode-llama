import import.*
import mu.KotlinLogging
import io.kotlintest.*
import io.kotlintest.specs.StringSpec
import okhttp3.mockwebserver.*
import okio.Buffer
import okio.Okio
import source.*
import util.*
import java.io.File
import java.sql.*
private val log = KotlinLogging.logger {}



const val DB_URL = "jdbc:postgresql://localhost:5555/postgres"
const val TEST_SCHEMA = "test"
const val DB_URL_WITH_SCHEMA = "$DB_URL?currentSchema=$TEST_SCHEMA"
const val DB_USERNAME = "postgres"


class AppTest : StringSpec() {

    override fun afterTest(description: Description, result: TestResult) {
        executeAdminUpdates("DROP SCHEMA $TEST_SCHEMA CASCADE")
    }

    init {
        "Peaks files with metadata should import" {
            val importers = mutableListOf<Importer>()

            val testEncodeMetadataFile = fileForResource("test-encode-metadata.json")
            val testEncodeMetadata2File = fileForResource("test-encode-metadata-2.json")
            val metadataImporter = MetadataImporter(listOf(EncodeFileMetadataSource(listOf(testEncodeMetadataFile, testEncodeMetadata2File),"ChIP-seq")),"ChIP-seq")

            importers += metadataImporter

            val testPeaksFile = PeaksFile("test-experiment", "test-file",
                    fileForResource("test-peaks-sample.bfilt.narrowPeak.gz"))
            val peaksSource = FilePeaksSource(mapOf("GRCh38" to listOf(testPeaksFile)))
            val peaksImporter = PeaksImporter(listOf(peaksSource),"ChIP-seq", 2)
            importers += peaksImporter

            runImporters(DB_URL_WITH_SCHEMA, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers = importers)
            checkQuery("SELECT * FROM chip_seq_peaks_grch38 LIMIT 1") { result ->
                result.next()
                result.getString("chrom") shouldBe "chr19"
                result.getInt("chrom_start") shouldBe 23357394
                result.getInt("chrom_end") shouldBe 23357603
                result.getString("name") shouldBe "Peak_1"
                result.getInt("score") shouldBe 1000
                result.getString("strand") shouldBe "."
                result.getDouble("signal_value") shouldBe 42.62056
                result.getDouble("p_value") shouldBe 113.80706
                result.getDouble("q_value") shouldBe 106.01945
                result.getInt("peak") shouldBe 72
            }
            checkQuery("SELECT COUNT(*) FROM chip_seq_peaks_grch38") { result ->
                result.next()
                result.getInt(1) shouldBe 5168
            }
            checkQuery("SELECT * FROM chip_seq_peak_counts ORDER BY assembly LIMIT 1") { result ->
                result.next()
                result.getString("assembly") shouldBe "GRCh38"
                result.getInt("count") shouldBe 5168
            }
        }
        "Metadata should import Encode file" {
            val testEncodeMetadataFile = fileForResource("test-encode-metadata.json")
            val testEncodeMetadata2File = fileForResource("test-encode-metadata-2.json")
            val metadataImporter = MetadataImporter(listOf(EncodeFileMetadataSource(listOf(testEncodeMetadataFile, testEncodeMetadata2File),"ChIP-seq")),"ChIP-seq")
            runImporters(DB_URL_WITH_SCHEMA, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers = listOf(metadataImporter))
            checkQuery("SELECT COUNT(*) FROM chip_seq_datasets") { result ->
                result.next()
                result.getInt(1) shouldBe 2
            }
            checkQuery("SELECT * FROM chip_seq_datasets order by accession LIMIT 1") { result ->
                result.next()
                log.info { "${ result.getString("accession")}" }
                result.getString("accession") shouldBe "ENCSR411SUC"
                result.getString("target") shouldBe "EP300"
                result.getString("released") shouldBe null
                result.getString("system_slims") shouldBe  "{\"digestive system\"}"
                result.getString("cell_slims") shouldBe  "{}"
                result.getString("developmental_slims") shouldBe  "{endoderm}"
                result.getString("organ_slims") shouldBe  "{stomach}"               
            
            }
            checkQuery("SELECT * FROM chip_seq_sequence_reads order by accession LIMIT 1") { result ->
                result.next()
                result.getString("accession") shouldBe "ENCFF261LMZ"
                result.getString("dataset_accession") shouldBe "ENCSR411SUC"
                result.getBoolean("paired_end") shouldBe false
                result.getInt("read_id") shouldBe 0
                result.getInt("biorep") shouldBe 1
                result.getInt("techrep") shouldBe 1
                result.getString("url") shouldBe "https://encode-files.s3.amazonaws.com/2016/10/31/e16b5d11-0895-4c89-b6f8-b1b720b32f49/ENCFF261LMZ.fastq.gz"

            }
            checkQuery("SELECT * FROM chip_seq_filtered_alignments order by accession LIMIT 1") { result ->
                result.next()
                result.getString("accession") shouldBe "ENCFF643SJB"
                result.getString("dataset_accession") shouldBe "ENCSR428BSK"
                result.getString("assembly") shouldBe "mm10-minimal"
                result.getInt("biorep") shouldBe 2
                result.getInt("techrep") shouldBe 1
                result.getString("url") shouldBe "https://encode-files.s3.amazonaws.com/2016/03/29/6e0a594e-f215-4bd9-be0a-43546927af06/ENCFF643SJB.bam"
            }
            checkQuery("SELECT * FROM chip_seq_replicated_peaks order by accession LIMIT 1") { result ->
                result.next()
                result.getString("accession") shouldBe "ENCFF142ZIU"
                result.getString("dataset_accession") shouldBe "ENCSR428BSK"
                result.getString("assembly") shouldBe "mm10"
                result.getString("url") shouldBe "https://encode-files.s3.amazonaws.com/2017/05/11/dd8426ee-86ac-4c72-9345-bb9eda7650ef/ENCFF142ZIU.bed.gz"

            }
            checkQuery("SELECT * FROM chip_seq_bigbed_replicated_peaks order by accession LIMIT 1") { result ->
                result.next()
                result.getString("accession") shouldBe "ENCFF315LKF"
                result.getString("dataset_accession") shouldBe "ENCSR428BSK"
                result.getString("assembly") shouldBe "mm10"
                result.getString("url") shouldBe "https://encode-files.s3.amazonaws.com/2017/05/11/eb36527b-5023-4556-9024-05ea9fc1d9e0/ENCFF315LKF.bigBed"
                
            }
            checkQuery("SELECT * FROM chip_seq_bigbed_unreplicated_peaks order by accession LIMIT 1") { result ->
                result.next()
                result.getString("accession") shouldBe "ENCFF102MNZ"
                result.getString("dataset_accession") shouldBe "ENCSR411SUC"
                result.getString("assembly") shouldBe "GRCh38"
                result.getInt("biorep") shouldBe 1
                result.getInt("techrep") shouldBe 1            
                result.getBoolean("archived") shouldBe true
                result.getString("url") shouldBe "https://encode-files.s3.amazonaws.com/2017/06/15/866cda6f-3cce-45aa-87c6-33d42832a56f/ENCFF102MNZ.bigBed"

            }
        }

        "Metadata should import from encode site" {
            val server = MockWebServer()
            server.start()
            val baseUrl = server.url("").toString()
            server.queueTextFromResource("test-encode-search-result.json")
            server.queueTextFromResource("test-encode-metadata.json")
            server.queueTextFromResource("test-encode-metadata-2.json")

            val metadataSource = EncodeHttpMetadataSource(listOf("Homo sapiens"), "ChIP-seq",150, baseUrl)
            val metadataImporter = MetadataImporter(listOf(metadataSource),"ChIP-seq")
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers = listOf(metadataImporter))
            checkQuery("SELECT COUNT(*) FROM chip_seq_datasets") { result ->
                result.next()
                result.getInt(1) shouldBe 2
            }
        }
    }
}

fun fileForResource(resource: String) = File(AppTest::class.java.getResource(resource).file)

fun checkQuery(sql: String, check: (result: ResultSet) -> Unit) {
    DriverManager.getConnection(DB_URL_WITH_SCHEMA, DB_USERNAME, null).use { conn ->
        conn.createStatement().use { stmt ->
            check(stmt.executeQuery(sql))
        }
    }
}

fun executeAdminUpdates(vararg sqlUpdates: String) {
    DriverManager.getConnection(DB_URL, DB_USERNAME, null).use { conn ->
        conn.createStatement().use { stmt ->
            for(sql in sqlUpdates) stmt.executeUpdate(sql)
        }
    }
}

fun MockWebServer.queueTextFromResource(resource: String, bodyTransform: ((String) -> String)? = null) {
    var body = AppTest::class.java.getResource(resource).readText()
    if (bodyTransform != null) body = bodyTransform(body)
    this.enqueue(MockResponse().setBody(body))
}

fun MockWebServer.queueBytesFromResource(resource: String) {
    val body = Buffer()
    body.writeAll(Okio.source(File(AppTest::class.java.getResource(resource).file)))
    this.enqueue(MockResponse().setBody(body))
}