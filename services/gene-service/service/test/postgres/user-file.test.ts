import { insertUserGeneQuantFile, updateUserGeneQuantFile, deleteUserGeneQuantFile, insertUserTranscriptQuantFile, updateUserTranscriptQuantFile, deleteUserTranscriptQuantFile } from "../../src/postgres/user-files/select";
import { insertUserCollection } from "../../src/postgres/user-collection/select";
import { insertUserDataset } from "../../src/postgres/user-dataset/select";
import { QuantificationDataSourceType } from "../../src/postgres/types";
import { selectGeneQuantFiles, selectTranscriptQuantFiles } from "../../src/postgres";
import { removeNullFields } from "../testUtils";

describe("user dataset queries", () => {
    test("Should insert, update, and delete a user gene quantification file", async () => {
        const ucAccession = await insertUserCollection({
            owner_uid: "test-user", name: "test-collection", is_public: true
        });
        const dsAccession = await insertUserDataset({
            user_collection_accession: ucAccession, biosample: "test-biosample"
        });
        
        const userFileArgs = {
            dataset_accession: dsAccession,
            assembly: "GRCh38",
            biorep: 1
        };
        const accession = await insertUserGeneQuantFile(userFileArgs);
        expect(accession.length).toBeGreaterThan(0);

        const source = { type: QuantificationDataSourceType.USER, user_collection: ucAccession };
        const dataset = (await selectGeneQuantFiles({ source, accession: [accession] }))[0];
        expect(removeNullFields(dataset)).toEqual({ ...userFileArgs, source, accession });

        const updated = await updateUserGeneQuantFile({
            accession, biorep: 2, techrep: 2
        });
        expect(removeNullFields(updated)).toEqual({ 
            accession,
            dataset_accession: dsAccession,
            assembly: "GRCh38",
            biorep: 2,
            techrep: 2
        });

        await deleteUserGeneQuantFile(accession);
        const deleted = (await selectGeneQuantFiles({ source, accession: [accession] }))[0];
        expect(deleted).toBeUndefined();
    });
/*
    test("Should insert, update, and delete a user transcript quantification file", async () => {
        const ucAccession = await insertUserCollection({
            owner_uid: "test-user", name: "test-collection", is_public: true
        });
        const dsAccession = await insertUserDataset({
            user_collection_accession: ucAccession, biosample: "test-biosample"
        });
        
        const userFileArgs = {
            dataset_accession: dsAccession,
            assembly: "GRCh38",
            biorep: 1
        };
        const accession = await insertUserTranscriptQuantFile(userFileArgs);
        expect(accession.length).toBeGreaterThan(0);

        const source = { type: QuantificationDataSourceType.USER, user_collection: ucAccession };
        const dataset = (await selectTranscriptQuantFiles({ source, accession: [accession] }))[0];
        expect(removeNullFields(dataset)).toEqual({ ...userFileArgs, source, accession });

        const updated = await updateUserTranscriptQuantFile({
            accession, biorep: 2, techrep: 2
        });
        expect(removeNullFields(updated)).toEqual({ 
            accession,
            dataset_accession: dsAccession,
            assembly: "GRCh38",
            biorep: 2,
            techrep: 2
        });

        await deleteUserTranscriptQuantFile(accession);
        const deleted = (await selectTranscriptQuantFiles({ source, accession: [accession] }))[0];
        expect(deleted).toBeUndefined();
    });*/
});