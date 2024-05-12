import import.*
import io.kotlintest.*
import io.kotlintest.specs.StringSpec
import source.*

class PerformanceTest : StringSpec() {

    override fun afterTest(description: Description, result: TestResult) {
        executeAdminUpdates("DROP SCHEMA IF EXISTS test CASCADE ")
    }

    init {
        // Add / Remove leading '!' to disable / enable. This test should not be pushed enabled.
        "!Run full encode http metadata import" {
            val species = listOf("Homo sapiens", "Mus musculus", "Caenorhabditis elegans", "Drosophila melanogaster")
            val metadataSource = EncodeHttpMetadataSource(species, "ChIP-seq",150)
            val metadataImporter = MetadataImporter(listOf(metadataSource),"ChIP-seq")
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers = listOf(metadataImporter))
        }

        "!Run full encode peaks import" {
            val peaksSource = EncodePeaksSource(listOf("Homo sapiens"),"ChIP-seq", 150, 4)
            val peaksImporter = PeaksImporter(listOf(peaksSource),"ChIP-seq", 3)
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers = listOf(peaksImporter))
        }
    }
}