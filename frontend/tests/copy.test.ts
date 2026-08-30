import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("hero copy describes the dependency-aware four-plus-one workflow", async () => {
  const source = await readFile(
    new URL("../src/components/hero/Hero.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /Four independent specialists start/);
  assert.match(source, /Refactorer follows the Debugger/);
  assert.doesNotMatch(source, /five agents live/i);
  assert.doesNotMatch(source, /read your repo in parallel/i);
  assert.doesNotMatch(source, /unified report ,/i);
});
