#!/bin/bash
# Create kubernetes secrets necessary to run the importer and service
# arg1: environment, ie staging.
set -e

# cd to project root directory
cd "$(dirname "$(dirname "$0")")"

# import common stuff
source scripts/lib/common.sh

# Exit if two args not given
if [[ -z "$1" ]]; then
    echo "At least one argument required.";
    exit;
fi

# Check that jq is installed
if ! [ -x "$(command -v git)" ]; then
  echo 'Error: jq is not installed. Please install jq to continue.' >&2
  exit 1
fi

# Run the environment shell script to set environment specific variables
source scripts/lib/${1}.env.sh

# Point kubectl at kubernetes cluster for given environment
gcloud --quiet config set project $K8S_PROJECT_ID
gcloud --quiet config set container/cluster $K8S_CLUSTER_NAME
gcloud --quiet config set compute/zone $COMPUTE_ZONE
gcloud --quiet container clusters get-credentials $K8S_CLUSTER_NAME

# Pull devops project containing secrets data
rm -rf /tmp/devops
git clone https://github.com/weng-lab/devops.git /tmp/devops

# Create snps-db-credentials secret if it does not exist
if ! kubectl get secret snps-db-credentials &>/dev/null ; then
    echo "Creating snps-db-credentials secret..."
    DB_USERNAME=$(jq -r ".snps_db_username" /tmp/devops/staging-db-credentials/snps-db.json)
    DB_PASSWORD=$(jq -r ".snps_db_password" /tmp/devops/staging-db-credentials/snps-db.json)
    kubectl create secret generic snps-db-credentials \
        --from-literal=username=$DB_USERNAME \
        --from-literal=password=$DB_PASSWORD
else
    echo "Secret snps-db-credentials already found. Skipping creation..."
fi

# Create secret for service account key if it doesn't exist
if ! kubectl get secret service-account-key &>/dev/null ; then
    echo "Creating service-account-key secret..."
    kubectl create secret generic service-account-key \
        --from-file=/tmp/devops/gcp-keys/${1}-service-account.json
else
    echo "Secret service-account-key already found. Skipping creation..."
fi

# Delete local copy of devops project
rm -rf /tmp/devops