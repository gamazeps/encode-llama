import { K8sClient } from "./k8sClient";
import { selectIncompleteImportCollections, updateUserCollection } from "../postgres/user-collection/select";
import { UserCollectionImportStatus } from "../postgres/types";
import { UpdateUserCollectionArgs } from "../postgres/user-collection/types";
import { db } from "../postgres";
import { dropSchema } from "../postgres/schema";


const generateImportSchemaName = (ucAccession: string) => `user_${ucAccession}_${(new Date().getTime())}`;
const importJobName = (ucAccession: string) => `gene-import-${ucAccession.toLowerCase()}`;

export async function poll(k8sClient: K8sClient, importLimit: number) {
    const incompleteCollections = await selectIncompleteImportCollections();
    
    // First check the status of any existing in_progress jobs and update if necessary
    const colsInProgress = incompleteCollections.filter(uc => uc.import_status === "IN_PROGRESS");
    let openSlots = importLimit;
    for (let collection of colsInProgress) {
        const status = await k8sClient.checkStatus(importJobName(collection.accession));
        if (status === UserCollectionImportStatus.IN_PROGRESS) {
            openSlots--;
            continue;
        }

        let updateArgs: UpdateUserCollectionArgs = { 
            accession: collection.accession, 
            import_status: status 
        };
        
        await db.tx(async t => {
            // If it was successful, also update the current schema to be the one that was "in_progress"
            // and set the in_progress schema to null. This will cause any future queries against importer 
            // user data to be against the new schema.
            if (status === UserCollectionImportStatus.SUCCESS) {
                updateArgs.quant_data_schema = collection.quant_data_schema_in_progress;
                updateArgs.quant_data_schema_in_progress = null;
            } else if (status === UserCollectionImportStatus.ERROR) {
                updateArgs.quant_data_schema_in_progress = null;
            }
            await updateUserCollection(updateArgs, t);
            // We also need to delete the old schema if we removed references to it.
            if (status === UserCollectionImportStatus.SUCCESS && collection.quant_data_schema) {
                await dropSchema(collection.quant_data_schema, t);
            }
        });
    }

    // Then start any jobs marked as QUEUED
    const queued = incompleteCollections
        .filter(uc => uc.import_status === "QUEUED")
        .sort((a, b) => (a.queued_time! > b.queued_time!) ? 1 : -1);
    for (let collection of queued) {
        if (openSlots <= 0) break;
        openSlots--;
        const jobName = importJobName(collection.accession);
        const newSchema = generateImportSchemaName(collection.accession);
        await k8sClient.startImportJob(collection.accession, jobName, newSchema);
        updateUserCollection({
            accession: collection.accession,
            import_status: UserCollectionImportStatus.IN_PROGRESS,
            quant_data_schema_in_progress: newSchema.toLowerCase(),
            queued_time: null
        })
    }
}