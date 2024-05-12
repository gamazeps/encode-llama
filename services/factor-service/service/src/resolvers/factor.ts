import { selectFactor } from "../postgres/factor";
import { db } from "../postgres/connection";
import { FactorQueryParameters, FactorDetails } from "./../types";

async function factorQuery(obj: any, parameters: FactorQueryParameters | any): Promise<FactorDetails[]> {
    return selectFactor(parameters, db);
}

export const factorQueries = {
    factor: factorQuery
};
