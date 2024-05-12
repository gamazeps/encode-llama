#!/bin/bash
set -e

cd "$(dirname "$(dirname "$0")")"
source scripts/setup-environment.sh

trap 'scripts/stop-dependencies.sh' ERR EXIT

scripts/run-dependencies.sh
yarn install
yarn test "$@"
