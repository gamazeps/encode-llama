package import

import Importer
import util.*
import mu.KotlinLogging
import java.io.Closeable
import javax.sql.DataSource

private val log = KotlinLogging.logger {}

class PsychEncodeDatasetMetadataImporter(private val sources: List<PsychEncodeDatasetMetadataSource>) : Importer {

    override fun import(dataSource: DataSource) {
        log.info { "Running metadata schema..." }
        executeSqlResource(dataSource, "schemas/psychencodedatasetmetadata.sql")
        PsychEncodeDatasetMetadataSink(dataSource).use {sink ->
            for (source in sources) {
                source.import(sink)
            }
        }
        log.info { "Metadata import complete!" }
    }
}

interface PsychEncodeDatasetMetadataSource {
    fun import(sink: PsychEncodeDatasetMetadataSink)
}

private const val DATASETS_TABLE_DEF = """
    psychencode_datasets_metadata(
        ROW_ID, ROW_VERSION, study, individualID, individualIDSource, diagnosis, sex, ethnicity, age_death,
        fetal, ageOnset, yearAutopsy, causeDeath, brainWeight, height, weight, ageBiopsy, smellTestScore,
        smoker, notes, Capstone_4
    )
"""

class PsychEncodeDatasetMetadataSink(dataSource: DataSource): Closeable {

    private val datasetsOut = CopyValueWriter(dataSource, DATASETS_TABLE_DEF)

    fun writeDatasets(ROW_ID: Int?, ROW_VERSION: Int?, study: String?, individualID: String?,
                      individualIDSource: String?, diagnosis: String?, sex: String?, ethnicity: String?,
                      ageDeath: Float?, fetal: Boolean?, ageOnset: String?, yearAutopsy: String?,
                      causeDeath:String?, brainWeight: String?, height: String?, weight: String?, ageBiopsy: String?,
                      smellTestScore: String?, smoker: String?, notes: String?, Capstone_4: Boolean?) {
        datasetsOut.write(ROW_ID?.toString(), ROW_VERSION?.toString(), study, individualID, individualIDSource,
                          diagnosis, sex, ethnicity, ageDeath?.toString(), fetal?.toString(), ageOnset,
                          yearAutopsy, causeDeath, brainWeight, height, weight, ageBiopsy, smellTestScore, smoker,
                          notes, Capstone_4?.toString())
    }

    override fun close()  {
        datasetsOut.close()
    }

}