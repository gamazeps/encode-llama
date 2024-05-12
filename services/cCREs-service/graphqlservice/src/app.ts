import { ApolloServer } from "apollo-server-express";
import express, { Request, Response, Express } from "express";
import cors from 'cors';
import { schema } from "./schemas";
import { GraphQLError } from "graphql";
import init from "./init";
import { api } from "./rest";

const errorsNotLogged = ["BAD_USER_INPUT", "GRAPHQL_VALIDATION_FAILED"];
const port = process.env.PORT || 3000;
const isPlaygroundActive = process.env.NODE_ENV !== "production";

const App = new Promise<Express>((resolve, reject) => {

    init().then(config => {

        const app = express();
        app.set("port", port);
        app.set("config", config);
        
        const apolloServer = new ApolloServer({
            schema,
            playground: isPlaygroundActive,
            formatError: (error: GraphQLError) => {
                // This don't cover errors from missing variables, so these will get logged even though they are the user's fault
                if (!(error.extensions && errorsNotLogged.includes(error.extensions.code))) {
                    console.log(error);
                }
                return { message: error.message, path: error.path };
            },
            context: () => ({
                rDHSZScoreLoaders: {},
                cCREZScoreLoaders: {},
                cCREmaxZScoreLoaders: {},
                rDHSmaxZScoreLoaders: {},
                cCRELoaders: {},
                rDHSLoaders: {},
                umapLoaders: {},
                ldrLoaders: {},
                biosampleLoaders: {},
                config: app.get("config")
            })
        });
        app.use(cors());
        app.use(api(config));
        apolloServer.applyMiddleware({ app, cors: true });
        
        // Health check
        app.get("/healthz", (_: Request, res: Response) => {
            res.send("ok");
        });
        resolve(app);

    }).catch(reject);

});

export default App;
