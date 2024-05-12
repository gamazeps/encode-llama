import { 
    insertUserCollection, selectUserCollection, 
    updateUserCollection, deleteUserCollection 
} from "../../src/postgres/user-collection/select";
import { removeNullFields } from "../testUtils";


describe("user collection queries", () => {
    test("Should insert, update, and delete a user collection", async () => {
        const accession = await insertUserCollection({
            owner_uid: "test-user", name: "test-collection", is_public: true
        });
        expect(accession.length).toBeGreaterThan(0);

        const userCollection = await selectUserCollection(accession);
        expect(removeNullFields(userCollection)).toEqual({
            accession, owner_uid: "test-user", name: "test-collection", is_public: true
        });

        const updated = await updateUserCollection({
            accession, name: "test-collection-2", is_public: false
        });
        expect(removeNullFields(updated)).toEqual({
            accession, owner_uid: "test-user", name: "test-collection-2", is_public: false
        });

        await deleteUserCollection(accession);
        const deleted = await selectUserCollection(accession);
        expect(deleted).toBeUndefined();
    });

});