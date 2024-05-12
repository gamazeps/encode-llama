import import.*
import io.kotlintest.*
import io.kotlintest.specs.StringSpec
import model.PsychEncodeDataset
import mu.KotlinLogging
import okhttp3.mockwebserver.*
import okio.*
import source.*
import java.io.File
import java.sql.*

private val log = KotlinLogging.logger {}

const val BASE_DB_URL = "jdbc:postgresql://localhost:5555/postgres"
const val TEST_SCHEMA = "genes_test"
const val DB_URL = "$BASE_DB_URL?currentSchema=$TEST_SCHEMA"
const val DB_USERNAME = "postgres"

class AppTest : StringSpec() {

    override fun afterTest(description: Description, result: TestResult) {
        executeAdminUpdates("DROP SCHEMA $TEST_SCHEMA CASCADE")
    }

    init {
        "Single cell box plot import from local file" {
            val testFile = File(AppTest::class.java.getResource("Urban-DLPFC-snRNAseq_processed_display.txt").file)

            val importers: List<Importer> = listOf(
                SingleCellDiseaseBoxPlotImporter(listOf(SingleCellDiseaseBoxPlotFileSource(listOf(testFile))))
            )
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers = importers)
            checkQuery("SELECT COUNT(*) FROM singlecelldiseaseboxplot ") { result ->
                result.next()
                result.getInt(1) shouldBe 99
            }
            
        }
        "Genes Associations import from local file" {
            val testFile = File(AppTest::class.java.getResource("Autism.tsv").file)

            val importers: List<Importer> = listOf(
                GeneAssociationImporter(listOf(GeneAssociationFileSource(listOf(testFile))))
            )
            runImporters(DB_URL, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers = importers)
            checkQuery("SELECT COUNT(*) FROM gene_associations ") { result ->
                result.next()
                result.getInt(1) shouldBe 25
            }
        }
        "gene files should import" {
            val testGeneFile = File(AppTest::class.java.getResource("grch38.subset.gff3.gz").file)
            val fileFeatureSource = Gff3FileFeatureSource(mapOf("GRCh38" to listOf(testGeneFile)))
            val featureImporter = FeatureImporter(listOf(fileFeatureSource))
            runImporters(
                DB_URL,
                DB_USERNAME,
                dbSchema = TEST_SCHEMA,
                replaceSchema = true,
                importers = listOf(featureImporter)
            )

            checkQuery("SELECT COUNT(*) FROM utr_grch38 WHERE direction = 5") { result ->
                result.next()
                result.getInt(1) shouldBe 40
            }
            checkQuery("SELECT * FROM utr_grch38 WHERE direction = 5 LIMIT 1") { result ->
                result.next()
                result.getString("chromosome") shouldBe "chr1"
                result.getInt("start") shouldBe 65419
                result.getInt("stop") shouldBe 65433
                result.getString("id") shouldBe "UTR5:ENST00000641515.2"
                result.getString("strand") shouldBe "+"
                result.getFloat("score") shouldBe 0.0
                result.getInt("phase") shouldBe -1
                result.getString("parent_exon") shouldBe "ENSE00003812156.1"
                result.getString("parent_protein") shouldBe "ENSP00000493376.2"
                result.getString("tag") shouldBe "RNA_Seq_supported_partial,basic"
            }

            checkQuery("SELECT COUNT(*) FROM utr_grch38 WHERE direction = 3") { result ->
                result.next()
                result.getInt(1) shouldBe 26
            }
            checkQuery("SELECT * FROM utr_grch38 WHERE direction = 3 LIMIT 1") { result ->
                result.next()
                result.getString("chromosome") shouldBe "chr1"
                result.getInt("start") shouldBe 70009
                result.getInt("stop") shouldBe 71585
                result.getString("id") shouldBe "UTR3:ENST00000641515.2"
                result.getString("strand") shouldBe "+"
                result.getFloat("score") shouldBe 0.0
                result.getInt("phase") shouldBe -1
                result.getString("parent_exon") shouldBe "ENSE00003813949.1"
                result.getString("parent_protein") shouldBe "ENSP00000493376.2"
                result.getString("tag") shouldBe "RNA_Seq_supported_partial,basic"
            }

            checkQuery("SELECT COUNT(*) FROM cds_grch38") { result ->
                result.next()
                result.getInt(1) shouldBe 127
            }
            checkQuery("SELECT * FROM cds_grch38 LIMIT 1") { result ->
                result.next()
                result.getString("chromosome") shouldBe "chr1"
                result.getInt("start") shouldBe 65565
                result.getInt("stop") shouldBe 65573
                result.getString("id") shouldBe "CDS:ENST00000641515.2"
                result.getString("strand") shouldBe "+"
                result.getFloat("score") shouldBe 0.0
                result.getInt("phase") shouldBe 0
                result.getString("parent_exon") shouldBe "ENSE00003813641.1"
                result.getString("parent_protein") shouldBe "ENSP00000493376.2"
                result.getString("tag") shouldBe "RNA_Seq_supported_partial,basic"
            }

            checkQuery("SELECT COUNT(*) FROM exon_grch38") { result ->
                result.next()
                result.getInt(1) shouldBe 271
            }
            checkQuery("SELECT * FROM exon_grch38 LIMIT 1") { result ->
                result.next()
                result.getString("chromosome") shouldBe "chr1"
                result.getInt("start") shouldBe 11869
                result.getInt("stop") shouldBe 12227
                result.getString("id") shouldBe "exon:ENST00000456328.2:1"
                result.getString("name") shouldBe "ENSE00002234944.1"
                result.getString("strand") shouldBe "+"
                result.getFloat("score") shouldBe 0.0
                result.getInt("phase") shouldBe -1
                result.getInt("exon_number") shouldBe 1
                result.getString("parent_transcript") shouldBe "ENST00000456328.2"
            }

            checkQuery("SELECT COUNT(*) FROM transcript_grch38") { result ->
                result.next()
                result.getInt(1) shouldBe 50
            }
            checkQuery("SELECT * FROM transcript_grch38 LIMIT 1") { result ->
                result.next()
                result.getString("chromosome") shouldBe "chr1"
                result.getInt("start") shouldBe 11869
                result.getInt("stop") shouldBe 14409
                result.getString("id") shouldBe "ENST00000456328.2"
                result.getString("name") shouldBe "DDX11L1-202"
                result.getString("strand") shouldBe "+"
                result.getFloat("score") shouldBe 0.0
                result.getInt("phase") shouldBe -1
                result.getString("transcript_type") shouldBe "processed_transcript"
                result.getString("havana_id") shouldBe "OTTHUMT00000362751.1"
                result.getString("tag") shouldBe "basic"
                result.getInt("support_level") shouldBe 1
                result.getString("parent_gene") shouldBe "ENSG00000223972.5"
            }

            checkQuery("SELECT COUNT(*) FROM gene_grch38") { result ->
                result.next()
                result.getInt(1) shouldBe 13
            }
            checkQuery("SELECT * FROM gene_grch38 LIMIT 1") { result ->
                result.next()
                result.getString("chromosome") shouldBe "chr1"
                result.getInt("start") shouldBe 11869
                result.getInt("stop") shouldBe 14409
                result.getString("id") shouldBe "ENSG00000223972.5"
                result.getString("name") shouldBe "DDX11L1"
                result.getString("strand") shouldBe "+"
                result.getFloat("score") shouldBe 0.0
                result.getInt("phase") shouldBe -1
                result.getString("gene_type") shouldBe "transcribed_unprocessed_pseudogene"
                result.getString("havana_id") shouldBe "OTTHUMG00000000961.2"
            }

        }

        "encode metadata should import" {
            val server = MockWebServer()
            server.start()
            val baseUrl = server.url("").toString()
            server.queueTextFromResource("test-encode-search-result.json")
            server.queueTextFromResource("test-encode-metadata-1.json")

            val metadataSource = EncodeMetadataHttpSource(listOf("hg19", "GRCh38", "mm10"), 150, baseUrl)
            val metadataImporter = MetadataImporter(listOf(metadataSource))
            runImporters(
                DB_URL,
                DB_USERNAME,
                dbSchema = TEST_SCHEMA,
                replaceSchema = true,
                importers = listOf(metadataImporter)
            )
            checkQuery("SELECT COUNT(*) FROM encode_datasets") { result ->
                result.next()
                result.getInt(1) shouldBe 1
            }
            checkQuery("SELECT * FROM encode_datasets LIMIT 1") { result ->
                result.next()
                result.getString("accession") shouldBe "ENCSR969JYY"
                result.getString("biosample") shouldBe "germinal matrix"
                result.getString("tissue") shouldBe null
                result.getString("cell_compartment") shouldBe null
                result.getString("lab_name") shouldBe "joseph-costello"
                result.getString("lab_friendly_name") shouldBe "Joseph Costello"
                result.getString("assay_term_name") shouldBe "polyA plus RNA-seq"
                result.getString("biosample_type") shouldBe "tissue"
            }
            checkQuery("SELECT count(*) FROM encode_gene_quantification_files WHERE dataset_accession = 'ENCSR969JYY'") { result ->
                result.next()
                result.getInt(1) shouldBe 2
            }
            checkQuery("SELECT count(*) FROM encode_signal_files WHERE dataset_accession = 'ENCSR969JYY'") { result ->
                result.next()
                result.getInt(1) shouldBe 8
            }
            checkQuery("SELECT * FROM encode_signal_files WHERE accession = 'ENCFF065ESF'") { result ->
                result.next()
                result.getString("accession") shouldBe "ENCFF065ESF"
                result.getString("dataset_accession") shouldBe "ENCSR969JYY"
                result.getString("assembly") shouldBe "GRCh38"
                result.getInt("biorep") shouldBe 1
                result.getInt("techrep") shouldBe 1
                result.getString("strand") shouldBe "-"
                result.getBoolean("unique_reads") shouldBe true
            }
        }

        "quantification files should import" {
            val testGeneQuantFile = File(AppTest::class.java.getResource("gene-quant-subset.tsv").file)
            val localGeneQuantFile =
                LocalQuantificationFile("test-experiment-accession", "test-file-accession", testGeneQuantFile)
            val testTranscriptQuantFile = File(AppTest::class.java.getResource("transcript-quant-subset.tsv").file)
            val localTranscriptQuantFile =
                LocalQuantificationFile("test-experiment-accession", "test-file-accession", testTranscriptQuantFile)
            val fileQuantSource = FileQuantificationSource(
                mapOf("GRCh38" to listOf(localGeneQuantFile)),
                mapOf("GRCh38" to listOf(localTranscriptQuantFile)), 1
            )
            val featureImporter = QuantificationImporter(listOf(fileQuantSource), 1)
            runImporters(
                DB_URL,
                DB_USERNAME,
                dbSchema = TEST_SCHEMA,
                replaceSchema = true,
                importers = listOf(featureImporter)
            )

            checkQuery("SELECT * FROM gene_quantification_grch38 WHERE gene_id = 'ENSG00000000003.14'") { result ->
                result.next()
                result.getString("gene_id") shouldBe "ENSG00000000003.14"
                result.getArray("transcript_ids").array shouldBe arrayOf(
                    "ENST00000373020.8", "ENST00000494424.1",
                    "ENST00000496771.5", "ENST00000612152.4", "ENST00000614008.4"
                )
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
            checkQuery("SELECT * FROM transcript_quantification_grch38 WHERE transcript_id = 'ENST00000373020.8'") { result ->
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

        "psych-encode quantification files should import" {
            val testGeneQuantFile = File(AppTest::class.java.getResource("psychencode-gene-quant-sample.tsv").file)
            val localGeneQuantFile =
                LocalQuantificationFile("test-experiment-accession", "test-file-accession", testGeneQuantFile)
            val testTranscriptQuantFile =
                File(AppTest::class.java.getResource("psychencode-transcript-quant-sample.tsv").file)
            val localTranscriptQuantFile =
                LocalQuantificationFile("test-experiment-accession", "test-file-accession", testTranscriptQuantFile)
            val fileQuantSource = FileQuantificationSource(
                mapOf("GRCh38" to listOf(localGeneQuantFile)),
                mapOf("GRCh38" to listOf(localTranscriptQuantFile)), 1
            )
            val featureImporter = QuantificationImporter(listOf(fileQuantSource), 1)
            runImporters(
                DB_URL,
                DB_USERNAME,
                dbSchema = TEST_SCHEMA,
                replaceSchema = true,
                importers = listOf(featureImporter)
            )

            checkQuery("SELECT * FROM gene_quantification_grch38 WHERE gene_id = 'ENSG00000000003.10'") { result ->
                result.next()
                result.getString("gene_id") shouldBe "ENSG00000000003.10"
                result.getArray("transcript_ids").array shouldBe arrayOf(
                    "ENST00000373020.4",
                    "ENST00000494424.1",
                    "ENST00000496771.1"
                )
                result.getFloat("len") shouldBe 2147.60f
                result.getFloat("effective_len") shouldBe 1864.72f
                result.getFloat("expected_count") shouldBe 112.00f
                result.getFloat("tpm") shouldBe 0.95f
                result.getFloat("fpkm") shouldBe 4.64f
                result.getFloat("posterior_mean_count") shouldBe 112.00f
                result.getFloat("posterior_standard_deviation_of_count") shouldBe 0.0f
                result.getFloat("pme_tpm") shouldBe 1.00f
                result.getFloat("pme_fpkm") shouldBe 4.92f
                result.getFloat("tpm_ci_lower_bound") shouldBe 0.799872f
                result.getFloat("tpm_ci_upper_bound") shouldBe 1.20246f
                result.getFloat("tpm_coefficient_of_quartile_variation") shouldBe 0.0682689f
                result.getFloat("fpkm_ci_lower_bound") shouldBe 3.92806f
                result.getFloat("fpkm_ci_upper_bound") shouldBe 5.90462f
                result.getFloat("fpkm_coefficient_of_quartile_variation") shouldBe 0.0682716f
            }
        }

        "psychencode clinical metadata should import" {
            val testFile = File(AppTest::class.java.getResource("psychencode-clinical-metadata-sample.tsv").file)
            val metadataSource = PsychEncodeMetadataFileSource(testFile)
            val metadataImporter = PsychEncodeMetadataImporter(listOf(metadataSource))
            runImporters(
                DB_URL,
                DB_USERNAME,
                dbSchema = TEST_SCHEMA,
                replaceSchema = true,
                importers = listOf(metadataImporter)
            )

            checkQuery("SELECT * FROM psychencode_datasets WHERE accession = 'HSB132_STCrnaSeq'") { result ->
                result.next()
                result.getString("individualID") shouldBe "HSB132"
                result.getString("specimenID") shouldBe "HSB132_STC"
                result.getString("species") shouldBe ""
                result.getString("study") shouldBe "BrainSpan"
                result.getString("Contributor") shouldBe "PI"
                result.getString("grantId") shouldBe ""
                result.getString("assay") shouldBe "polyA plus RNA-seq"
                result.getString("assayTarget") shouldBe ""
                result.getString("diagnosis") shouldBe "Control"
                result.getString("organ") shouldBe ""
                result.getString("tissue") shouldBe ""
                result.getString("BrodmannArea") shouldBe ""
                result.getString("tissueAbbr") shouldBe "STC"
                result.getString("cellType") shouldBe ""
                result.getString("hemisphere") shouldBe "left"
                result.getInt("PMI") shouldBe 22
                result.getFloat("pH") shouldBe 6.6f
                result.getString("libraryPrep") shouldBe "polyAselection"
                result.getFloat("RIN") shouldBe 8.2f
                result.getString("platform") shouldBe "GAIIx"
                result.getInt("readLength") shouldBe 76
                result.getString("runType") shouldBe "singleEnd"
                result.getString("createdBy") shouldBe "3329582"
                result.getString("accession") shouldBe "HSB132_STCrnaSeq"
                result.getString("biosample") shouldBe "HSB132_STCleft"
                result.getString("lab_name") shouldBe "PI"
                result.getString("lab_friendly_name") shouldBe "PI"
                result.getString("assay_term_name") shouldBe "polyA plus RNA-seq"
                result.getString("biosample_type") shouldBe "tissue"
            }

            checkQuery("SELECT * FROM psychencode_gene_quantification_files WHERE accession = 'syn8254669'") { result ->
                result.next()
                result.getInt("row_id") shouldBe 8254669
                result.getInt("row_version") shouldBe 1
                result.getString("row_etag") shouldBe "eb765346-6432-470a-a14b-ef197a96a730"
                result.getString("accession") shouldBe "syn8254669"
                result.getString("name") shouldBe "HSB132_STC.RSEM_Quant.genes.results"
                result.getString("fileFormat") shouldBe "tsv"
                result.getBoolean("isStranded") shouldBe false
                result.getBoolean("iPSC_intergrative_analysis") shouldBe true
                result.getInt("currentVersion") shouldBe 1
                result.getInt("dataFileHandleId") shouldBe 0
                result.getString("dataset_accession") shouldBe "HSB132_STCrnaSeq"
                result.getString("assembly") shouldBe "hg19"
                result.getInt("biorep") shouldBe 1
                result.getInt("techrep") shouldBe 1
            }

            checkQuery("SELECT * FROM psychencode_transcript_quantification_files WHERE accession = 'syn8254668'") { result ->
                result.next()
                result.getInt("row_id") shouldBe 8254668
                result.getInt("row_version") shouldBe 1
                result.getString("row_etag") shouldBe "fd840ad5-ac6e-4519-bd91-b5f882b3ef0e"
                result.getString("accession") shouldBe "syn8254668"
                result.getString("name") shouldBe "HSB132_STC.RSEM_Quant.isoforms.results"
                result.getString("fileFormat") shouldBe "tsv"
                result.getBoolean("isStranded") shouldBe false
                result.getBoolean("iPSC_intergrative_analysis") shouldBe false
                result.getInt("currentVersion") shouldBe 1
                result.getInt("dataFileHandleId") shouldBe 0
                result.getString("dataset_accession") shouldBe "HSB132_STCrnaSeq"
                result.getString("assembly") shouldBe "hg19"
                result.getInt("biorep") shouldBe 1
                result.getInt("techrep") shouldBe 1
            }

            checkQuery("SELECT * FROM psychencode_transcriptome_alignments_files WHERE accession = 'syn8267657'") { result ->
                result.next()
                result.getInt("row_id") shouldBe 8267657
                result.getInt("row_version") shouldBe 1
                result.getString("row_etag") shouldBe "5d2b7c9e-e716-4a6f-8cf6-c9570df60824"
                result.getString("accession") shouldBe "syn8267657"
                result.getString("name") shouldBe "HSB132_STC.Aligned.toTranscriptome.out.bam"
                result.getString("fileFormat") shouldBe "bam"
                result.getBoolean("isStranded") shouldBe false
                result.getBoolean("iPSC_intergrative_analysis") shouldBe false
                result.getInt("currentVersion") shouldBe 1
                result.getInt("dataFileHandleId") shouldBe 0
                result.getString("dataset_accession") shouldBe "HSB132_STCrnaSeq"
            }

            checkQuery("SELECT * FROM psychencode_sortedByCoord_alignments_files WHERE accession = 'syn8267656'") { result ->
                result.next()
                result.getInt("row_id") shouldBe 8267656
                result.getInt("row_version") shouldBe 1
                result.getString("row_etag") shouldBe "ab7e6933-13ed-4d3a-a208-b8a420a2aaea"
                result.getString("accession") shouldBe "syn8267656"
                result.getString("name") shouldBe "HSB132_STC.Aligned.sortedByCoord.out.bam"
                result.getString("fileFormat") shouldBe "bam"
                result.getBoolean("isStranded") shouldBe false
                result.getBoolean("iPSC_intergrative_analysis") shouldBe false
                result.getInt("currentVersion") shouldBe 1
                result.getInt("dataFileHandleId") shouldBe 0
                result.getString("dataset_accession") shouldBe "HSB132_STCrnaSeq"
            }

            checkQuery("SELECT * FROM psychencode_signal_files WHERE accession = 'syn8298825'") { result ->
                result.next()
                result.getInt("row_id") shouldBe 8298825
                result.getInt("row_version") shouldBe 1
                result.getString("row_etag") shouldBe "1f381c8c-8760-470f-bb21-71b823f0a6c8"
                result.getString("accession") shouldBe "syn8298825"
                result.getString("name") shouldBe "2014-2621.Signal.Unique.strand-.bw"
                result.getString("fileFormat") shouldBe "bigwig"
                result.getBoolean("isStranded") shouldBe true
                result.getBoolean("iPSC_intergrative_analysis") shouldBe false
                result.getInt("currentVersion") shouldBe 1
                result.getInt("dataFileHandleId") shouldBe 0
                result.getString("dataset_accession") shouldBe "2014-2621rnaSeq"
                result.getString("strand") shouldBe "-"
                result.getString("assembly") shouldBe "hg19"
                result.getInt("biorep") shouldBe 1
                result.getInt("techrep") shouldBe 1
                result.getBoolean("unique_reads") shouldBe true
            }

        }

        "psychencode dataset metadata should import" {
            val testFile = File(AppTest::class.java.getResource("psychencode-dataset-metadata-sample.tsv").file)
            val metadataSource = PsychEncodeDatasetMetadataFileSource(testFile)
            val metadataImporter = PsychEncodeDatasetMetadataImporter(listOf(metadataSource))
            runImporters(
                DB_URL,
                DB_USERNAME,
                dbSchema = TEST_SCHEMA,
                replaceSchema = true,
                importers = listOf(metadataImporter)
            )

            checkQuery("SELECT * FROM psychencode_datasets_metadata WHERE row_id = '40'") { result ->
                result.next()
                result.getString("row_id") shouldBe "40"
                result.getString("row_version") shouldBe "19"
                result.getString("study") shouldBe "CMC"
                result.getString("individualID") shouldBe "CMC_MSSM_002"
                result.getString("individualIDSource") shouldBe "MSSM"
                result.getString("diagnosis") shouldBe "Bipolar Disorder"
                result.getString("sex") shouldBe "M"
                result.getString("ethnicity") shouldBe "CAUC"
                result.getFloat("age_death") shouldBe 42f
                result.getBoolean("fetal") shouldBe false
                result.getString("ageOnset") shouldBe null
                result.getString("yearAutopsy") shouldBe "2004"
                result.getString("causeDeath") shouldBe "Cardiovascular"
                result.getString("brainWeight") shouldBe "1398"
                result.getString("height") shouldBe "68"
                result.getString("weight") shouldBe "225"
                result.getString("ageBiopsy") shouldBe null
                result.getString("smellTestScore") shouldBe null
                result.getBoolean("smoker") shouldBe false
                result.getString("notes") shouldBe null
                result.getBoolean("Capstone_4") shouldBe true
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
            for (sql in sqlUpdates) stmt.executeUpdate(sql)
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
