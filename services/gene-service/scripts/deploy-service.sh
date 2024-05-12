#!/bin/bash
# Deploys to kubernetes. Takes 3 args.
# arg1: environment, ie staging. This should match up with filename prefixes for lib/${arg1}.env.sh and k8s/${arg1}.yml.
# arg2: schema to deploy the service against.
# arg3: docker image tag to deploy. This argument is optional. If omitted, you will be prompted with a list of tags in GCR to select from.
# Example usage: scripts/deploy-service.sh staging db_user_schema db_encode_schema db_psychencode_schema db_gencode_schema v1.0.0
# ./scripts/deploy-service.sh staging gene_user_data encode_07_02_2020 psychencode_07_03_2020 gencode_07_03_2020 tssrampagev11
# ./scripts/deploy-service.sh staging gene_user_data importencodedatav1 psychencode_07_03_2020 gencode_07_03_2020 v2.10.10
# ./scripts/deploy-service.sh staging gene_user_data importencodedatav1 psychencode_07_03_2020 gencode_02_29_2024 v2.10.12

set -e

# cd to project root directory
cd "$(dirname "$(dirname "$0")")"

# import common stuff
source scripts/lib/common.sh

# Exit if two args not given
if [[ -z "$5" ]]; then
    echo "At least five arguments required.";
    exit;
fi

# Run the environment shell script to set environment specific variables
source scripts/lib/${1}.env.sh

# If a tag was provided, use it. Otherwise let the user select one.
if [[ ! -z "${6}" ]]; then
    TAG=${6}
else
    TAGS=( $(gcloud container images list-tags gcr.io/devenv-215523/genes-service --limit=10 --format="get(tags)") )
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

# When running in ci, we will set environment variables with base64 encoded versions of service key files.
# This will log you in with the given account.
# When running locally log in manually with your own account.
if [[ "${K8S_SERVICE_KEY}" ]]; then
    echo $K8S_SERVICE_KEY | base64 --decode > ${HOME}/k8s_service_key.json
    gcloud auth activate-service-account --key-file ${HOME}/k8s_service_key.json
fi

gcloud --quiet config set project $K8S_PROJECT_ID
gcloud --quiet config set container/cluster $K8S_CLUSTER_NAME
gcloud --quiet config set compute/zone $COMPUTE_ZONE
gcloud --quiet container clusters get-credentials $K8S_CLUSTER_NAME

# Deploy the configured service / Apply any changes to the configuration.
sed -e "s/\${SERVICE_VERSION}/${TAG}/" \
    -e "s/\${DB_USER_SCHEMA}/${2}/" \
    -e "s/\${DB_ENCODE_SCHEMA}/${3}/" \
    -e "s/\${DB_PSYCHENCODE_SCHEMA}/${4}/" \
    -e "s/\${DB_GENCODE_SCHEMA}/${5}/" \
    k8s/service-${1}.yml | \
    kubectl apply -f -

# Wait for deployment to finish rolling out
kubectl rollout status deployment/genes-service-deployment

# Update api gateway
kubectl rollout restart deployment/genome-almanac-api-deployment 
kubectl rollout restart deployment/factorbook-api-deployment 
