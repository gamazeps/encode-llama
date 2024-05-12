import { IDatabase } from "pg-promise";
import { isRegExp } from "util";
import { FactorQueryParameters, FactorDetails } from "./../types";

function wrap(x: string): string {
    return "'" + x + "'";
}
function joingenes(geneids: string[], delimiter: string): string {
    return geneids.map(wrap).join(delimiter);
}
export async function selectFactorByName(parameters: { name: string,assembly: string }, db: IDatabase<any>): Promise<FactorDetails> {
    const assembly = parameters.assembly;
    let query = [
        `SELECT
        gene_id,name,chromosome,start,stop,uniprot_data,
        ncbi_data,
        hgnc_data,
        ensemble_data,modifications,pdbids,factor_wiki,dbd, istf,
        color from factor_descriptions_${assembly}
        `
    ];
    const wherecond: string[] = [];
    let factorNames = [parameters.name]
    const names = factorNames.map((n: any) => {
        let f = n.split("-");
        let factorname: string = f[0];
        if (f.length > 1) {
            factorname = f[1];
        }
        return factorname.toLowerCase();
    });
    const nms = joingenes(names, ",");
    wherecond.push(`LOWER(factor_descriptions_${assembly}.name) in (${nms})`);
    let retcondn = "";
    if (0 < wherecond.length) {
        retcondn = "WHERE " + wherecond.join(" and ");
    }
    query.push(retcondn);

    const result = (await db.any(query.join(" "))).map((d: any) => {
        return {
            gene_id: d.gene_id,
            name: d.name,
            assembly: assembly,
            coordinates: {
                chromosome: d.chromosome,
                start: d.start,
                end: d.stop
            },
            factor_wiki: d.factor_wiki,
            uniprot_data: d.uniprot_data,
            ncbi_data: d.ncbi_data,
            hgnc_data: d.hgnc_data,
            ensemble_data: d.ensemble_data,
            modifications: d.modifications,
            pdbids: d.pdbids,
            dbd: d.dbd,
            isTF: d.istf,
            color: d.color
        };
    });
    return result[0];

}

export async function selectFactor(parameters: FactorQueryParameters, db: IDatabase<any>): Promise<FactorDetails[]> {
    const assembly = parameters.assembly;
    let query = [
        `SELECT
        gene_id,name,chromosome,start,stop,uniprot_data,
        ncbi_data,
        hgnc_data,
        ensemble_data,modifications,pdbids,factor_wiki,dbd, istf,
        color from factor_descriptions_${assembly}
        `
    ];
    const wherecond: string[] = [];

    if (parameters.id && parameters.id.length > 0) {
        const ids = joingenes(parameters.id, ",");
        wherecond.push(`factor_descriptions_${assembly}.gene_id in (${ids})`);
    }

    if (parameters.name && parameters.name.length > 0) {
        const names = parameters.name.map((n: any) => {
            let f = n.split("-");
            let factorname: string = f[0];
            if (f.length > 1) {
                factorname = f[1];
            }
            return factorname.toLowerCase();
        });
        const nms = joingenes(names, ",");
        wherecond.push(`LOWER(factor_descriptions_${assembly}.name) in (${nms})`);
    }
    if(parameters.name_prefix)
    {
        wherecond.push(`factor_descriptions_${assembly}.name ilike '${parameters.name_prefix}%'`);
    }
    if(parameters.isTF!==undefined)
    {
        wherecond.push(`factor_descriptions_${assembly}.isTF=${parameters.isTF}`);
    }
    let retcondn = "";
    if (0 < wherecond.length) {
        retcondn = "WHERE " + wherecond.join(" and ");
    }
   
    query.push(retcondn);

    if(parameters.limit)
    {
        query.push(` order by name limit ${parameters.limit} `)
    }   

    const result = (await db.any(query.join(" "))).map((d: any) => {
        return {
            gene_id: d.gene_id,
            name: d.name,
            assembly: assembly,
            coordinates: {
                chromosome: d.chromosome,
                start: d.start,
                end: d.stop
            },
            factor_wiki: d.factor_wiki,
            uniprot_data: d.uniprot_data,
            ncbi_data: d.ncbi_data,
            hgnc_data: d.hgnc_data,
            ensemble_data: d.ensemble_data,
            modifications: d.modifications,
            pdbids: d.pdbids,
            dbd: d.dbd,
            isTF: d.istf,
            color: d.color
        };
    });
    return result;
}
