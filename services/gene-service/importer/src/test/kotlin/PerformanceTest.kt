import import.*
import io.kotlintest.*
import io.kotlintest.specs.StringSpec
import source.*

private val COMPREHENSIVE_GFF3_URLS = mapOf(
    "GRCh38" to listOf("ftp://anonymous@ftp.ebi.ac.uk/pub/databases/gencode/Gencode_human/release_29/gencode.v29.annotation.gff3.gz"),
    "hg19" to listOf("ftp://anonymous@ftp.ebi.ac.uk/pub/databases/gencode/Gencode_human/release_29/GRCh37_mapping/gencode.v29lift37.annotation.gff3.gz"),
    "mm10" to listOf("ftp://anonymous@ftp.ebi.ac.uk/pub/databases/gencode/Gencode_mouse/release_M20/gencode.vM20.annotation.gff3.gz")
)

class PerformanceTest : StringSpec() {

    override fun afterTest(description: Description, result: TestResult) {
        executeAdminUpdates("DROP SCHEMA IF EXISTS $TEST_SCHEMA CASCADE")
    }

    init {
        // Add / Remove leading '!' to disable / enable. This test should not be pushed enabled.
        "!Run full gene import from Gencode for mm10, hg19, and GRCh38" {
	        val importers = listOf(FeatureImporter(listOf(Gff3FtpFeatureSource(COMPREHENSIVE_GFF3_URLS))))
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers = importers)
        }

        "!Run full metadata import from encode for mm10, hg19, and GRCh38" {
            val importers = listOf(MetadataImporter(listOf(EncodeMetadataHttpSource(listOf("hg19", "GRCh38", "mm10"), 150))))
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers = importers)
        }

        "!Run full quantification import from encode for mm10, hg19, and GRCh38" {
            val source = EncodeQuantificationSource(listOf(/*"hg19", */"GRCh38", "mm10"), 150, 2)
            val importers = listOf(QuantificationImporter(listOf(source), 1))
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers = importers)
        }
    }
}
