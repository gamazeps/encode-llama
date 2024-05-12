# Genes GraphQL Service

## Building
* Run `yarn install` to install dependencies.

## Testing
You must have Node.js and docker-compose installed. 
* `scripts/test.sh` to spin up dependences and run automated tests.
* `yarn test` to run tests without spinning up dependencies.
* `scripts/run-dependencies.sh` to stand up Postgres with dummy data. `scripts/test.sh` runs this for you.
* `scripts/stop-dependencies.sh` to stop bring down the server.