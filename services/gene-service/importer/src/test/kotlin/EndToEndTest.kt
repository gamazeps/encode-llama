import com.google.cloud.storage.Bucket
import com.google.cloud.storage.BucketInfo
import com.google.cloud.storage.StorageOptions
import import.QuantificationImporter
import io.kotlintest.Description
import io.kotlintest.TestResult
import io.kotlintest.shouldBe

import io.kotlintest.specs.StringSpec
import source.GSQuantificationSource
import java.io.File

class EndToEndTest : StringSpec() {

    private lateinit var bucket: Bucket

    override fun beforeTest(description: Description) {
        if (System.getenv("SKIP_GCP_TEST") == "T") return
        val client = StorageOptions.getDefaultInstance().service
        bucket = client.create(BucketInfo.of("gene-importer-test-${System.currentTimeMillis()}"))
    }

    override fun afterTest(description: Description, result: TestResult) {
        if (System.getenv("SKIP_GCP_TEST") == "T") return
        bucket.list().iterateAll().forEach { it.delete() }
        bucket.delete()
        executeAdminUpdates("DROP SCHEMA IF EXISTS $TEST_SCHEMA CASCADE")
    }

    init {
       "Run live google storage based quantification data import".config(enabled = System.getenv("SKIP_GCP_TEST") != "T") {
            val userCollection = "test-collection"
            val dataset = "test-dataset"
            val assembly = "hg19"
            val gqFileAccession = "gq-file-accession-1"
            val tqFileAccession = "tq-file-accession-1"

            // Setup test environment
            val testGQuantFile = File(AppTest::class.java.getResource("gene-quant-subset.tsv").file)
            bucket.create("$userCollection/$dataset/gene-quantification/$assembly/$gqFileAccession.tsv", testGQuantFile.inputStream())
            val testTQuantFile = File(AppTest::class.java.getResource("transcript-quant-subset.tsv").file)
            bucket.create("$userCollection/$dataset/transcript-quantification/$assembly/$tqFileAccession.tsv", testTQuantFile.inputStream())

            // Run importer
            val src = GSQuantificationSource(bucket.name, userCollection)
            val importers = listOf(QuantificationImporter(listOf(src), 1))
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers = importers)

            // Check results
            checkQuery("SELECT * FROM gene_quantification_hg19 WHERE gene_id = 'ENSG00000000003.14'") { result ->
                result.next()
                result.getString("gene_id") shouldBe "ENSG00000000003.14"
                result.getArray("transcript_ids").array shouldBe arrayOf("ENST00000373020.8", "ENST00000494424.1",
                        "ENST00000496771.5", "ENST00000612152.4", "ENST00000614008.4")
                result.getFloat("len") shouldBe 2237.80f
                result.getFloat("effective_len") shouldBe 2202.80f
                result.getFloat("expected_count") shouldBe 4294.00f
                result.getFloat("tpm") shouldBe 66.19f
                result.getFloat("fpkm") shouldBe 40.44f
                result.getFloat("posterior_mean_count") shouldBe 4294.00f
                result.getFloat("posterior_standard_deviation_of_count") shouldBe 0.0f
                result.getFloat("pme_tpm") shouldBe 65.02f
                result.getFloat("pme_fpkm") shouldBe 40.46f
                result.getFloat("tpm_ci_lower_bound") shouldBe 62.9258f
                result.getFloat("tpm_ci_upper_bound") shouldBe 67.1365f
                result.getFloat("fpkm_ci_lower_bound") shouldBe 39.1661f
                result.getFloat("fpkm_ci_upper_bound") shouldBe 41.7861f
            }
            checkQuery("SELECT * FROM transcript_quantification_hg19 WHERE transcript_id = 'ENST00000373020.8'") { result ->
                result.next()
                result.getString("transcript_id") shouldBe "ENST00000373020.8"
                result.getString("gene_id") shouldBe "ENSG00000000003.14"
                result.getInt("len") shouldBe 2206
                result.getFloat("effective_len") shouldBe 2171.00f
                result.getFloat("expected_count") shouldBe 3581.54f
                result.getFloat("tpm") shouldBe 56.01f
                result.getFloat("fpkm") shouldBe 34.22f
                result.getFloat("iso_pct") shouldBe 84.63f
                result.getFloat("posterior_mean_count") shouldBe 3576.18f
                result.getFloat("posterior_standard_deviation_of_count") shouldBe 27.72f
                result.getFloat("pme_tpm") shouldBe 54.71f
                result.getFloat("pme_fpkm") shouldBe 34.04f
                result.getFloat("iso_pct_from_pme_tpm") shouldBe 84.14f
                result.getFloat("tpm_ci_lower_bound") shouldBe 52.7301f
                result.getFloat("tpm_ci_upper_bound") shouldBe 56.6875f
                result.getFloat("fpkm_ci_lower_bound") shouldBe 32.8535f
                result.getFloat("fpkm_ci_upper_bound") shouldBe 35.316f
            }
        }
    }
}