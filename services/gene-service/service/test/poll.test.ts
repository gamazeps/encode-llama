import { K8sClient } from "../src/util/k8sClient";
import { createCollectionAndDataset } from "./graphql/common";
import { updateUserCollection, selectUserCollection } from "../src/postgres/user-collection/select";
import { UserCollectionImportStatus } from "../src/postgres/types";
import { poll } from "../src/util/poll";


const mockK8sClient = {} as K8sClient;
mockK8sClient.startImportJob = jest.fn();
mockK8sClient.checkStatus = jest.fn();

describe("poll", () => {
    test("should update job statuses and start new imports", async () => {
        jest.setTimeout(240_000);
        const { ucAccession, fileAccession } = await createCollectionAndDataset();
        await updateUserCollection({ 
            accession: ucAccession, 
            import_status: UserCollectionImportStatus.QUEUED
        });

        await poll(mockK8sClient, 2);
        expect(mockK8sClient.startImportJob).toHaveBeenCalled();

        let userCollection = await selectUserCollection(ucAccession);
        expect(userCollection?.import_status).toEqual(UserCollectionImportStatus.IN_PROGRESS);

        // Run poll again and mock status check to success
        // Check that db status was updated to success
        (mockK8sClient.checkStatus as jest.Mock).mockReturnValueOnce(UserCollectionImportStatus.SUCCESS);
        await poll(mockK8sClient, 2);
        userCollection = await selectUserCollection(ucAccession);
        expect(userCollection?.import_status).toEqual(UserCollectionImportStatus.SUCCESS);
    });
})