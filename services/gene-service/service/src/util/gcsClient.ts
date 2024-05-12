import { Storage, Bucket, File, GetFilesResponse } from '@google-cloud/storage';
import { Readable, pipeline } from 'stream';
import { promisify } from 'util';
import { streamToString } from './misc';



export class GcsClient {
    
    private bucket: Bucket;
    
    constructor(bucketName: string, serviceKey?: string) {
        const masterStorage = new Storage({ keyFilename: serviceKey });
        this.bucket = masterStorage.bucket(bucketName);
    }

    async fileExists(file: string): Promise<boolean> {
        return (await this.bucket.file(file).exists())[0];
    }

    async listFiles(prefix: string): Promise<string[]> {
        const filesRes: GetFilesResponse = await this.bucket.getFiles({ prefix });
        return filesRes[0].map((f: File) => f.name);
    }

    async deleteFile(file: string): Promise<void> {
        await this.bucket.file(file).delete();
    }

    readFile(file: string): Readable {
        return this.bucket.file(file).createReadStream();
    }

    readFileAsString(file: string): Promise<string> {
        return streamToString(this.readFile(file));
    }

    async writeFile(file: string, mimeType: string, input: Readable): Promise<void> {
        const fileOut = this.bucket.file(file).createWriteStream({ 
            metadata: { contentType: mimeType }
        });
        const uploadPipe = promisify(pipeline);
        await uploadPipe(input, fileOut);
    }

    

    async fileSize(file: string): Promise<number> {
        return (await this.bucket.file(file).get())[0].metadata.size;
    }
}

export let gcsClient: GcsClient;
export const setGcsClient = (client: GcsClient) => gcsClient = client;