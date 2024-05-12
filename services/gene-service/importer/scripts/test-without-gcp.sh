#!/bin/bash
set -e

# cd to project root directory
cd "$(dirname "$(dirname "$0")")"

scripts/run-dependencies.sh
SKIP_GCP_TEST=T ./gradlew clean test -i
scripts/stop-dependencies.sh
