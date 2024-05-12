#!/bin/bash
set -e

# Migrate using locally installed flyway. Used in production docker container.
# Migrations are handled by run-dependencies.sh with docker-compose for tests.

flyway -url=jdbc:postgresql://localhost:5432/$POSTGRES_DB -user=$POSTGRES_USER -password=$POSTGRES_PASS -schemas=$POSTGRES_USER_SCHEMA migrate