import { GraphQLScalarType } from "graphql";

export const DateScalar: GraphQLScalarType = new GraphQLScalarType({
    name: "Date",
    description: "Scalar date type without associated time",
    parseValue(value: string) {
        return new Date(value);
    },
    serialize(value: Date) {
        return value.getFullYear() + "-" + ("0" + (value.getMonth() + 1)).slice(-2) + "-" + ("0" + value.getDate()).slice(-2); // YYYY-MM-DD
    },
    parseLiteral(ast: any) {
        return new Date(ast);
    }
});
