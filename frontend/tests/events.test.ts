import assert from "node:assert/strict";
import test from "node:test";
import { runErrorMessage, terminalEventStatus } from "../src/lib/events.ts";
import type { LiveSwarmEvent } from "../src/lib/types.ts";

test("run_error is terminal error and can never fall through to completion", () => {
  const event: LiveSwarmEvent = {
    type: "run_error",
    at: "2026-08-29T00:00:00.000Z",
    error: { code: "RUN_TIMEOUT", message: "Run timed out while pending" },
    report: {
      runId: "run-123",
      status: "error",
      isFinal: true,
      summary: "0 findings across 0 specialists",
      findingsByRole: {},
    },
  };

  assert.equal(terminalEventStatus(event), "error");
  assert.equal(runErrorMessage(event.error), "Run timed out while pending");
});

test("only completion events classify as successful", () => {
  const event: LiveSwarmEvent = {
    type: "run_complete",
    at: "2026-08-29T00:00:00.000Z",
    report: {
      runId: "run-123",
      status: "complete",
      isFinal: true,
      summary: "0 findings across 0 specialists",
      findingsByRole: {},
    },
  };

  assert.equal(terminalEventStatus(event), "complete");
});
