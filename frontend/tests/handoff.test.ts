import assert from "node:assert/strict";
import test from "node:test";
import { buildBobHandoffPrompt, buildFindingFollowUpPrompt } from "../src/lib/handoff.ts";
import type { Finding, Run } from "../src/lib/types.ts";

test("Bob handoff prompt preserves the exact existing run context", () => {
  const run: Run = {
    id: "run-123-full-id",
    taskDescription: "Audit checkout retries",
    taskType: "full_audit",
    repoRef: "acme/checkout",
    status: "pending",
    createdAt: "2026-08-29T00:00:00.000Z",
  };

  const prompt = buildBobHandoffPrompt(run);

  assert.match(prompt, /Do not create a new run/);
  assert.match(prompt, /Run ID: run-123-full-id/);
  assert.match(prompt, /Repository: acme\/checkout/);
  assert.match(prompt, /Task type: full_audit/);
  assert.match(prompt, /Task: Audit checkout retries/);
  assert.match(prompt, /finalize it only after every specialist reports back/);
});

test("finding follow-up prompt references the real run and finding, and stays outside the run lifecycle", () => {
  const run: Run = {
    id: "run-123-full-id",
    taskDescription: "Audit checkout retries",
    taskType: "full_audit",
    repoRef: "acme/checkout",
    status: "complete",
    createdAt: "2026-08-29T00:00:00.000Z",
  };
  const finding: Finding = {
    id: "finding-1",
    subagentRole: "debugger",
    severity: "breaks",
    affectedPath: "app.py",
    targetSymbol: "enrich_record",
    evidence: "except Exception:\n    return None",
  };

  const prompt = buildFindingFollowUpPrompt(run, finding);

  assert.match(prompt, /run-123-full-id/);
  assert.match(prompt, /acme\/checkout/);
  assert.match(prompt, /Role: debugger/);
  assert.match(prompt, /Severity: breaks/);
  assert.match(prompt, /File: app\.py/);
  assert.match(prompt, /Symbol: enrich_record/);
  assert.match(prompt, /except Exception/);
  assert.match(prompt, /Do not call record_finding, record_progress, or finalize_run/);
});
