#!/bin/bash
# Deploys test version of app and gateway to kubernetes, allowing us to ensure new app schema doesn't break gateway.
# Takes 2 args.
# arg1: environment, ie staging. This should match up with filename prefixes for lib/${arg1}.env.sh and k8s/${arg1}.yml.
# arg2: schema to deploy the service against.
# Example usage: scripts/deploy-service.sh staging import_01_22_2019
set -e

# cd to project root directory
cd "$(dirname "$(dirname "$0")")"

# import common stuff
source scripts/lib/common.sh

# Exit if two args not given
if [[ -z "$2" ]]; then
    echo "Two arguments required.";
    exit;
fi

# Run the environment shell script to set environment specific variables
source scripts/lib/${1}.env.sh

# Pull gateway project containing gateway k8s config
rm -rf /tmp/gateway
git clone git@github.com:weng-lab/genome-almanac-api.git /tmp/gateway

# Select tag for factor-service docker image
SERVICE_TAGS=( $(gcloud container images list-tags gcr.io/${GCR_PROJECT_ID}/factor-service --limit=10 --format="get(tags)") )
echo "Please select factor service docker image tag to deploy for test:"
select SERVICE_TAG in ${SERVICE_TAGS[@]}
do
    if [[ ! -z "${SERVICE_TAG}" ]]; then
        echo "Deploying test factor-service ${SERVICE_TAG}..."
        break
    else
        echo "Invalid selection..."
    fi
done

gcloud --quiet config set project $K8S_PROJECT_ID
gcloud --quiet config set container/cluster $K8S_CLUSTER_NAME
gcloud --quiet config set compute/zone $COMPUTE_ZONE
gcloud --quiet container clusters get-credentials $K8S_CLUSTER_NAME

# Deploy the new service as "test" version
sed -e "s/\${SERVICE_VERSION}/${SERVICE_TAG}/" \
    -e "s/\${DB_SCHEMA}/${2}/" \
    -e "s/ factor-service/ factor-service-test"/ \
    k8s/service-${1}.yml | \
    kubectl apply -f -

# Wait for app test deployment to finish rolling out
kubectl rollout status deployment/factor-service-test-deployment

# Select tag for gateway docker image
API_TAGS=( $(gcloud container images list-tags gcr.io/${GCR_PROJECT_ID}/genome-almanac-api --limit=10 --format="get(tags)") )
echo "Please select gateway docker image tag to deploy for test:"
select API_TAG in ${API_TAGS[@]}
do
    if [[ ! -z "${API_TAG}" ]]; then
        echo "Deploying test genome-almanac-api ${API_TAG}..."
        break
    else
        echo "Invalid selection..."
    fi
done

# Deploy the gateway as "test" version
sed -e "s/\${SERVICE_VERSION}/${API_TAG}/" \
    -e "s/ genome-almanac-api/ genome-almanac-api-test/" \
    -e "s/factor-service/factor-service-test"/ \
    /tmp/gateway/k8s/${1}.yml | sed -n '/---/q;p' | \
    kubectl apply -f -

# Wait for app test deployment to finish rolling out
kubectl rollout status deployment/genome-almanac-api-test-deployment

echo "Test Gateway Deploy Successful!"

# Delete local copy of api project
echo "Cleaning up deployments..."
kubectl delete service/factor-service-test-service
kubectl delete deployment/factor-service-test-deployment
kubectl delete deployment/genome-almanac-api-test-deployment

echo "Cleaning up /tmp/gateway..."
rm -rf /tmp/gateway