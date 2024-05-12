import { ApolloServer } from "apollo-server-express";
import express, { Request, Response } from "express";
import { schema } from "./schema";
import { GraphQLError } from "graphql";
import { api } from "./routers";

import compression from "compression";
import cors from "cors";

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
// app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }))
// app.use(express.json({ limit: "5000mb" }));
app.set("port", port);
app.use(compression());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(cors());
app.use(api);
apolloServer.applyMiddleware({ app, cors: true });

// Health check
app.get("/healthz", (req: Request, res: Response) => {
    res.send("ok");
});

export default app;
