import assert from "node:assert/strict";
import test from "node:test";
import { buildBobHandoffPrompt } from "../src/lib/handoff.ts";
import type { Run } from "../src/lib/types.ts";

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
