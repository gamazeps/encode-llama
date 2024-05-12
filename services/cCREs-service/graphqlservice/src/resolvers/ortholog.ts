import { db } from "../postgres";
import { selectOrtholog } from "../postgres/ortholog/select";
import { Ortholog } from "../postgres/types";
import { Config } from "../init";

export async function orthologQuery(_: any, parameters: any, context: { config: Config } | any): Promise<Ortholog> {
    let data = await selectOrtholog(parameters, db);
    let query: Ortholog = {
        accession: parameters.accession,
        assembly: parameters.assembly,
        ortholog: []
    };

    // fill set for unique accessions
    for (let x of data) {
        if (parameters.assembly.toLocaleLowerCase() == "grch38") query.ortholog.push(x.mm10);
        else query.ortholog.push(x.grch38);
    }

    return query;
}
