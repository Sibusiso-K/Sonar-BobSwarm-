# Farheen Manual Investigation — Submitted Findings

> **Evidence status:** submitted 2026-08-30. This is a manual investigation
> record, not Bob-usage evidence. The original DOCX is retained beside this
> transcription as `farheen-manual-investigation-report.docx`.
>
> **Do not use this timing as a competition performance claim yet.** It can
> become a valid blind baseline only after Farheen confirms the protocol in
> `TIMING_COMPARISON.md`.

## Reported defects

1. **Silent enrichment failure becomes a later crash.** `enrich_record()`
   catches an API failure and returns `None`; `run_pipeline()` appends that
   value and subsequently calls `transform_record()` on it. The latter calls
   `.get()`, producing `AttributeError: 'NoneType' object has no attribute
   'get'` rather than reporting the original API failure.
2. **File handles are not explicitly closed.** `load_records()` and
   `save_results()` use `open()` without a context manager. In repeated or
   long-running use this can leave file descriptors open.

## Correct red-herring assessment

The `chunk_list()` comment suggests an off-by-one error, but the
implementation correctly chunks the input. The comment should not be treated
as a defect.

## API and flow summary

Farheen reported this flow: load JSON records, filter invalid emails, enrich
each record using the external API, transform the enriched records, save the
result, and summarise it. She also noted that the helpers in `utils.py` are
not imported by `app.py`.

One wording correction from review: `validate_email()` performs a basic
regular-expression check; it does **not** verify that an email address is
real or deliverable.

## Safe refactoring direction

- Use `with open(...)` for both JSON file operations.
- Replace the ambiguous `None` error path with an explicit, observable
  failure policy.
- Choose and document one pipeline policy for failed enrichments: bounded
  retry, fail-fast, or quarantine/dead-letter reporting. Do not silently drop
  failed records merely to avoid the crash.

## Submitted timing

| Start | End | Elapsed |
|---|---|---|
| 2026-08-30 02:55:00 | 2026-08-30 04:40:09 | 1:45:09 (6,309 seconds) |

The submitted report includes code screenshots and a terminal traceback that
demonstrate the `NoneType` failure. The elapsed time is retained verbatim from
the submitted report.

## Required declaration before scorecard use

Farheen must confirm, in writing, that she had not read this fixture before
the timer started; used no Bob, BobSwarm, MCP tooling, or other AI assistance;
started timing before opening the fixture; completed the same five-deliverable
golden prompt; and stopped timing only after writing the full report. Until
then, this is a promising candidate baseline, not verified comparative evidence.
