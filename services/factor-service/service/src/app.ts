import { ApolloServer, gql, UserInputError } from "apollo-server-express";
import express, { Request, Response } from "express";
import { schema } from "./schemas";
import { GraphQLError } from "graphql";

const errorsNotLogged = ["BAD_USER_INPUT", "GRAPHQL_VALIDATION_FAILED"];
const port = process.env.PORT || 3000;
const isPlaygroundActive = process.env.NODE_ENV !== "production";
const apolloServer = new ApolloServer({
    schema,
    playground: isPlaygroundActive,
    formatError: (error: GraphQLError) => {
        // This don't cover errors from missing variables, so these will get logged even though they are the user's fault
        if (!(error.extensions && errorsNotLogged.includes(error.extensions.code))) {
            console.log(error);
        }
        return { message: error.message, path: error.path };
    }
});

const app = express();
app.set("port", port);
apolloServer.applyMiddleware({ app, cors: true });

// Health check
app.get("/healthz", (req: Request, res: Response) => {
    res.send("ok");
});

export default app;
