export interface ResponseWithError<T> {
    data?: T;
    error?: RequestError;
}

export interface RequestError {
    errortype: string;
    message: string;
}

export async function wrapRequest<T>(read: () => Promise<T>): Promise<ResponseWithError<T>> {
    const response: ResponseWithError<T> = {};
    try {
        response.data = await read();
    } catch (e) {
        console.log(e);
        response.error = {
            errortype: e.errortype,
            message: e.message
        };
    }
    return response;
}

export const ALLOWED_ASSAYS = new Set([ "ChIP-seq", "DNase-seq" ]);
