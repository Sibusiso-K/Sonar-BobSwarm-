# Manual Investigation — Findings (timing comparison baseline)

Produced by reading `app.py`, `utils.py`, `data/input.json` directly (grep/read
only, no swarm tooling), matching the golden demo prompt's 5 requirements.

## 1. Bugs found
1. **HIGH** — `app.py:59` `enrich_record` returns `None` on any exception;
   `run_pipeline` (line 100) appends the `None` unconditionally; `transform_record`
   (line 102) then crashes calling `.get()` on `None`.
   Evidence: `# BUG 3: silently returns None — caller assumes a dict`
2. **HIGH** — `app.py:27` and `app.py:79`, `load_records`/`save_results` open
   files with bare `open()`, never closed.
   Evidence: `f = open(filepath, 'r')  # BUG 4: file never closed`

## 2. Public API documented
- `load_records(filepath)` — reads JSON records from a file
- `validate_email(email)` — regex check, rejects empty/malformed
- `process_records(records)` — filters to valid-email records, returns a new list
- `enrich_record(record, api_url)` — calls external API, returns enriched record or `None`
- `calculate_average(values)` — safe average, `0.0` on empty list
- `transform_record(record)` — title-cases name, computes average score
- `save_results(records, output_path)` — writes JSON
- `get_results_summary(records)` — returns `{total, avg_score}`
- `run_pipeline(input_path, output_path, enrich_api_url)` — entry point
- `utils.generate_id/format_timestamp/merge_dicts/chunk_list/flatten/safe_get`

## 3. Refactoring suggestions
1. **HIGH** — wrap both `open()` calls in `with` statements
2. **MEDIUM** — `enrich_record` should return a sentinel/raise instead of `None`

## 4. Data flow trace
`load_records` (file read) → `process_records` (email filter) →
`enrich_record` (external API, can return `None`) → `transform_record`
(crashes on `None`) → `save_results` (file write, leaked handle) →
`get_results_summary` (API response)

## 5. Onboarding guide
- Setup: Python 3.10+, `pip install requests`
- Run: `python app.py <input.json> <output.json> <api_url>`
- Architecture: linear pipeline, load → validate → enrich → transform → save
- Gotcha: `enrich_record` can return `None` on API failure — check before use
