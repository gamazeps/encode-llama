import { IDatabase } from "pg-promise";
import { CelltypeQueryParameters } from "../types";
import { CelltypeDetails } from "./../types";

function wrap(x: string): string {
    return "'" + x + "'";
}
function joincts(celltypes: string[], delimiter: string): string {
    return celltypes.map(wrap).join(delimiter);
}
export async function selectCellType(parameters: CelltypeQueryParameters, db: IDatabase<any>): Promise<CelltypeDetails[]> {
    const assembly = parameters.assembly;
    let query = [
        `SELECT
        celltype,
        wiki_desc,ct_image_url from celltype_descriptions_${assembly}
        `
    ];
    const wherecond: string[] = [];

    if (parameters.name && parameters.name.length > 0) {
        const names = parameters.name.map((n: any) => n.toLowerCase());
        const nms = joincts(names, ",");
        wherecond.push(`LOWER(celltype_descriptions_${assembly}.celltype) in (${nms})`);
    }
    let retcondn = "";
    if (0 < wherecond.length) {
        retcondn = "WHERE " + wherecond.join(" and ");
    }
    query.push(retcondn);

    const result = (await db.any(query.join(" "))).map((d: any) => {
        return {
            celltype: d.celltype,
            wiki_desc: d.wiki_desc,
            ct_image_url: d.ct_image_url
        };
    });
    return result;
}
