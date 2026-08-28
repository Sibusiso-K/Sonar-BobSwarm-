import pytest
from app import calculate_average, validate_email, process_records, run_pipeline

def test_calculate_average_empty_list():
    """BUG-02 Fix: Should return 0.0 for empty list instead of raising ZeroDivisionError."""
    assert calculate_average([]) == 0.0

def test_calculate_average_valid_list():
    assert calculate_average([10, 20, 30]) == 20.0

def test_validate_email_valid_and_invalid():
    """BUG-05 Fix: Should strictly validate email structures."""
    assert validate_email("user@example.com") is True
    assert validate_email("") is False
    assert validate_email("invalid-email") is False
    assert validate_email("@domain.com") is False

def test_process_records_does_not_mutate():
    """BUG-04 Fix: Should return a new filtered list without mutating the original."""
    input_records = [
        {"email": "valid@test.com"},
        {"email": "invalid"},
        {"email": "another@test.com"}
    ]
    original_copy = list(input_records)
    
    result = process_records(input_records)
    
    # the assert input list remained unchanged
    assert input_records == original_copy
    # assert invalid records were filtered out
    assert len(result) == 2