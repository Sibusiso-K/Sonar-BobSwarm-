# BobSwarm Demo — Expected Swarm Output

> **Owner:** Mmopiemang (Data / QA Engineer)
> **Purpose:** Reference document for validating the live demo. The BobSwarm output should match or exceed these findings.

---

## 🐛 Debugger — Expected Findings

| # | Severity | File | Line(s) | Issue |
|---|---|---|---|---|
| 1 | HIGH | `app.py` | 61-63 | `enrich_record` silently returns `None` on failure; caller appends `None` to list |
| 2 | HIGH | `app.py` | 30, 82 | File handles opened but never closed — resource leak |

---

## 📝 Documenter — Expected Output

- Docstrings added to all undocumented public functions in `app.py` and `utils.py`
- Public API Reference covering: `load_records`, `validate_email`, `process_records`, `enrich_record`, `calculate_average`, `transform_record`, `save_results`, `get_results_summary`, `run_pipeline`, `generate_id`, `format_timestamp`, `merge_dicts`, `chunk_list`, `flatten`, `safe_get`
- Module overview for `app.py`: data pipeline entry point handling load → validate → enrich → transform → save
- Module overview for `utils.py`: shared utility functions for ID generation, formatting, and collection manipulation

---

## 🔧 Refactorer — Expected Suggestions

1. **[HIGH]** Replace bare `open()` calls with `with` statement context managers in `load_records` and `save_results`
2. **[MEDIUM]** Extract `enrich_record` error handling to return a sentinel value (e.g. raise, or log + skip) instead of silent `None`

---

## 🧭 Onboarding — Expected Guide Structure

- **Setup:** Python 3.10+, `pip install requests`, run `python app.py <input.json> <output.json> <api_url>`
- **Architecture:** Linear data pipeline — load → validate → enrich (external API) → transform → save
- **Key files:** `app.py` (pipeline), `utils.py` (helpers), `data/input.json` (sample data)
- **Gotcha #1:** `enrich_record` can return `None` — check before using the result

---

## 🔍 Data Lineage — Expected Map

| Step | Function | Type | Notes |
|---|---|---|---|
| **DS-1** | `load_records` | Ingress — File read | JSON file, no schema validation |
| **T-1** | `validate_email` | Transform — Filter | Removes invalid emails |
| **T-2** | `enrich_record` | Transform — External API call | Enriches with external data; silent failure |
| **T-3** | `transform_record` | Transform — Normalise | Title-cases name, calculates average score |
| **SK-1** | `save_results` | Egress — File write | JSON output; resource leak |
| **SK-2** | `get_results_summary` | Egress — API response | Returns total + avg_score |

**Data quality risks:**
1. `enrich_record` failure produces `None` in the record list — silent data corruption and downstream crashes

## 📊 Bobalytics — Swarm Execution Metrics
* **Subagents Dispatched:** 5 parallel agents (Debugger, Documenter, Refactorer, Onboarding, Lineage)
* **Total Execution Time:** ~12.4 seconds
* **Total Findings:** 3 Bugs, 2 Refactorings, 1 Public API Spec, 1 Data Lineage Map
* **Bugs by Severity:** 2 High
