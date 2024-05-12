package source

import com.google.cloud.storage.Blob
import com.google.cloud.storage.Storage
import com.google.cloud.storage.StorageOptions
import import.QuantificationSink
import import.QuantificationSource
import java.nio.channels.Channels.newInputStream
import mu.KotlinLogging

private val log = KotlinLogging.logger {}
class GSQuantificationSource(private val bucket: String, private val userCollection: String) : QuantificationSource {

    private val collectionFiles by lazy { fetchCollectionFiles() }

    private fun fetchCollectionFiles(): List<Blob> {
        val client = StorageOptions.getDefaultInstance().service
        val bucket = client[bucket]
        val blobPages = bucket.list(Storage.BlobListOption.prefix(userCollection))
        return blobPages.iterateAll().toList()
    }

    override fun assemblies(): List<String> {
        // Names look like user-collection-name/dataset-accession/gene-quantification/assembly/file-accession.tsv                
        return collectionFiles.asSequence()
                .map { it.name.split("/") }
                .filter { it[2] == "gene-quantification" || it[2] == "transcript-quantification" }
                .map { it[3] }
                .toSet().toList()
    }

    override fun import(assembly: String, sink: QuantificationSink) {
        for (collectionFile in collectionFiles) {
            val split = collectionFile.name.split("/")
            val geneQuant = split[2] == "gene-quantification"
            val datasetAccession = split[1]
            val accession = split[4].split(".")[0]
            val fileIn = newInputStream(collectionFile.reader())
            if (geneQuant) {
                importGeneQuantification(datasetAccession, accession, fileIn, sink)
            } else {
                importTranscriptQuantification(datasetAccession, accession, fileIn, sink)
            }
        }
    }

}