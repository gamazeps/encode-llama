import { 
    insertUserDataset, updateUserDataset, deleteUserDataset
} from "../../src/postgres/user-dataset/select";
import { insertUserCollection } from "../../src/postgres/user-collection/select";
import { QuantificationDataSourceType } from "../../src/postgres/types";
import { removeNullFields } from "../testUtils";
import { selectDatasets } from "../../src/postgres/datasets/select";


describe("user dataset queries", () => {
    test("Should insert, update, and delete a user dataset", async () => {
        const ucAccession = await insertUserCollection({
            owner_uid: "test-user", name: "test-collection", is_public: true
        });
        const datasetArgs = {
            user_collection_accession: ucAccession,
            biosample: "test-biosample",
            biosample_type: "test-biosample-type",
            tissue: "test-tissue",
            cell_compartment: "test-cell-compartment",
            lab_name: "test-lab-name"
        };
        const accession = await insertUserDataset(datasetArgs);
        expect(accession.length).toBeGreaterThan(0);

        const source = { type: QuantificationDataSourceType.USER, user_collection: ucAccession };
        const dataset = (await selectDatasets({ source, accession: [accession] }))[0];
        expect(removeNullFields(dataset)).toEqual({ ...datasetArgs, source, accession });

        const updated = await updateUserDataset({
            accession, 
            biosample: "test-biosample-2",
            tissue: "test-tissue-2",
            assay_term_name: "test-assay-term-name"
        });
        expect(removeNullFields(updated)).toEqual({ 
            source,
            accession,
            biosample: "test-biosample-2",
            biosample_type: "test-biosample-type",
            tissue: "test-tissue-2",
            cell_compartment: "test-cell-compartment",
            lab_name: "test-lab-name",
            assay_term_name: "test-assay-term-name"
        });

        await deleteUserDataset(accession);
        const deleted = (await selectDatasets({ source, accession: [accession] }))[0];
        expect(deleted).toBeUndefined();
    });
});