import assert from "node:assert/strict";
import test from "node:test";
import { responseErrorMessage } from "../src/lib/errors.ts";

test("extracts a useful backend JSON error", () => {
  assert.equal(
    responseErrorMessage('{"error":"taskDescription is required"}', "fallback"),
    "taskDescription is required"
  );
});

test("replaces generic and unreadable backend bodies with friendly copy", () => {
  assert.equal(responseErrorMessage('{"error":"not found"}', "History unavailable"), "History unavailable");
  assert.equal(responseErrorMessage("<html>proxy failure</html>", "Backend unavailable"), "Backend unavailable");
});
