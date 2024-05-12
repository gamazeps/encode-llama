import { Request, Response, NextFunction } from "express";
import { exec } from "child_process";

export function removeNullFields(obj: any): any {
    for (var propName in obj) { 
        if (obj[propName] === null || obj[propName] === undefined) {
            delete obj[propName];
        }
    }
    return obj;
}

export const wait = (ms: any) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * execute the given shell command as a promise
 */
export function execShellCommand(cmd: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.warn(error);
            }
            resolve(stdout? stdout : stderr);
        });
    });
}

/**
 * Express middleware that just places base64 encoded values from the header 'MockUser'
 */
export async function mockAuthMiddleware(req: Request, res: Response, next: NextFunction) {
    const mockUserHeader = req.header('MockUser');
    if (mockUserHeader) {
        try {
            res.locals.user = JSON.parse(Buffer.from(mockUserHeader, 'base64').toString('ascii'));
        } catch (error) {
            res.status(401).send();
            return;
        }
    }
    next();
}

const MOCK_USER_1 = {
    uid: 'test_user_1',
    email: 'test_user_1@wenglab.org'
};
export const MOCK_USER_1_JSON = JSON.stringify(MOCK_USER_1);

const MOCK_USER_2 = {
    uid: 'test_user_2',
    email: 'test_user_2@wenglab.org'
};
export const MOCK_USER_2_JSON = JSON.stringify(MOCK_USER_2);