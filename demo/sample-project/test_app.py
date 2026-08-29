"""Dependency-light regression tests for the demo fixture's corrected helpers."""

import hashlib
import sys
import types
import unittest


# These tests do not make HTTP calls. A tiny fallback keeps the fixture tests
# runnable with the Python standard library when requests is not installed.
try:
    import requests  # noqa: F401
except ModuleNotFoundError:
    requests_stub = types.ModuleType("requests")
    requests_stub.get = lambda *_args, **_kwargs: None
    sys.modules["requests"] = requests_stub

from app import calculate_average, process_records, validate_email
from utils import generate_id, merge_dicts


class SampleProjectRegressionTests(unittest.TestCase):
    def test_calculate_average_empty_list(self):
        self.assertEqual(calculate_average([]), 0.0)

    def test_calculate_average_valid_list(self):
        self.assertEqual(calculate_average([10, 20, 30]), 20.0)

    def test_validate_email_valid_and_invalid(self):
        self.assertTrue(validate_email("user@example.com"))
        self.assertFalse(validate_email(""))
        self.assertFalse(validate_email("invalid-email"))
        self.assertFalse(validate_email("@domain.com"))

    def test_process_records_does_not_mutate(self):
        input_records = [
            {"email": "valid@test.com"},
            {"email": "invalid"},
            {"email": "another@test.com"},
        ]
        original_copy = list(input_records)

        result = process_records(input_records)

        self.assertEqual(input_records, original_copy)
        self.assertEqual(len(result), 2)

    def test_generate_id_uses_sha256_deterministically(self):
        record = {"email": "user@example.com"}
        expected = hashlib.sha256(record["email"].encode("utf-8")).hexdigest()
        self.assertEqual(generate_id(record), expected)
        self.assertEqual(len(generate_id(record)), 64)

    def test_merge_dicts_skips_none(self):
        self.assertEqual(merge_dicts({"a": 1}, None, {"b": 2}), {"a": 1, "b": 2})


if __name__ == "__main__":
    unittest.main()
