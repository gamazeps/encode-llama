import { ApolloServer } from "apollo-server-express";
import express, { Request, Response, Express } from "express";
import cors from "cors";
import { schema } from "./schema";
import { api } from "./routers";
import init from "./init";
//const bodyParser = require('body-parser');
const port = process.env.PORT || 3000;
const isPlaygroundActive = process.env.NODE_ENV !== "production";

function parseUserMiddleware(req: any, res: any, next: any) {
    if (req.header("user") !== undefined) {
        req.user = JSON.parse(req.header("user") as string);
    }
    next();
}

const App = new Promise<Express>((resolve, reject) => {
    init().then(config => {
        const app = express();
        //app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }))
        app.use(express.json({ limit: 100000000 }));
        app.use(parseUserMiddleware);
        app.set("port", port);
        app.set("config", config);
        app.use(api);
        app.use(function(req, res, next) {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader(
              "Access-Control-Allow-Methods",
              "OPTIONS, GET, POST, PUT, PATCH, DELETE"
            );
            res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
            if (req.method === "OPTIONS") {
              return res.sendStatus(204);
            }
            next();
        });
        
        app.use(cors())

        const apolloServer = new ApolloServer({
            schema,
            playground: isPlaygroundActive,
            context: ({ req }: any): any => {
                return { 
                    user: req.user, 
                    transcriptLoaders: {},
                    exonLoaders: {},
                    utrLoaders: {},
                    signalLoaders: {},
                    geneQuantificationLoaders: {},
                    geneCoordinateDataLoaders: {},
                    transcriptQuantificationLoaders: {},
                    geneLoaders: {},
                    transcriptLoadersById: {},
                    geneQuantValueLoaders: {},
                    transcriptQuantValueLoaders: {},
                    geneQuantLoaders: {},
                    config: app.get("config")
                }
            }
        });
        apolloServer.applyMiddleware({ app, cors: true });

        // Health check
        app.get("/healthz", (req: Request, res: Response) => {
            res.send("ok");
        });

        resolve(app);
        

    }).catch(reject);
})


export default App;