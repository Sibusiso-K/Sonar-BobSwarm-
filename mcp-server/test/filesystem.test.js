'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createPathGuard } = require('../tools/filesystem');

test('real-path guard accepts local paths and rejects lexical and symlink escapes', async (t) => {
  const allowedRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bobswarm-allowed-'));
  const outsideRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'bobswarm-outside-'));
  t.after(async () => {
    await fs.rm(allowedRoot, { recursive: true, force: true });
    await fs.rm(outsideRoot, { recursive: true, force: true });
  });

  const insideFile = path.join(allowedRoot, 'inside.txt');
  const outsideFile = path.join(outsideRoot, 'secret.txt');
  await fs.writeFile(insideFile, 'inside');
  await fs.writeFile(outsideFile, 'secret');

  const guard = createPathGuard(allowedRoot);
  assert.equal(await guard(insideFile), await fs.realpath(insideFile));
  await assert.rejects(guard(outsideFile), /escapes the allowed project root/);

  const escapeLink = path.join(allowedRoot, 'escape-link');
  await fs.symlink(outsideRoot, escapeLink, process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(
    guard(path.join(escapeLink, 'secret.txt')),
    /symlink or junction/
  );
  await assert.rejects(
    guard(path.join(escapeLink, 'new-report.md')),
    /symlink or junction/
  );

  const safeMissingPath = await guard(path.join(allowedRoot, 'reports', 'new.md'));
  assert.equal(safeMissingPath, path.join(await fs.realpath(allowedRoot), 'reports', 'new.md'));
});
