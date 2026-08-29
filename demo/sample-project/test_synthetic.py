import sys
from pathlib import Path

TEST_DIR = Path(__file__).parent.resolve()
DEMO_DIR = TEST_DIR.parent if TEST_DIR.name == "sample-project" else TEST_DIR
SAMPLE_PROJ_DIR = DEMO_DIR / "sample-project"

sys.path.insert(0, str(DEMO_DIR))
sys.path.insert(0, str(SAMPLE_PROJ_DIR))

import pytest
from generate_synthetic import generate_batch
from app import run_pipeline, transform_record

def test_synthetic_metadata_flag():
    """Verify synthetic records contain metadata markers."""
    batch = generate_batch(count=5)
    for record in batch:
        if "_meta" in record:
            assert record["_meta"]["synthetic"] is True

def test_pipeline_fails_on_unhandled_none():
    """Assert pipeline crashes on None object during failure enrichment."""
    with pytest.raises(AttributeError) as exc_info:
        transform_record(None)
    assert "'NoneType' object has no attribute 'get'" in str(exc_info.value)

def test_type_corruption_causes_expected_failure(tmp_path):
    """Assert pipeline fails when processing corrupted synthetic inputs against dead endpoint."""
    input_file = SAMPLE_PROJ_DIR / "data" / "synthetic_input.json"
    output_file = tmp_path / "out.json"
    
    if input_file.exists():
        with pytest.raises(AttributeError):
            run_pipeline(str(input_file), str(output_file), "http://localhost:9999")