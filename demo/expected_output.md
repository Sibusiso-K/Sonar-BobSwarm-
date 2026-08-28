# BobSwarm Demo — Expected Swarm Output

> **Owner:** Mmopiemang (Data / QA Engineer)
> **Purpose:** Reference document for validating the live demo. The BobSwarm output should match or exceed these findings.

---

## 🐛 Debugger — Expected Findings

| # | Severity | File | Line(s) | Issue |
|---|---|---|---|---|
| 1 | CRITICAL | `app.py` | 62 | `calculate_average([])` → `ZeroDivisionError` when `scores` is empty |
| 2 | HIGH | `app.py` | 46–47 | `process_records` mutates the caller's input list via `records.remove()` |
| 3 | HIGH | `app.py` | 57 | `enrich_record` silently returns `None` on failure; caller appends `None` to list |
| 4 | HIGH | `app.py` | 29, 75 | File handles opened but never closed — resource leak |
| 5 | MEDIUM | `app.py` | 35 | `validate_email` regex `[^@]*@[^@]*` matches empty string `""` |
| 6 | MEDIUM | `utils.py` | 32 | `merge_dicts` crashes on `None` input (consequence of Bug 3) |
| 7 | LOW | `utils.py` | 16 | `generate_id` uses MD5 — weak hashing algorithm |

---

## 📝 Documenter — Expected Output

- Docstrings added to all undocumented public functions in `app.py` and `utils.py`
- Public API Reference covering: `load_records`, `validate_email`, `process_records`, `enrich_record`, `calculate_average`, `transform_record`, `save_results`, `get_results_summary`, `run_pipeline`, `generate_id`, `format_timestamp`, `merge_dicts`, `chunk_list`, `flatten`, `safe_get`
- Module overview for `app.py`: data pipeline entry point handling load → validate → enrich → transform → save
- Module overview for `utils.py`: shared utility functions for ID generation, formatting, and collection manipulation

---

## 🔧 Refactorer — Expected Suggestions

1. **[HIGH]** Replace bare `open()` calls with `with` statement context managers in `load_records` and `save_results`
2. **[HIGH]** Rewrite `process_records` to build a new list instead of mutating the input
3. **[MEDIUM]** Extract `enrich_record` error handling to return a sentinel value (e.g. raise, or log + skip) instead of silent `None`
4. **[MEDIUM]** Guard `calculate_average` with an early return for empty lists
5. **[LOW]** Replace MD5 in `generate_id` with `hashlib.sha256`

---

## 🧭 Onboarding — Expected Guide Structure

- **Setup:** Python 3.10+, `pip install requests`, run `python app.py <input.json> <output.json> <api_url>`
- **Architecture:** Linear data pipeline — load → validate → enrich (external API) → transform → save
- **Key files:** `app.py` (pipeline), `utils.py` (helpers), `data/input.json` (sample data)
- **Gotcha #1:** `process_records` mutates its input — always pass a copy
- **Gotcha #2:** `enrich_record` can return `None` — check before using the result
- **Gotcha #3:** Empty `scores` arrays will cause `calculate_average` to crash

---

## 🔍 Data Lineage — Expected Map

| Step | Function | Type | Notes |
|---|---|---|---|
| **DS-1** | `load_records` | Ingress — File read | JSON file, no schema validation |
| **T-1** | `validate_email` | Transform — Filter | Removes invalid emails; regex bug allows empty strings |
| **T-2** | `enrich_record` | Transform — External API call | Enriches with external data; silent failure |
| **T-3** | `transform_record` | Transform — Normalise | Title-cases name, calculates average score |
| **SK-1** | `save_results` | Egress — File write | JSON output; resource leak |
| **SK-2** | `get_results_summary` | Egress — API response | Returns total + avg_score |

**Data quality risks:**
1. `validate_email` accepts empty string — invalid records enter the pipeline
2. `enrich_record` failure produces `None` in the record list — silent data corruption
3. `calculate_average` on empty `scores` crashes the pipeline — data loss for edge-case records
