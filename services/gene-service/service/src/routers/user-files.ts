import { Request, Response } from "express";
import { 
    selectUserGeneQuantFileOwner, selectUserTranscriptQuantFileOwner,
    UserFileOwnerInfo 
} from "../postgres/user-files/select";
import { Readable } from "stream";
import { gcsClient } from "../util/gcsClient";
import Busboy from "busboy";

interface FileUploadParts {
    assembly: string;
    mimeType: string;
    file: Readable;
}

function extractUploadParts(req: Request): Promise<FileUploadParts> {
    return new Promise((resolve, reject) => {
        let busboy = new Busboy({ headers: req.headers });
        let assembly: string|undefined = undefined;
        busboy.on('file', function(fieldName: string, file: Readable, fileName: string, 
                encoding: string, mimeType: string) {
            if (assembly === undefined) {
                throw new Error("assembly field must be provided and must be before file field.");
            }
            resolve({ assembly, file, mimeType });
        });
        busboy.on('field', function(fieldName: string, val: string) {
            if (fieldName === "assembly") {
                assembly = val;
            }
        });
        req.pipe(busboy);
    });
}

async function uploadFile(req: Request, ownerInfo: UserFileOwnerInfo, accession: string, 
        fileType: string): Promise<void> {
    const uploadParts = await extractUploadParts(req);
    const gcsPath = `${ownerInfo!.user_collection_accession}/${ownerInfo!.dataset_accession}/${fileType}/${uploadParts.assembly}/${accession}.tsv`;
    
    await gcsClient.writeFile(gcsPath, uploadParts.mimeType, uploadParts.file);
}


export async function uploadGeneQuantHandler(req: Request, res: Response) {
    const user = (req as any).user;
    if (user === undefined) {
        res.status(400).send("You must be logged in to perform this operation!");
        return;
    }
    const accession = req.params.accession;
    const ownerInfo = await selectUserGeneQuantFileOwner(accession);
    const ownerUid = ownerInfo !== undefined ? ownerInfo.owner_uid : undefined;
    if (ownerUid !== user.uid) {
        res.status(400).send("You do not have write access to that collection.");
        return;
    }

    await uploadFile(req, ownerInfo!, accession, "gene-quantification");
    res.send("Successfully uploaded file!");
}

export async function uploadTransQuantHandler(req: Request, res: Response) {
    const user = (req as any).user;
    if (user === undefined) {
        res.status(400).send("You must be logged in to perform this operation!");
        return;
    }
    const accession = req.params.accession;
    const ownerInfo = await selectUserTranscriptQuantFileOwner(accession);
    const ownerUid = ownerInfo !== undefined ? ownerInfo.owner_uid : undefined;
    if (ownerUid !== user.uid) {
        res.status(400).send("You do not have write access to that collection.");
        return;
    }

    await uploadFile(req, ownerInfo!, accession, "transcript-quantification");
    res.send("Successfully uploaded file!");
}

async function downloadFile(res: Response, ownerInfo: UserFileOwnerInfo, accession: string) {
    const gcsPath = `${ownerInfo!.user_collection_accession}/${ownerInfo!.dataset_accession}/${accession}`;
    const fileIn = gcsClient.readFile(gcsPath);
    fileIn.pipe(res);
}

export async function downloadGeneQuantHandler(req: Request, res: Response) {
    const user = (req as any).user;
    const accession = req.params.accession;
    const ownerInfo = await selectUserGeneQuantFileOwner(accession);
    const userId = user !== undefined ? user.uid : undefined;
    if (ownerInfo === undefined || (!ownerInfo.is_public && ownerInfo.owner_uid !== userId)) {
        res.status(400).send("You do not have read access to that file.");
        return;
    }

    downloadFile(res, ownerInfo, accession);
}

export async function downloadTransQuantHandler(req: Request, res: Response) {
    const user = (req as any).user;
    const accession = req.params.accession;
    const ownerInfo = await selectUserTranscriptQuantFileOwner(accession);
    if (ownerInfo === undefined || (!ownerInfo.is_public && ownerInfo.owner_uid !== user.uid)) {
        res.status(400).send("You do not have read access to that file.");
        return;
    }
    
    downloadFile(res, ownerInfo, accession);
}