import import.*
import io.kotlintest.*
import io.kotlintest.specs.StringSpec
import okhttp3.mockwebserver.*
import okio.*
import source.*
import java.io.File
import java.sql.*

const val BASE_DB_URL = "jdbc:postgresql://localhost:5555/postgres"
const val TEST_SCHEMA = "snpstest"
const val DB_URL = "$BASE_DB_URL?currentSchema=$TEST_SCHEMA"
const val DB_USERNAME = "postgres"

class AppTest : StringSpec() {

    override fun afterTest(description: Description, result: TestResult) {
        executeAdminUpdates("DROP SCHEMA $TEST_SCHEMA CASCADE")
    }

    override fun beforeTest(description: Description) {
        executeAdminUpdates("DROP SCHEMA IF EXISTS $TEST_SCHEMA CASCADE", "CREATE SCHEMA $TEST_SCHEMA")
    }

    init {

        "Gwas Snp Associations import from local file" {
            val testFile = File(AppTest::class.java.getResource("YearsEducation_gwassnp.bed").file)

            val importers: List<Importer> = listOf(
                GwasSnpAssociationsImporter(listOf(GwasSnpAssociationsFileSource(listOf(testFile))))
            )
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers = importers)
        }

        "Gwas Intersecting Snp With ccres import from local file" {
            val testFile = File(AppTest::class.java.getResource("ASD_gwassnp_ccre.bed").file)

            val importers: List<Importer> = listOf(
                GwasIntersectingSnpsWithCcreImporter(listOf(GwasIntersectingSnpsWithCcreFileSource(
                listOf(
                File(AppTest::class.java.getResource("ASD_gwassnp_ccre.bed").file)
                
                ))))
            )
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers = importers)

             checkQuery("SELECT COUNT(*) FROM gwas_intersectingsnp_withccres where disease='ASD'") { result ->
	            result.next()
		        result.getInt(1) shouldBe 28
            }
        }

        
        "Gwas Intersecting Snp With bcres import from local file" {

            val importers: List<Importer> = listOf(
                GwasIntersectingSnpsWithBcreImporter(listOf(GwasIntersectingSnpsWithBcreFileSource(listOf(
                File(AppTest::class.java.getResource("ASD_adult_gwassnp_bcre.bed").file),
                File(AppTest::class.java.getResource("ASD_fetal_gwassnp_bcre.bed").file)
                ))))
            )
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers = importers)
             checkQuery("SELECT COUNT(*) FROM gwas_intersectingsnp_withbcres where disease='ASD' and bcre_group='adult'") { result ->
	            result.next()
		        result.getInt(1) shouldBe 6
            }
        }

        
        "Snp Associations import from local file" {
            val testFile = File(AppTest::class.java.getResource("PASS_AgeFirstBirth.sumstats.gz").file)

            val importers: List<Importer> = listOf(
                SnpAssociationsImporter(listOf(SnpAssociationsFileSource(listOf(testFile))))
            )
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers = importers)
        }

        "GTEx eQTL import for hg38 from local tarball" {
            val testFile = File(AppTest::class.java.getResource("GTEx_Analysis_v8_eQTL_test.tar").file)
            val importers: List<Importer> = listOf(
                GTeXeQTLImporter(listOf(GTeXeQTLTarFileSource(testFile)), "hg38", 1)
            )
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers = importers)
            checkQuery("SELECT COUNT(*) FROM hg38_gtex_eQTLs") { result ->
	            result.next()
		        result.getInt(1) shouldBe 198
            }
            checkQuery("SELECT COUNT(*) FROM hg38_gtex_eQTLs WHERE tissue = 'Ovary'") { result ->
                result.next()
                result.getInt(1) shouldBe 99
            }
        }

        "GTEx eQTL import for hg38 over HTTP" {
            val server = MockWebServer()
            server.start()
            server.queueBytesFromResource("GTEx_Analysis_v8_eQTL_test.tar")
            val importers: List<Importer> = listOf(
                GTeXeQTLImporter(listOf(GTeXeQTLTarHTTPSource(server.url("").toString())), "hg38", 1)
            )
            runImporters(DB_URL, DB_USERNAME,dbSchema = TEST_SCHEMA, replaceSchema = true, importers = importers)
            checkQuery("SELECT COUNT(*) FROM hg38_gtex_eQTLs") { result ->
                result.next()
                result.getInt(1) shouldBe 198
            }
            checkQuery("SELECT COUNT(*) FROM hg38_gtex_eQTLs WHERE tissue = 'Whole_Blood'") { result ->
                result.next()
                result.getInt(1) shouldBe 99
            }
        }

	    "PsychENCODE eQTLs import for hg38" {
            val testFile = File(AppTest::class.java.getResource("DER-08_capstone4.eQTL.significant.hg38.test.txt.gz").file)
	        val importers: List<Importer> = listOf(
                PsychEncodeQTLImporter(listOf(PsychEncodeQTLFileSource(listOf(testFile))), "hg38", 1, "e")
            )
	        runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers = importers)
  	        checkQuery("SELECT COUNT(*) FROM hg38_psychencode_eQTLs") { result ->
	            result.next()
		        result.getInt(1) shouldBe 9
	        }
	    }

        "MAF should import from genomes file" {
            val testSnpsFile = File(AppTest::class.java.getResource("chr19.MAF.vcf.gz").file)
            val fileMafSource = FileMafSource(listOf(testSnpsFile))
            val fileMafImporter = MafImporter(listOf(fileMafSource))
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers = listOf(fileMafImporter))
            checkQuery("SELECT COUNT(*) FROM snps_maf") { result ->
                result.next()
                result.getInt(1) shouldBe 19972
            }
            checkQuery("SELECT amr_af FROM snps_maf WHERE snp = 'rs541392352'") {result ->
                result.next()
                result.getFloat(1) shouldBe 0.0014f
            }
        }

        "SNP files should import" {
            val testSnpsFile = File(AppTest::class.java.getResource("hg19_bed_chr_1_subset.bed.gz").file)
            val snpsSource = FileSnpsSource(listOf(testSnpsFile), "hg19")
            val snpsImporter = SnpsImporter(listOf(snpsSource),1)
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers = listOf(snpsImporter))
            checkQuery("SELECT COUNT(*) FROM hg19_snp_coords") { result ->
                result.next()
                result.getInt(1) shouldBe 1009499
            }
            checkQuery("SELECT * FROM hg19_snp_coords LIMIT 1") { result ->
                result.next()
                result.getString("chrom") shouldBe "chr1"
                result.getInt("start") shouldBe 175261678
                result.getInt("stop") shouldBe 175261679
                result.getString("snp") shouldBe "rs171"
            }
        }

        "MAF and SNPs should import with density" {
            val testMafFile = File(AppTest::class.java.getResource("chr19.MAF.vcf.gz").file)
            val fileMafSource = FileMafSource(listOf(testMafFile))
            val fileMafImporter = MafImporter(listOf(fileMafSource))
            val testSnpsFile = File(AppTest::class.java.getResource("hg19_bed_chr_19_subset.bed.gz").file)
            val snpsSource = FileSnpsSource(listOf(testSnpsFile), "hg19")
            val snpsImporter = SnpsImporter(listOf(snpsSource),1)
            val densityImporter = DensityImporter(listOf(snpsSource), 100000)
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers = listOf(
                fileMafImporter, snpsImporter, densityImporter
            ))
            checkQuery("SELECT * FROM hg19_snp_coords_chr19 LIMIT 1") { result ->
                result.next()
                result.getInt("start") shouldBe 60842
                result.getInt("stop") shouldBe 60843
                result.getString("snp") shouldBe "rs541392352"
            }
            checkQuery("SELECT * FROM hg19_snp_density_100000 WHERE chrom = 'chr19' ORDER BY start ASC LIMIT 1") { result ->
                result.next()
                result.getString("chrom") shouldBe "chr19"
                result.getInt("start") shouldBe 0
                result.getInt("stop") shouldBe 100000
                result.getInt("total_snps") shouldBe 1
                result.getInt("common_snps") shouldBe 1
            }
        }

        "LD block files should import" {
            val testLdblocksFile = File(AppTest::class.java.getResource("ld_afr_testdata.tsv.gz").file)
            val ldblockSource = FileLdBlockSource(listOf(testLdblocksFile), "afr")
            val ldblocksImporter = LdBlocksImporter(listOf(ldblockSource))
            runImporters(DB_URL, DB_USERNAME,dbSchema = TEST_SCHEMA, replaceSchema = true, importers = listOf(ldblocksImporter))
            checkQuery("SELECT COUNT(*) FROM ld_afr") { result ->
                result.next()
                result.getInt(1) shouldBe 4000
            }
        }
        "LD block should import based on chrom" {

            val server = MockWebServer()
            server.start()
            server.queueBytesFromResource("ld_afr_testdata.tsv.gz")

            val testLdblocksFile = File(AppTest::class.java.getResource("ld_afr_testdata.tsv.gz").file)
            val testchr10LdblocksFile = File(AppTest::class.java.getResource("LD_chr10_subset_AFR.tsv.gz").file)
            val ldblockSource = FileLdBlockSource(listOf(testLdblocksFile,testchr10LdblocksFile), "afr")
            val ldblockImporter = LdBlocksImporter(listOf(ldblockSource))
            runImporters(DB_URL, DB_USERNAME,dbSchema = TEST_SCHEMA, replaceSchema = true, importers = listOf(ldblockImporter))
            checkQuery("SELECT COUNT(*) FROM ld_afr") { result ->
                result.next()
                result.getInt(1) shouldBe 4100
            }

        }

        "LD block should import from Broad" {

            val server = MockWebServer()
            server.start()
            server.queueBytesFromResource("ld_afr_testdata.tsv.gz")

            val testLdblocksFile = File(AppTest::class.java.getResource("ld_afr_testdata.tsv.gz").file)
            val ldblockSource = FileLdBlockSource(listOf(testLdblocksFile), "afr")
            val ldblockImporter = LdBlocksImporter(listOf(ldblockSource))
            runImporters(DB_URL, DB_USERNAME,dbSchema = TEST_SCHEMA, replaceSchema = true, importers = listOf(ldblockImporter))
            checkQuery("SELECT COUNT(*) FROM ld_afr") { result ->
                result.next()
                result.getInt(1) shouldBe 4000
            }

        }

        "SNPs should import from NIH for hg19, hg38" {

            val importers = mutableListOf<Importer>()
            listOf("hg19","hg38").forEach {
                val server = MockWebServer()
                server.start()
                val baseUrl = server.url("").toString()
                server.queueBytesFromResource("${it}_bed_chr_1_subset.bed.gz")
                val snpFileUrls = listOf("1").map { baseUrl }
                val snpsSource = NihSnpsSource(snpFileUrls,1, it)
                val snpsImporter = SnpsImporter(listOf(snpsSource), 1)
                importers += snpsImporter
            }
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers=importers)
            checkQuery("SELECT COUNT(*) FROM hg19_snp_coords") { result ->
                result.next()
                result.getInt(1) shouldBe 1009499
            }
            checkQuery("SELECT COUNT(*) FROM hg38_snp_coords") { result ->
                result.next()
                result.getInt(1) shouldBe 1009499
            }

        }

        "studies and cell type enrichment should import for hg19" {
            val importers = mutableListOf<Importer>()

            val studyFile = File(AppTest::class.java.getResource("GWAS.v7.sorted.hg19.bed").file)
            val fdrCTEFile = File(AppTest::class.java.getResource("GWAS.v7.Matrix.hg19.FDR.txt").file)
            val pvalCTEFile = File(AppTest::class.java.getResource("GWAS.v7.Matrix.pvalue.hg19.txt").file)

            val hg19studySource = FileStudiesSource(listOf(studyFile),"hg19")
            val hg19snpStudySource = FileSnpStudiesSource(listOf(studyFile),"hg19")
            val hg19fdrSource = FileCellTypeEnrichmentsSource( listOf(fdrCTEFile), "hg19")
            val hg19pvalueSource = FileCellTypeEnrichmentsSource(listOf(pvalCTEFile), "hg19")

            val hg19studyImporter = StudyImporter(listOf(hg19studySource))
            val hg19FdrCellTypeEnrichmentImporter = CellTypeEnrichmentImporter(listOf(hg19fdrSource),"fdr", true)
            val hg19snpsStudiesImporter = SnpStudyImporter(listOf(hg19snpStudySource))
            val hg19PValueCellTypeEnrichmentImporter = CellTypeEnrichmentImporter(listOf(hg19pvalueSource),"pValue", false)

            importers += hg19studyImporter
            importers += hg19snpsStudiesImporter
            importers += hg19FdrCellTypeEnrichmentImporter
            importers += hg19PValueCellTypeEnrichmentImporter
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers=importers)
            checkQuery("SELECT COUNT(*) FROM hg19_studies") { result ->
                result.next()
                result.getInt(1) shouldBe 1470
            }
        }

        "studies and cell type enrichment should import for hg38" {
            val importers = mutableListOf<Importer>()

            val studyFile = File(AppTest::class.java.getResource("GWAS.v7.sorted.bed").file)
            val fdrCTEFile = File(AppTest::class.java.getResource("GWAS.v7.Matrix.FDR.txt").file)
            val pvalCTEFile = File(AppTest::class.java.getResource("GWAS.v7.Matrix.pvalue.txt").file)

            val hg38studySource = FileStudiesSource(listOf(studyFile),"hg38")
            val hg38snpStudySource = FileSnpStudiesSource(listOf(studyFile),"hg38")
            val hg38fdrSource = FileCellTypeEnrichmentsSource( listOf(fdrCTEFile), "hg38")
            val hg38pvalueSource = FileCellTypeEnrichmentsSource(listOf(pvalCTEFile), "hg38")

            val hg38studyImporter = StudyImporter(listOf(hg38studySource))
            val hg38FdrCellTypeEnrichmentImporter = CellTypeEnrichmentImporter(listOf(hg38fdrSource),"fdr", true)
            val hg38snpsStudiesImporter = SnpStudyImporter(listOf(hg38snpStudySource))
            val hg38PValueCellTypeEnrichmentImporter = CellTypeEnrichmentImporter(listOf(hg38pvalueSource),"pValue", false)

            importers += hg38studyImporter
            importers += hg38snpsStudiesImporter
            importers += hg38FdrCellTypeEnrichmentImporter
            importers += hg38PValueCellTypeEnrichmentImporter
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers=importers)
            checkQuery("SELECT COUNT(*) FROM hg38_studies") { result ->
                result.next()
                result.getInt(1) shouldBe 1923
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
