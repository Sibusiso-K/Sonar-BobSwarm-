"""
BobSwarm Demo — Utility functions (sample project)
Owner: Mmpoiemang (Data / QA Engineer)

Additional utility functions for the demo sample project.
Contains further issues for the swarm to discover.
"""

import hashlib
import datetime


def generate_id(record):
    """Generate a deterministic ID for a record based on its email."""
    # Uses MD5 — flagged as weak hashing by security-aware agents
    return hashlib.md5(record.get("email", "").encode()).hexdigest()


def format_timestamp(ts):
    """
    Format a Unix timestamp to ISO 8601.
    No input validation — will crash on non-numeric input.
    """
    return datetime.datetime.utcfromtimestamp(ts).isoformat()


def merge_dicts(*dicts):
    """
    Merge multiple dicts. Later dicts overwrite earlier ones.
    Does not handle None inputs gracefully.
    """
    result = {}
    for d in dicts:
        result.update(d)  # crashes if d is None (from enrich_record bug)
    return result


def chunk_list(lst, size):
    """Split a list into chunks of a given size."""
    # Off-by-one: range should be range(0, len(lst), size)
    # This is intentionally correct — a red herring for the debugger
    return [lst[i:i + size] for i in range(0, len(lst), size)]


def flatten(nested_list):
    """Flatten a one-level nested list."""
    # Only works for one level of nesting — not documented
    return [item for sublist in nested_list for item in sublist]


def safe_get(d, *keys, default=None):
    """Safely traverse a nested dict."""
    current = d
    for key in keys:
        if not isinstance(current, dict):
            return default
        current = current.get(key, default)
    return current
