import { ForbiddenError } from "apollo-server-express";
import { UserCollection } from "../postgres/user-collection/types";
import { 
    insertUserCollection, selectUserCollectionOwner, updateUserCollection, 
    deleteUserCollection, selectMyUserCollections, selectUserCollection, 
    selectPublicUserCollections 
} from "../postgres/user-collection/select";
import { userCheck } from "./utilities";
import { UserCollectionImportStatus } from "../postgres/types";
import { selectCollectionGeneQuantFiles, selectCollectionTranscriptQuantFiles } from "../postgres/user-files/select";


export async function userCollectionWriteAuthCheck(userCollectionAccession: string, userId: string) {
    const owner = await selectUserCollectionOwner(userCollectionAccession);
    if (owner !== userId) {
        throw new ForbiddenError("You do not have write access to that collection.");
    }
}

export interface CreateUserCollectionMutArgs {
    name: string;
    is_public?: boolean;
}

async function createUserCollectionMut(obj: any, args: CreateUserCollectionMutArgs|any, context: any): Promise<UserCollection> {
    userCheck(context.user);
    const insertArgs = {
        ...args,
        owner_uid: context.user.uid,
        is_public: args.is_public || false
    }
    const accession = await insertUserCollection(insertArgs);

    return { accession, ...insertArgs };
}

export interface UpdateUserCollectionMutArgs {
    accession: string;
    name: string;
    is_public?: boolean;
}

async function updateUserCollectionMut(obj: any, args: UpdateUserCollectionMutArgs|any, context: any): Promise<UserCollection> {
    userCheck(context.user);
    await userCollectionWriteAuthCheck(args.accession, context.user.uid);
    return updateUserCollection(args);
}

export interface DeleteUserCollectionMutArgs {
    accession: string;
}

async function deleteUserCollectionMut(obj: any, args: DeleteUserCollectionMutArgs|any, context: any): Promise<string> {
    userCheck(context.user);
    await userCollectionWriteAuthCheck(args.accession, context.user.uid);
    deleteUserCollection(args.accession);
    return args.accession;
}

async function myUserCollectionsQuery(obj: any, args: any, context: any): Promise<UserCollection[]> {
    userCheck(context.user);
    return selectMyUserCollections(context.user.uid);
}

export interface PublicUserCollectionsQueryArgs {
    limit: number, 
    offset: number
}

async function publicUserCollectionsQuery(obj: any, args: PublicUserCollectionsQueryArgs|any, context: any): Promise<UserCollection[]> {
    return selectPublicUserCollections(args.limit, args.offset);
}

export interface UserCollectionQueryArgs {
    accession: string;
}

async function userCollectionQuery(obj: any, args: UserCollectionQueryArgs|any, context: any): Promise<UserCollection|undefined> {
    const userCollection = await selectUserCollection(args.accession);
    if (userCollection !== undefined && userCollection.is_public === false) {
        userCheck(context.user);
        if (userCollection.owner_uid !== context.user.uid) {
            throw new Error("You do not have read access to this");
        }
    }
    return userCollection;
}

export interface QueueUserCollectionImportArgs {
    accession: string;
}

async function queueUserCollectionImportMut(obj: any, args: QueueUserCollectionImportArgs|any, 
        context: any): Promise<string> {
    userCheck(context.user);
    const userCollection = await selectUserCollection(args.accession);
    if (userCollection === undefined || userCollection.owner_uid !== context.user.uid) {
        throw new ForbiddenError("You do not have write access to that collection.");
    }
    // Make sure it's not already queued
    if (userCollection.import_status === UserCollectionImportStatus.QUEUED) {
        throw new Error("Import for that collection already queued");
    }
    // Make sure it's not already in progress
    if (userCollection.import_status === UserCollectionImportStatus.IN_PROGRESS) {
        throw new Error("Import for that collection already in progress");
    }

    // Make sure there are any files to import
    const gqFiles = await selectCollectionGeneQuantFiles(args.accession);
    if (gqFiles.length === 0) {
        const tqFiles = await selectCollectionTranscriptQuantFiles(args.accession);
        if (tqFiles.length === 0) {
            throw new Error("User Collection contains no files to import.");
        }
    }
    
    // Update with QUEUED
    await updateUserCollection({ 
        accession: args.accession, 
        import_status: UserCollectionImportStatus.QUEUED, 
        queued_time: (new Date()).toISOString()
    });
    return args.accession;
}

export const userCollectionsMutations = {
    create_user_collection: createUserCollectionMut,
    update_user_collection: updateUserCollectionMut,
    delete_user_collection: deleteUserCollectionMut,
    queue_user_collection_import: queueUserCollectionImportMut
};

export const userCollectionsQueries = {
    my_user_collections: myUserCollectionsQuery,
    public_user_collections: publicUserCollectionsQuery,
    user_collection: userCollectionQuery
};
