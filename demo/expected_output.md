# BobSwarm Demo — Validation Targets

> **Owner:** Mmopiemang (Data / QA Engineer)
> **Purpose:** Source-backed acceptance criteria for the live demo. These are fixture
> targets, not pre-recorded or fabricated swarm results.

---

## Run protocol

1. Submit the task in the dashboard and copy the UUID it displays.
2. Switch to **BobSwarm Orchestrator** mode in Bob.
3. Paste the exact UUID as `runId` with the task prompt.
4. Bob dispatches the swarm; the dashboard visualises the MCP events. Dashboard
   submission itself does not invoke Bob.

For a full audit, four independent specialists run in the first parallel wave. The
`refactorer` runs in a second wave after receiving the completed `debugger` result.

---

## Debugger — required source-backed coverage

| ID | MCP severity | File / symbol | Verified target |
|---|---|---|---|
| BUG-01 | `breaks` | `app.py` / `enrich_record` → `run_pipeline` | An enrichment exception returns `None`; the caller appends it and later passes it to `transform_record`, producing a runtime failure. |
| BUG-02 | `warns` | `app.py` / `load_records` | `open(filepath, 'r')` is not managed by a context manager. |
| BUG-03 | `warns` | `app.py` / `save_results` | `open(output_path, 'w')` is not managed by a context manager. |

Each recorded finding must quote a literal source span actually returned by
`read_project_file`. A paraphrase is not valid evidence.

---

## Documenter — required output

- Public API reference covering `load_records`, `validate_email`, `process_records`,
  `enrich_record`, `calculate_average`, `transform_record`, `save_results`,
  `get_results_summary`, `run_pipeline`, `generate_id`, `format_timestamp`,
  `merge_dicts`, `chunk_list`, `flatten`, and `safe_get`.
- Module overview for `app.py`: load → validate → enrich → transform → save.
- Module overview for `utils.py`: identifiers, timestamps, and collection helpers.
- The `enrich_record` failure contract is documented accurately as returning `None`.

---

## Refactorer — required dependency-aware suggestions

The Refactorer result must explicitly acknowledge the completed Debugger context, then
recommend targeted changes without silently fixing the fixture:

1. **[HIGH]** Replace the unmanaged opens in `load_records` and `save_results` with
   context managers.
2. **[HIGH]** Make enrichment failure handling explicit so `run_pipeline` never passes
   `None` into `transform_record`.

---

## Onboarding — required guide structure

- **Setup:** Python 3.10+, install `requests`, and run
  `python app.py <input.json> <output.json> <api_url>`.
- **Architecture:** Linear pipeline — load → validate → enrich → transform → save.
- **Key files:** `app.py`, `utils.py`, `data/input.json`, and `test_app.py`.
- **Known gotcha:** external enrichment failure propagates `None` into the pipeline.

---

## Data Lineage — required map

| Step | Function | Type | Source-backed observation |
|---|---|---|---|
| DS-1 | `load_records` | Ingress — file read | Reads JSON records from the input path. |
| T-1 | `validate_email` | Transform — filter | Filters records by email shape. |
| T-2 | `enrich_record` | Transform — external call | Calls `/enrich`; failure returns `None`. |
| T-3 | `transform_record` | Transform — normalise | Normalises names and averages scores. |
| SK-1 | `save_results` | Egress — file write | Serialises transformed records as JSON. |
| SK-2 | `get_results_summary` | Egress — return value | Returns total count and average score. |

---

## Honest Bobalytics acceptance criteria

- **Specialists selected:** 5.
- **Execution shape:** 4 independent specialists in parallel, followed by the dependent
  Refactorer.
- **Required defect coverage:** BUG-01, BUG-02, and BUG-03 above.
- **Evidence quality:** every MCP finding quotes text present in its `affectedPath`.
- **Execution time:** report the measured dashboard duration; do not use a pre-filled value.
- **Finding count:** report the actual `finalize_run` count; do not use a pre-filled value.

Run the cross-platform fixture validation before the demo:

```text
python demo/validate_demo.py
```

After saving the JSON returned by `finalize_run`, validate the real swarm result:

```text
python demo/validate_demo.py --report path/to/final-report.json
```
