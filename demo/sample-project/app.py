"""
BobSwarm Demo — Sample Project (Intentionally Broken)
Owner: Mmopiemang (Data / QA Engineer)

This is the intentionally flawed codebase used in the BobSwarm demo.
The BobSwarm orchestrator will dispatch subagents to:
  1. Find all the bugs (Debugger)
  2. Document the public API (Documenter)
  3. Suggest refactoring improvements (Refactorer)
  4. Produce an onboarding guide (Onboarding)
  5. Map the data flow (Data Lineage)

Known issues planted for the demo (DO NOT FIX MANUALLY):
  - Bug 1: Division by zero in calculate_average when list is empty
  - Bug 2: process_records mutates its input list (side effect)
  - Bug 3: enrich_record silently returns None on API failure
  - Bug 4: save_results opens file but never closes it (resource leak)
  - Bug 5: validate_email uses a regex that accepts empty strings
"""

import json
import re
import requests


# ── Data ingress ──────────────────────────────────────────────────────────────

def load_records(filepath):
    """Load records from a JSON file."""
    f = open(filepath, 'r')  # BUG 4: file never closed
    data = json.load(f)
    return data


def validate_email(email):
    # Fixed: require at least one character on both sides of @
    pattern = r"[^@\s]+@[^@\s]+"
    return re.match(pattern, email) is not None


# ── Transformations ───────────────────────────────────────────────────────────

def process_records(records):
    """
    Process a list of records and return validated ones.
    Returns a new list — does not mutate the input.
    """
    return [r for r in records if validate_email(r.get('email', ''))]


def enrich_record(record, api_url):
    """
    Enrich a record with data from an external API.
    Returns the enriched record, or None on failure.
    """
    try:
        response = requests.get(f"{api_url}/enrich", params={"id": record["id"]}, timeout=5)
        response.raise_for_status()
        record["enriched"] = response.json()
        return record
    except Exception:
        # BUG 3: silently returns None — caller assumes a dict
        return None


def calculate_average(values):
    # Fixed: return 0.0 for empty list instead of ZeroDivisionError
    return sum(values) / len(values) if values else 0.0


def transform_record(record):
    """Apply business logic transformations to a single record."""
    record["name"] = record.get("name", "").strip().title()
    record["score"] = calculate_average(record.get("scores", []))
    return record


# ── Data egress ───────────────────────────────────────────────────────────────

def save_results(records, output_path):
    """Write processed records to a JSON output file."""
    f = open(output_path, 'w')  # BUG 4 (second instance): file never closed
    json.dump(records, f, indent=2)


def get_results_summary(records):
    """Return a summary dict for API response."""
    return {
        "total": len(records),
        "avg_score": calculate_average([r["score"] for r in records]),  # BUG 1 again if no records
    }


# ── Entry point ───────────────────────────────────────────────────────────────

def run_pipeline(input_path, output_path, enrich_api_url):
    records = load_records(input_path)
    records = process_records(records)

    enriched = []
    for record in records:
        result = enrich_record(record, enrich_api_url)
        enriched.append(result)  # BUG 3 consequence: None appended to list

    transformed = [transform_record(r) for r in enriched]  # crashes on None
    save_results(transformed, output_path)
    return get_results_summary(transformed)


if __name__ == "__main__":
    import sys
    if len(sys.argv) != 4:
        print("Usage: python app.py <input.json> <output.json> <enrich_api_url>")
        sys.exit(1)
    summary = run_pipeline(sys.argv[1], sys.argv[2], sys.argv[3])
    print(json.dumps(summary, indent=2))
