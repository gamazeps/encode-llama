#!/bin/bash
# Deploys to kubernetes. Takes 2 args.
# arg1: data source. Only values "encode", "psychencode", and "gencode" are valid.
# arg1: environment, ie staging. This should match up with filename prefixes for scripts/lib/${arg1}.env.sh and k8s/${arg1}.yml.
# arg2: schema to run the import against.
# arg3: (Optional) version of the importer to use. If omitted, user will be prompted with a list of available versions.
# Example usage: scripts/run-importer.sh encode staging encode_01_22_2019 v1.0.0
set -e

# cd to project root directory
cd "$(dirname "$(dirname "$0")")"

# import common stuff
source scripts/lib/common.sh

# Exit if three args not given
if [[ -z "$3" ]]; then
    echo "At least three arguments required.";
    exit;
fi

# Run the environment shell script to set environment specific variables
source scripts/lib/${2}.env.sh

# If a tag was provided, use it. Otherwise let the user select one.
if [[ ! -z "${4}" ]]; then
    TAG=${4}
else
    TAGS=( $(gcloud container images list-tags gcr.io/$GCR_PROJECT_ID/$IMPORTER_DOCKER_IMAGE_NAME --limit=10 --format="get(tags)") )
    echo "Please select a docker image tag to deploy:"
    select TAG in ${TAGS[@]}
    do
        if [[ ! -z "${TAG}" ]]; then
            echo "Deploying ${TAG}..."
            break
        else
            echo "Invalid selection..."
        fi
    done
fi

gcloud --quiet config set project $K8S_PROJECT_ID
gcloud --quiet config set container/cluster $K8S_CLUSTER_NAME
gcloud --quiet config set compute/zone $COMPUTE_ZONE
gcloud --quiet container clusters get-credentials $K8S_CLUSTER_NAME

# If this job already exists and is running, do not run.
if kubectl get job import-genes-job &>/dev/null ; then
    echo "Existing import-genes-job found. Deleting..."
    kubectl delete job import-genes-job
fi

# Deploy the configured service / Apply any changes to the configuration.
sed -e "s/\${IMPORTER_VERSION}/${TAG}/" \
    -e "s/\${DB_SCHEMA}/${3}/" \
    k8s/importer-${1}-${2}.yml | \
    kubectl create -f -
