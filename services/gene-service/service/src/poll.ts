import { poll } from "./util/poll";
import { K8sClient } from "./util/k8sClient";


const bucketName = process.env["GCS_BUCKET"];
if (bucketName === undefined) throw new Error("GCS_BUCKET env var is required!");
const k8sClient = new K8sClient(bucketName);

const rawImportLimit = process.env["IMPORT_LIMIT"];
const importLimit = rawImportLimit ? parseInt(rawImportLimit) : 3;

poll(k8sClient, importLimit).then();