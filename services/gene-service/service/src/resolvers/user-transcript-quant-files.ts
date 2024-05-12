import { selectUserTranscriptQuantFileOwner, insertUserTranscriptQuantFile, updateUserTranscriptQuantFile, deleteUserTranscriptQuantFile } from "../postgres/user-files/select";
import { ForbiddenError } from "apollo-server-express";
import { QuantificationDataSourceType } from "../postgres/types";
import { QuantificationFile } from "../postgres";
import { userCheck } from "./utilities";
import { userDatasetWriteAuthCheck } from "./user-dataset";

export interface CreateUserTranscriptQuantFileMutArgs {
    dataset_accession: string;
    assembly: string;
    biorep?: number;
    techrep?: number;
}

export async function createUserTranscriptQuantMut(_: any, args: CreateUserTranscriptQuantFileMutArgs|any, 
    context: any): Promise<QuantificationFile> {
    userCheck(context.user);
    const userCollectionAccession = await userDatasetWriteAuthCheck(args.dataset_accession, 
        context.user.uid);
    const accession = await insertUserTranscriptQuantFile(args);
    const ds = {
        ...args, 
        accession, 
        source: { type: QuantificationDataSourceType.USER, user_collection: userCollectionAccession }
    }
    return ds;
}

async function userTranscriptQuantFileWriteAuthCheck(datasetAccession: string, userId: string) {
    const ownerInfo = await selectUserTranscriptQuantFileOwner(datasetAccession);
    const ownerUid = ownerInfo !== undefined ? ownerInfo.owner_uid : undefined;
    if (ownerUid !== userId) {
        throw new ForbiddenError("You do not have write access to that collection.");
    }
    return ownerInfo!.user_collection_accession;
}

export interface UpdateUserTranscriptQuantFileMutArgs {
    accession: string;
    assembly: string;
    biorep: number;
    techrep: number;
}

export async function updateUserTranscriptQuantFileMut(_: any, args: UpdateUserTranscriptQuantFileMutArgs|any, 
        context: any): Promise<QuantificationFile> {
    userCheck(context.user);
    const userCollectionAccession = await userTranscriptQuantFileWriteAuthCheck(args.accession, context.user.uid);
    const file = await updateUserTranscriptQuantFile(args);
    file.source = { type: QuantificationDataSourceType.USER, user_collection: userCollectionAccession }
    return file;
}

export interface DeleteUserTranscriptQuantFileMutArgs {
    accession: string;
}

export async function deleteUserTranscriptQuantFileMut(obj: any, args: DeleteUserTranscriptQuantFileMutArgs|any, 
        context: any): Promise<string> {
    userCheck(context.user);
    await userTranscriptQuantFileWriteAuthCheck(args.accession, context.user.uid);
    await deleteUserTranscriptQuantFile(args.accession);
    return args.accession;
}

export const userTransQuantFilesMutations = {
    create_user_transcript_quantification_file: createUserTranscriptQuantMut,
    update_user_transcript_quantification_file: updateUserTranscriptQuantFileMut,
    delete_user_transcript_quantification_file: deleteUserTranscriptQuantFileMut
};