"""
BobSwarm Demo — Utility functions (sample project)
Owner: Mmopiemang (Data / QA Engineer)

Additional utility functions for the demo sample project.
Contains further issues for the swarm to discover.
"""

import hashlib
import datetime


def generate_id(record):
    email = record.get("email", "").encode("utf-8")
    return hashlib.sha256(email).hexdigest()


def format_timestamp(ts):
    return datetime.datetime.fromtimestamp(float(ts), tz=datetime.timezone.utc).isoformat()


def merge_dicts(*dicts):
    result = {}
    for d in dicts:
        if d is not None:
            result.update(d)
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
