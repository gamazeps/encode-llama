#!/bin/bash
set -e

cd "$(dirname "$(dirname "$0")")"
scripts/run-dependencies.sh
yarn install
yarn test
scripts/stop-dependencies.sh