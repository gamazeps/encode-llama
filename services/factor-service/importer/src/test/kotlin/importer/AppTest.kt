package importer

import import.*


import source.*
import util.*
import org.assertj.core.api.Assertions.assertThat
import java.io.File
import org.junit.jupiter.api.*
class AppTest  {

        @AfterEach
        fun dropSchema() = dropTestSchema()

        @Test
        fun `factor import from files`() {

            val hg38_testGeneFile = File(AppTest::class.java.classLoader.getResource("gencode.subset.v32.annotation.gff3.gz").file)
            val testEncodeMetadataFile = fileForResource("test-encode-metadata-2.json")
            val tfdbdFile = fileForResource("humantf_dbd_subset.csv")
            val factorSource = Gff3FileFactorSource(mapOf(
                    "GRCh38" to listOf(hg38_testGeneFile)
            ), listOf(testEncodeMetadataFile), listOf(tfdbdFile))
            val factorImporter = FactorImporter(listOf(factorSource))
            setupTestDataSource().use { ds -> factorImporter.import(ds) }
            checkQuery("SELECT * FROM factor_descriptions_grch38 LIMIT 1;") { result ->
                result.next()
                assertThat(result.getString("chromosome")).isEqualTo("chr22")
                assertThat(result.getInt("start")).isEqualTo(41092592)
                assertThat(result.getInt("stop")).isEqualTo(41180077)
                assertThat(result.getString("name")).isEqualTo("EP300")
                assertThat(result.getString("gene_id")).isEqualTo("ENSG00000100393")
                assertThat(result.getString("uniprot_data")).isNotNull()
                assertThat(result.getString("ncbi_data")).isNotNull()
                assertThat(result.getString("hgnc_data")).isNotNull()
                assertThat(result.getString("ensemble_data")).isNotNull()
                assertThat(result.getString("pdbids")).isNotNull()
                assertThat(result.getString("factor_wiki")).isNotNull()
                assertThat(result.getString("color")).isEqualTo("#523e442a")
                
            }

        }
        
        @Test
        fun `celltype import from files`() {

            val testEncodeMetadataFile = File(AppTest::class.java.classLoader.getResource("test-encode-metadata-2.json").file) //fileForResource("test-encode-metadata-2.json")
            val ctSource = FileCelltypeSource(mapOf(
                    "GRCh38" to listOf(testEncodeMetadataFile)
            ))
            val ctImporter = CellTypeDescImporter(listOf(ctSource))
            setupTestDataSource().use { ds -> ctImporter.import(ds) }
            checkQuery("SELECT * FROM celltype_descriptions_grch38 LIMIT 1;") { result ->
                result.next()
                assertThat(result.getString("celltype")).isEqualTo("stomach")
                assertThat(result.getString("wiki_desc")).isNotNull()
                assertThat(result.getString("ct_image_url")).isNotNull()
            }
            //runImporters(DB_URL_WITH_SCHEMA, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers = listOf(factorImporter))

        }
       /* 
        "ftp factor"{

            val targets = mutableMapOf<String,List<String>>()
            targets.put("GRCh38", listOf("ftp://anonymous@ftp.ebi.ac.uk/pub/databases/gencode/Gencode_human/release_32/gencode.v32.annotation.gff3.gz"))
            targets.put("mm10", listOf("ftp://anonymous@ftp.ebi.ac.uk/pub/databases/gencode/Gencode_mouse/release_M23/gencode.vM23.annotation.gff3.gz"))
            val factorSources = Gff3FtpFactorSource(targets,5)
            val factorImporter = FactorImporter(listOf(factorSources))
            runImporters(DB_URL_WITH_SCHEMA, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers = listOf(factorImporter))

        }

        "celltypes import" {
            val importers = mutableListOf<Importer>()
            val ctSource = HttpCelltypeSource(
                     setOf("GRCh38","mm10"),150
            )
            val ctImporter = CellTypeDescImporter(listOf(ctSource))
            importers+= ctImporter
            runImporters(DB_URL_WITH_SCHEMA, DB_USERNAME, dbSchema = TEST_SCHEMA, replaceSchema = true, importers = importers)


        }*/

      private fun fileForResource(resource: String) = File(AppTest::class.java.classLoader.getResource(resource).file)    
}


