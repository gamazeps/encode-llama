#!/bin/bash
set -e

cd "$(dirname "$(dirname "$0")")"
export POSTGRES_USER=postgres
export POSTGRES_PASS=postgres
export POSTGRES_HOST=localhost
export POSTGRES_DB=postgres
export POSTGRES_PORT=5555
export POSTGRES_SCHEMA=factor_test

scripts/run-dependencies.sh
yarn install
yarn test
scripts/stop-dependencies.sh