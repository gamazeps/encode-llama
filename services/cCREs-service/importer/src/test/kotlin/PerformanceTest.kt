import import.*
import io.kotlintest.*
import io.kotlintest.specs.StringSpec
import source.*



class PerformanceTest : StringSpec() {

    override fun beforeTest(description: Description) {
        executeAdminUpdates("DROP SCHEMA IF EXISTS $TEST_SCHEMA CASCADE", "CREATE SCHEMA $TEST_SCHEMA")
    }

    override fun afterTest(description: Description, result: TestResult) {
        executeAdminUpdates("DROP SCHEMA $TEST_SCHEMA CASCADE")
    }

    init {
      
    }
}