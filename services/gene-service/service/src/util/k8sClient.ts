import { KubeConfig, BatchV1Api, V1Job } from "@kubernetes/client-node";
import { trimIndent } from "./misc";
import { UserCollectionImportStatus } from "../postgres/types";


const jobSpec = (name: string, schema: string, bucket: string, 
        userCollectionAccession: string, importerVersion: string): V1Job => ({
    metadata: { name },
    spec: {
        template: {
            spec: {
                containers: [{
                    name: "genes-importer",
                    image: `gcr.io/devenv-215523/genes-importer:${importerVersion}`,
                    imagePullPolicy: "Always",
                    command: ["/bin/sh", "-c"],
                    args: [trimIndent(`
                        sleep 2s
                        trap "touch /tmp/pod/terminated" EXIT
                        java -Xms256M -Xmx1G -jar /app/genes-importer.jar
                    `, true)],
                    resources: {
                        requests: { memory: "512M" },
                        limits: { memory: "1G" }
                    },
                    env: [{
                        name: "JVM_OPTS",
                        value: "-XX:+UnlockExperimentalVMOptions -XX:+UseCGroupMemoryLimitForHeap"
                    }, {
                        name: "DB_SCHEMA",
                        value: schema
                    }, {
                        name: "DB_URL",
                        value: "jdbc:postgresql://127.0.0.1:5432/genes-db"
                    }, {
                        name: "DB_USERNAME",
                        valueFrom: {
                            secretKeyRef: {
                                name: "genes-db-credentials",
                                key: "username"
                            }
                        }
                    }, {
                        name: "DB_PASSWORD",
                        valueFrom: {
                            secretKeyRef: {
                                name: "genes-db-credentials",
                                key: "password"
                            }
                        }
                    }, {
                        name: "REPLACE_SCHEMA",
                        value: "true"
                    }, {
                        name: "GS_QUANT_BUCKET",
                        value: bucket
                    }, {
                        name: "GS_QUANT_USER_COLLECTION",
                        value: userCollectionAccession
                    }],
                    volumeMounts: [{
                        name: "tmp-pod",
                        mountPath: "/tmp/pod"
                    }]
                }, {
                    name: "cloudsql-proxy",
                    image: "gcr.io/cloudsql-docker/gce-proxy:1.11",
                    command: ["/bin/sh", "-c"],
                    args: [trimIndent(`
                        /cloud_sql_proxy -instances=devenv-215523:us-east1:genes-instance=tcp:5432 -credential_file=/secrets/cloudsql/workflow-service-account.json & CHILD_PID=$!
                        (while true; do if [[ -f "/tmp/pod/terminated" ]]; then kill $CHILD_PID; echo "Killed $CHILD_PID because the main container terminated."; fi; sleep 1; done) &
                        wait $CHILD_PID
                        if [[ -f "/tmp/pod/terminated" ]]; then exit 0; echo "Job completed. Exiting..."; fi
                    `, true)],
                    securityContext: {
                        runAsUser: 2,
                        allowPrivilegeEscalation: false
                    },
                    volumeMounts: [{
                        name: "service-account-key",
                        mountPath: "/secrets/cloudsql",
                        readOnly: true
                    }, {
                        name: "tmp-pod",
                        mountPath: "/tmp/pod",
                        readOnly: true
                    }]
                }],
                volumes: [{
                    name: "service-account-key",
                    secret: { secretName: "workflow-service-account-key" }
                }, {
                    name: "tmp-pod",
                    emptyDir: {}
                }], 
                restartPolicy: "Never"
            }
        }
    }
});

// Create our own kubernetes wrapper
export class K8sClient {

    private readonly k8sApi: BatchV1Api;
    
    constructor(private bucket: string) {
        const kc = new KubeConfig();
        if (process.env.NODE_ENV === 'production') {
            kc.loadFromCluster();
        } else {
            //kc.loadFromDefault();
             kc.loadFromCluster();
        }
        this.k8sApi = kc.makeApiClient(BatchV1Api);
    }

    async startImportJob(userCollectionAccession: string, jobName: string, schema: string): Promise<void> {
        const job = jobSpec(jobName, schema, this.bucket, userCollectionAccession, "v1.1.9");
  
        try {
            await this.k8sApi.createNamespacedJob("default", job);
        } catch (e) {
            console.log("Job error: "+JSON.stringify(e));
            throw e
        }
        console.log("created import job")
    }

    async checkStatus(name: string): Promise<UserCollectionImportStatus> {
        let response;
        try {
            response = await this.k8sApi.readNamespacedJobStatus(name, "default");
        } catch (e) {
            console.log("checkStatus error: "+JSON.stringify(e));
            throw e;
        }
        
        const resStatus = response.body.status;
        let status: UserCollectionImportStatus;
        if (resStatus?.succeeded) {
            status = UserCollectionImportStatus.SUCCESS;
        } else if (resStatus?.failed) {
            status = UserCollectionImportStatus.ERROR;
        } else {
            status = UserCollectionImportStatus.IN_PROGRESS;
        }
        return status;
    }

}
