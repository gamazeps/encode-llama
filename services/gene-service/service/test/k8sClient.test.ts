import yargs from "yargs";
import { K8sClient } from "../src/util/k8sClient";
import { gcsClient, GcsClient } from "../src/util/gcsClient";
import { createReadStream } from "fs";
import { Storage } from '@google-cloud/storage';
import { wait } from "./testUtils";
import { UserCollectionImportStatus } from "../src/postgres/types";

const testBucket = "genes-import-test-e2e";
const jobName = "gene-import-test";

/*
 * Tests running a real import on google cloud kubernetes.
 * This is an end to end test that should not be run automatically. 
 * As such, it will do nothing unless run explicitly.
 * To run: scripts/test.sh -t k8sClient
 */
describe("k8sClient", () => {
    test("should startImportJob", async () => {
        if(yargs.argv["t"] !== "k8sClient") return;

        // Uploads can take longer than the default Jest async limit of 5 seconds. 
        jest.setTimeout(240_000);

        // TODO - add files to google bucket
        const storage = new Storage();
        const storageBucket = storage.bucket(testBucket);
        const bucketExists = (await storageBucket.exists())[0];
        console.log("bucket exists: " + bucketExists);
        if (bucketExists === false) {
            storageBucket.create();
        }
        
        const gcsClient = new GcsClient(testBucket);
        // Names look like user-collection-name/dataset-accession/gene-quantification/assembly/file-accession.tsv
        gcsClient.writeFile("uctest1/dstest1/gene-quantification/hg19/gqtest1.tsv", "text/tab-separated-values", 
            createReadStream("test-resources/gene-quant-subset.tsv"));
        gcsClient.writeFile("uctest1/dstest1/transcript-quantification/hg19/tqtest1.tsv", "text/tab-separated-values", 
            createReadStream("test-resources/transcript-quant-subset.tsv"));

        // Run real k8sClient.startImportJob against sample data in test bucket.
        const k8sClient = new K8sClient(testBucket);
        await k8sClient.startImportJob("uctest1", jobName, "user_collection_import_test");

        console.log("Import job started. Status will be checked momentarilly.");

        await wait(10000);
        
        const status = await k8sClient.checkStatus(jobName);
        expect(status).toEqual(UserCollectionImportStatus.SUCCESS);

        console.log(
            "Import Job and Status check complete. " +
            "Please check the staging k8s environment and gene db. " +
            "Please remove the new schema and bucket when finished."
        );
    });
});
