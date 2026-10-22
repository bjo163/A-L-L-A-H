import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextVersion, formatChanges } from '../release.mjs';

test('each stable release advances from the highest stable version', () => {
  assert.equal(nextVersion('0.2.0', [], 'main', 1), '0.2.1');
  assert.equal(nextVersion('0.2.0', ['v0.2.9', 'v0.2.10', 'v0.3.0-dev.8'], 'main', 9), '0.2.11');
});
test('dev builds are unique prereleases of the next stable patch', () => {
  assert.equal(nextVersion('0.2.0', ['v0.2.1'], 'dev', 42), '0.2.2-dev.42');
  assert.equal(nextVersion('1.0.0', ['v0.9.8'], 'dev', 43), '1.0.1-dev.43');
});
test('rejects unsupported branches and invalid version context', () => {
  assert.throws(() => nextVersion('0.2.0', [], 'feature', 1));
  assert.throws(() => nextVersion('0.2.0-dev.1', [], 'dev', 1));
  assert.throws(() => nextVersion('0.2.0', [], 'main', 'undefined'));
});
test('changelog retains ordinary commits and categorizes conventional commits', () => {
  const notes = formatChanges('1234567890\tfeat(api): add endpoint\nabcdef1234\tfix: repair test\nfedcba9876\tUpdate docs');
  assert.match(notes, /## Features\n\n- feat\(api\): add endpoint \(12345678\)/);
  assert.match(notes, /## Fixes/);
  assert.match(notes, /## Other changes\n\n- Update docs/);
  assert.equal(formatChanges(''), 'No additional commits.');
});
