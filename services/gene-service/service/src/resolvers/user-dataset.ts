import { ForbiddenError } from "apollo-server-express";
import { 
    selectUserDatasetOwner, insertUserDataset, updateUserDataset, deleteUserDataset 
} from "../postgres/user-dataset/select";
import { userCheck } from "./utilities";
import { userCollectionWriteAuthCheck } from "./user-collection";
import { Dataset } from "../postgres";
import { QuantificationDataSourceType } from "../postgres/types";

export async function userDatasetWriteAuthCheck(datasetAccession: string, userId: string): Promise<string> {
    const ownerInfo = await selectUserDatasetOwner(datasetAccession);
    const ownerUid = ownerInfo ? ownerInfo.owner_uid : undefined;
    if (ownerUid !== userId) {
        throw new ForbiddenError("You do not have write access to that collection.");
    }
    return ownerInfo!.user_collection_accession;
}

export interface CreateUserDatasetMutArgs {
    user_collection_accession: string;
    accession: string;
    biosample: string
    biosample_type?: string
    tissue?: string
    cell_compartment?: string
    lab_name?: string
    lab_friendly_name?: string
    assay_term_name?: string
}

export async function createUserDatasetMut(obj: any, args: CreateUserDatasetMutArgs|any, 
        context: any): Promise<Dataset> {
    userCheck(context.user);
    await userCollectionWriteAuthCheck(args.user_collection_accession, context.user.uid);
    const accession = await insertUserDataset(args);
    const ds = {
        ...args, 
        accession,
        source: { type: QuantificationDataSourceType.USER, user_collection: args.user_collection_accession }
    }
    delete ds.user_collection_accession;
    return ds;
}

export interface UpdateUserDatasetMutArgs {
    accession: string;
    biosample: string
    biosample_type?: string
    tissue?: string
    cell_compartment?: string
    lab_name?: string
    lab_friendly_name?: string
    assay_term_name?: string
}

export async function updateUserDatasetMut(obj: any, args: UpdateUserDatasetMutArgs|any, 
        context: any): Promise<Dataset> {
    userCheck(context.user);
    await userDatasetWriteAuthCheck(args.accession, context.user.uid);
    return updateUserDataset(args);
}

export interface DeleteUserDatasetMutArgs {
    accession: string;
}

export async function deleteUserDatasetMut(obj: any, args: DeleteUserDatasetMutArgs|any, 
        context: any): Promise<string> {
    userCheck(context.user);
    await userDatasetWriteAuthCheck(args.accession, context.user.uid);
    await deleteUserDataset(args.accession);
    return args.accession;
}

export const userDatasetMutations = {
    create_user_dataset: createUserDatasetMut,
    update_user_dataset: updateUserDatasetMut,
    delete_user_dataset: deleteUserDatasetMut
};