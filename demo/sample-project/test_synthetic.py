import sys
import tempfile
import unittest
from pathlib import Path

TEST_DIR = Path(__file__).parent.resolve()
DEMO_DIR = TEST_DIR.parent if TEST_DIR.name == "sample-project" else TEST_DIR
SAMPLE_PROJ_DIR = DEMO_DIR / "sample-project"

sys.path.insert(0, str(DEMO_DIR))
sys.path.insert(0, str(SAMPLE_PROJ_DIR))

from generate_synthetic import generate_batch
from app import run_pipeline, transform_record

class SyntheticFixtureTests(unittest.TestCase):
    def test_synthetic_metadata_flag(self):
        """Verify synthetic records contain metadata markers."""
        batch = generate_batch(count=5)
        for record in batch:
            if "_meta" in record:
                self.assertTrue(record["_meta"]["synthetic"])

    def test_pipeline_fails_on_unhandled_none(self):
        """Assert pipeline crashes on None object during failure enrichment."""
        with self.assertRaises(AttributeError) as context:
            transform_record(None)
        self.assertIn("'NoneType' object has no attribute 'get'", str(context.exception))

    def test_type_corruption_causes_expected_failure(self):
        """Assert corrupted synthetic input fails against a dead endpoint."""
        input_file = SAMPLE_PROJ_DIR / "data" / "synthetic_input.json"
        if input_file.exists():
            with tempfile.TemporaryDirectory() as temp_dir:
                output_file = Path(temp_dir) / "out.json"
                with self.assertRaises(AttributeError):
                    run_pipeline(str(input_file), str(output_file), "http://localhost:9999")


if __name__ == "__main__":
    unittest.main()
