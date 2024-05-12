#!/bin/bash
GCR_PROJECT_ID=devenv-215523
SERVICE_DOCKER_IMAGE_NAME=genes-service
IMPORTER_DOCKER_IMAGE_NAME=genes-importer
KUBE_DEPLOYMENT_NAME=genes-service-deployment
KUBE_DEPLOYMENT_CONTAINER_NAME=genes-service

# When running in ci, we will set environment variables with base64 encoded versions of service key files.
# This will log you in with the given account.
# When running locally log in manually with your own account.
if [[ "${GCR_SERVICE_KEY}" ]]; then
    echo $GCR_SERVICE_KEY | base64 --decode > ${HOME}/gcr_service_key.json
    gcloud auth activate-service-account --key-file ${HOME}/gcr_service_key.json
    docker login -u _json_key --password-stdin https://gcr.io < ${HOME}/gcr_service_key.json
fi
