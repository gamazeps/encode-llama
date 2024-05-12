import { db } from "../postgres/connection";
import { selectCellType } from "../postgres/celltype";
import { CelltypeQueryParameters } from "../types";
import { CelltypeDetails } from "./../types";

async function celltypeQuery(obj: any, parameters: CelltypeQueryParameters | any): Promise<CelltypeDetails[]> {
    return selectCellType(parameters, db);
}

export const celltypeQueries = {
    celltype: celltypeQuery
};
