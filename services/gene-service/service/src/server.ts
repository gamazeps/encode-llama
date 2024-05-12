import app from "./app";
import { GcsClient, setGcsClient } from "./util/gcsClient";

const serviceKey = process.env["GCS_SERVICE_KEY"];
const projectId = process.env["GCS_PROJECT_ID"];
const bucketName = process.env["GCS_BUCKET"];
if (serviceKey === undefined) throw new Error("GCS_SERVICE_KEY env var is required!");
if (bucketName === undefined) throw new Error("GCS_BUCKET env var is required!");
if (projectId === undefined) throw new Error("GCS_PROJECT_ID env var is required!");
setGcsClient(new GcsClient(bucketName, serviceKey as string));

// start listening on the port
const server = app.then(app => {
    const port = app.get("port");
    return app.listen(port, () => {
        console.log(`Server ready at http://localhost:${port}/graphql`);
    });
})
export default server;
