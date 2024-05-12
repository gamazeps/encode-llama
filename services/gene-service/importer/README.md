# Gene Importer
The gene importer project builds an executable jar that you can use to import the following things from the following sources

- Genes
    - Local Files
    - Gencode File URLs
- Metadata, Gene Quantification, and Transcript Quantification Data
    - Local Files
    - Encode API and Encode AWS hosted files

## Building
- Run `scripts/build.sh`

## Testing
No matter what approach you use to test, you'll need to run `scripts/run-dependencies.sh` first. This spins up a postgres server available on port 5555. To shut this down run `scripts/stop-dependencies.sh`.

### Scalability tests
Some Tests are used to import large amounts of data from real external data sources. Since we do not want these tests to run automatically with CI, they should be `@Disabled`. These should be run individually.

### Intellij
To run these tests in intellij, simply navigate to the file, click the green arrow on the class for the Test, and select run or debug from the pop-up menu.

Debugging this way is especially useful. This will also allow you to more easily run individual tests.

### Command line
This approach is more meant for automated tooling, but you can run these tests with either of the following
- `./gradlew test` - Run the test with dependencies already running.
- `scripts/test.sh` - Runs dependencies, runs the tests, stops dependencies.