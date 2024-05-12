# Peaks Service
All code related to the service that contains:
- Peaks data
- Experiment / File metadata

## Sub-projects
For GraphQL Service and documentation, see service directory.
For importer project, a standalone application that imports data necessary for our service into a Postgres database, see importer directory.

## Scripts
Scripts for developement and testing can be found in importer/scripts and service/scripts
Scripts for building and pushing containers as well as deployment for both the service and importer, see scripts directory

## Infrastructure
Since this service is backed by a postgres database, you will need to set one up for each environment. 
For more on that, see the gcp-infrastructure project.

Both the importer and service will run in kubernetes. We only need one cluster per environment.

## Building and Pushing Images
To build the importer and service, use
- `scripts/build-importer-image.sh $TAG_NAME`
- `scripts/build-service-image.sh $TAG_NAME`

The image will be tagged with TAG_NAME, usually we put a version here. ie. v1.0.0

To push these build importer and service images to GCR, use
- `scripts/build-importer-image.sh $TAG_NAME`
- `scripts/build-service-image.sh $TAG_NAME`

## One-time Deploy Prep
Besides setting up the infrastructure (k8s cluster and postgres instance), there is one other one-time operation required before running the importer and deploying the service.
- `scripts/create-secrets.sh`

This will add the username and password for the postgres database to the kubernetes cluster as a secret.

## Running the Importer
The importer runs as a "job" in kubernetes. It will take hours. How many depends on the configuration. It does not remove itself upon completion, so make sure to check the logs to see the status of the import and remove upon completion.
- `scripts/run-importer.sh $ENV_NAME $SCHEMA_NAME`

ENV_NAME is the name of the environment (ie. "staging") corresponding to the k8s configuration filename for that environment. A good naming convention is "import_DAY_MONTH_YEAR".
SCHEMA_NAME is the name of the schema you're importing to. This should NEVER be a schema the service is currently pointing at. We don't want to wipe out a schema that's currently in use.

## Deploying the Service
After every successful import against a new schema you should deploy the service. To do so, run
- `scripts/deploy-service.sh $ENV_NAME $SCHEMA_NAME`

ENV_NAME is the name of the environment (ie. "staging") corresponding to the k8s configuration filename for that environment.
SCHEMA_NAME is the name of the schema you want to point the service at.

## Deleting the old schema
After pointing the service at a new schema, you'll need to delete the old one. You can do this by connecting to the db using 
- `scripts/connect-to-db.sh $ENV_NAME`

After running this script and following it's instructions you should see a psql repl. The following sql commands will come in handy:
- `select nspname from pg_catalog.pg_namespace;` Gets all schemas in the database.
- `drop schema $SCHEMA_NAME cascade;` Drops the given SCHEMA_NAME.