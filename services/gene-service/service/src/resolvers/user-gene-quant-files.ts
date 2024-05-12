import { selectUserGeneQuantFileOwner, insertUserGeneQuantFile, updateUserGeneQuantFile, deleteUserGeneQuantFile } from "../postgres/user-files/select";
import { ForbiddenError } from "apollo-server-express";
import { QuantificationDataSourceType } from "../postgres/types";
import { QuantificationFile } from "../postgres";
import { userCheck } from "./utilities";
import { userDatasetWriteAuthCheck } from "./user-dataset";

export interface CreateUserGeneQuantFileMutArgs {
    dataset_accession: string;
    assembly: string;
    biorep?: number;
    techrep?: number;
}

export async function createUserGeneQuantMut(obj: any, args: CreateUserGeneQuantFileMutArgs|any, 
    context: any): Promise<QuantificationFile> {
    userCheck(context.user);
    const userCollectionAccession = await userDatasetWriteAuthCheck(args.dataset_accession, 
        context.user.uid);
    const accession = await insertUserGeneQuantFile(args);
    const ds = {
        ...args, 
        accession, 
        source: { type: QuantificationDataSourceType.USER, user_collection: userCollectionAccession }
    }
    return ds;
}

async function userGeneQuantFileWriteAuthCheck(accession: string, userId: string) {
    const ownerInfo = await selectUserGeneQuantFileOwner(accession);
    const ownerUid = ownerInfo !== undefined ? ownerInfo.owner_uid : undefined;
    if (ownerUid !== userId) {
        throw new ForbiddenError("You do not have write access to that collection.");
    }
    return ownerInfo!.user_collection_accession;
}

export interface UpdateUserGeneQuantFileMutArgs {
    accession: string;
    assembly: string;
    biorep: number;
    techrep: number;
}

export async function updateUserGeneQuantFileMut(obj: any, args: UpdateUserGeneQuantFileMutArgs|any, 
        context: any): Promise<QuantificationFile> {
    userCheck(context.user);
    const userCollectionAccession = await userGeneQuantFileWriteAuthCheck(args.accession, context.user.uid);
    const file = await updateUserGeneQuantFile(args);
    file.source = { type: QuantificationDataSourceType.USER, user_collection: userCollectionAccession }
    return file;
}

export interface DeleteUserGeneQuantFileMutArgs {
    accession: string;
}

export async function deleteUserGeneQuantFileMut(obj: any, args: DeleteUserGeneQuantFileMutArgs|any, 
        context: any): Promise<string> {
    userCheck(context.user);
    await userGeneQuantFileWriteAuthCheck(args.accession, context.user.uid);
    await deleteUserGeneQuantFile(args.accession);
    return args.accession;
}

export const userGeneQuantFilesMutations = {
    create_user_gene_quantification_file: createUserGeneQuantMut,
    update_user_gene_quantification_file: updateUserGeneQuantFileMut,
    delete_user_gene_quantification_file: deleteUserGeneQuantFileMut
};