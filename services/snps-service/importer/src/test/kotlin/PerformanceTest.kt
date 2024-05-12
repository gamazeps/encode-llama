import import.*
import io.kotlintest.*
import io.kotlintest.specs.StringSpec
import source.*

private const val HG19_NIH_BASE_URL = "https://ftp.ncbi.nlm.nih.gov/snp/organisms/human_9606_b151_GRCh37p13/BED/"
private const val LDBLOCK_BASE_URL = "https://pubs.broadinstitute.org/mammals/haploreg/data/"

class PerformanceTest : StringSpec() {

    override fun beforeTest(description: Description) {
        executeAdminUpdates("DROP SCHEMA IF EXISTS $TEST_SCHEMA CASCADE", "CREATE SCHEMA $TEST_SCHEMA")
    }

    override fun afterTest(description: Description, result: TestResult) {
        executeAdminUpdates("DROP SCHEMA $TEST_SCHEMA CASCADE")
    }

    init {
        // Add / Remove leading '!' to disable / enable. This test should not be pushed enabled.
        "!Run full snp import from nih" {
             val snpFileUrls = (listOf("1","2").map { it } )
                    .map { "$HG19_NIH_BASE_URL/bed_chr_$it.bed.gz" }

            val snpSource = NihSnpsSource(snpFileUrls, 25, "hg19")
            val snpImporter = SnpsImporter(listOf(snpSource),1)
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA,replaceSchema = true,importers = listOf(snpImporter))
        }
        "!Run full ld block files from broad" {
            val region = "afr"
            val ldblockUrl = "$LDBLOCK_BASE_URL/LD_${region.toUpperCase()}.tsv.gz"
            val snpSource = BroadLdBlockSource(listOf(ldblockUrl), "afr")
            val ldblockImporter = LdBlocksImporter(listOf(snpSource))
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA,replaceSchema = true,importers = listOf(ldblockImporter))
        }
    }
}