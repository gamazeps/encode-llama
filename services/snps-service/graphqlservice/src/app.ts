import { ApolloServer } from "apollo-server-express";
import express, { Request, Response, Express } from "express";
import { schema } from "./schema";
import { GraphQLError } from "graphql";
import { api } from './rest';

import { mafLoader } from "./resolvers/maf";

const errorsNotLogged = ["BAD_USER_INPUT", "GRAPHQL_VALIDATION_FAILED"];
const port = process.env.PORT || 3000;
const isPlaygroundActive = process.env.NODE_ENV !== "production";
const apolloServer = new ApolloServer({
    schema,
    playground: isPlaygroundActive,
    formatError: (error: GraphQLError) => {

        // This doesn't cover errors from missing variables, so they will get logged even
        // though they are the user's fault
        if (!(error.extensions && errorsNotLogged.includes(error.extensions.code)))
            console.log(error);

        return { message: error.message, path: error.path };

    },
    context: (): any => ({
        snpLoaders: {},
        ldLoaders: {},
        studyCTELoaders: {},
        studySNPLoaders: {},
        studyLoaders: {},
        gtexLoaders: {},
        mafLoader: mafLoader()
    })
});

const app: Express = express();
app.use(express.json({ limit: "5000mb" }));
app.set("port", port);
app.use(api);
apolloServer.applyMiddleware({ app, cors: true });

// Health check
app.get("/healthz", (req: Request, res: Response) => {
    res.send("ok");
});

export { Express };
export default app;
