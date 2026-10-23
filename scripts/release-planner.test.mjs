import test from 'node:test';
import assert from 'node:assert/strict';
import { compareStableVersions, parseStableVersion, planRelease, planReleaseForCommit, readReleaseContext, selectLatestStableTag } from './release-planner.mjs';
import { buildReleaseManifest, formatReleaseNotes } from './prepare-release.mjs';

const commit = (message, parents = ['parent']) => ({ message, parents });

test('parses stable SemVer and rejects prereleases or malformed numbers', () => {
  assert.deepEqual(parseStableVersion('1.2.3'), [1, 2, 3]);
  assert.throws(() => parseStableVersion('v1.2.3'));
  assert.throws(() => parseStableVersion('1.02.3'));
  assert.throws(() => parseStableVersion('1.2.3-rc.1'));
  assert.throws(() => parseStableVersion('999999999999999999999.0.0'));
});

test('compares stable versions numerically', () => {
  assert.equal(compareStableVersions('0.10.0', '0.9.9'), 1);
  assert.equal(compareStableVersions('1.0.0', '1.0.0'), 0);
  assert.equal(compareStableVersions('2.0.0', '2.1.0'), -1);
});

test('selects the latest stable tag and ignores development prereleases', () => {
  assert.equal(selectLatestStableTag(['v0.2.5', 'v0.2.6-dev.386', 'v0.2.4']), 'v0.2.5');
  assert.equal(selectLatestStableTag(['v0.2.6-dev.386']), null);
});

test('calculates patch and minor releases from fixes and features', () => {
  assert.equal(planRelease('1.4.2', [commit('fix(api): guard empty response')]).version, '1.4.3');
  assert.equal(planRelease('1.4.2', [commit('feat(web): add route')]).version, '1.5.0');
  assert.equal(planRelease('1.4.2', [commit('feat(web): add route'), commit('fix(api): guard empty response')]).version, '1.5.0');
});

test('applies conservative pre-1.0 rules and breaking changes', () => {
  assert.equal(planRelease('0.2.5', [commit('feat(api): add endpoint')]).version, '0.2.6');
  assert.equal(planRelease('0.2.5', [commit('feat(api)!: replace contract')]).version, '0.3.0');
  assert.equal(planRelease('1.2.3', [commit('fix(api): change contract\n\nBREAKING CHANGE: clients must update')]).version, '2.0.0');
});

test('docs-only histories do not release and merge commits are ignored', () => {
  const result = planRelease('0.2.5', [commit('docs: correct wording'), commit('Merge pull request #4 from dev')]);
  assert.equal(result.release, false);
  assert.equal(result.tag, null);
  assert.equal(planRelease('0.2.5', [commit('feat(api): feature', ['a', 'b'])]).release, false);
});

test('ambiguous messages and duplicate tags stop planning', () => {
  assert.throws(() => planRelease('0.2.5', [commit('add a feature')]), /Ambiguous commit message/);
  assert.throws(() => planRelease('0.2.5', [commit('fix(api): patch')], ['v0.2.6']), /already exists/);
});

test('release planning is main-only and requires a current full SHA and stable baseline', () => {
  assert.throws(() => planReleaseForCommit({ branch: 'dev', targetCommit: 'a'.repeat(40), previousTag: 'v1.2.3', commits: [], existingTags: [] }), /requires main/);
  assert.throws(() => planReleaseForCommit({ branch: 'main', targetCommit: 'abc', previousTag: 'v1.2.3', commits: [], existingTags: [] }), /full commit SHA/);
  assert.throws(() => planReleaseForCommit({ branch: 'main', targetCommit: 'a'.repeat(40), previousTag: null, commits: [], existingTags: [] }), /baseline/);
  assert.throws(() => readReleaseContext({ branch: 'main', head: 'a'.repeat(40), remoteMain: 'b'.repeat(40), allTags: ['v1.2.3'] }), /match.*origin\/main/);
});

test('builds a versioned manifest from evidence for the exact candidate commit', () => {
  const targetCommit = 'a'.repeat(40);
  const plan = planRelease('0.2.5', [{ ...commit('fix(api): reject invalid tenant'), hash: 'd'.repeat(40) }]);
  const manifest = buildReleaseManifest({
    plan,
    targetCommit,
    repository: 'bjo163/A-L-L-A-H',
    createdAt: '2026-10-23T03:00:00.000Z',
    checkEvidence: {
      runId: 123456,
      runUrl: 'https://github.com/bjo163/A-L-L-A-H/actions/runs/123456',
      commit: targetCommit,
      outcomes: { 'Branch policy': 'success', 'PostgreSQL auth and tenant integration': 'success', 'PostgreSQL schema upgrade and rollback integration': 'success', 'Quality checks': 'success', CodeQL: 'success', 'Dependency audit': 'success' },
    },
  });
  assert.deepEqual({ schemaVersion: manifest.schemaVersion, version: manifest.version, tag: manifest.tag, commit: manifest.commit, previousTag: manifest.previousTag }, {
    schemaVersion: 1, version: '0.2.6', tag: 'v0.2.6', commit: targetCommit, previousTag: 'v0.2.5',
  });
  assert.equal(manifest.observedChecks.outcomes['Quality checks'], 'success');
  assert.match(formatReleaseNotes(manifest), /reject invalid tenant/);
});

test('release manifest refuses failed checks, mismatched SHA, and non-UTC timestamps', () => {
  const targetCommit = 'b'.repeat(40);
  const plan = planRelease('1.0.0', [{ ...commit('feat(api): add bounded export'), hash: 'e'.repeat(40) }]);
  const evidence = { runId: 9, runUrl: 'https://github.com/bjo163/A-L-L-A-H/actions/runs/9', commit: targetCommit, outcomes: { 'Branch policy': 'success', 'PostgreSQL auth and tenant integration': 'success', 'PostgreSQL schema upgrade and rollback integration': 'success', 'Quality checks': 'success', CodeQL: 'success' } };
  const input = { plan, targetCommit, repository: 'bjo163/A-L-L-A-H', createdAt: '2026-10-23T03:00:00.000Z', checkEvidence: evidence };
  assert.throws(() => buildReleaseManifest({ ...input, checkEvidence: { ...evidence, outcomes: { ...evidence.outcomes, 'Quality checks': 'failure' } } }), /Required check did not pass/);
  assert.throws(() => buildReleaseManifest({ ...input, checkEvidence: { ...evidence, commit: 'c'.repeat(40) } }), /exact target commit/);
  assert.throws(() => buildReleaseManifest({ ...input, createdAt: '2026-10-23T03:00:00+07:00' }), /UTC ISO timestamp/);
});

test('release manifest requires every promotion CI integration check', () => {
  const targetCommit = 'f'.repeat(40);
  const plan = planRelease('1.0.0', [{ ...commit('fix(api): prevent duplicate poll'), hash: '1'.repeat(40) }]);
  const outcomes = {
    'Branch policy': 'success',
    'PostgreSQL auth and tenant integration': 'success',
    'PostgreSQL schema upgrade and rollback integration': 'success',
    'Quality checks': 'success',
    CodeQL: 'success',
    'Dependency audit': 'success',
  };
  const input = {
    plan, targetCommit, repository: 'bjo163/A-L-L-A-H', createdAt: '2026-10-23T03:00:00.000Z',
    checkEvidence: { runId: 42, runUrl: 'https://github.com/bjo163/A-L-L-A-H/actions/runs/42', commit: targetCommit, outcomes },
  };
  assert.equal(buildReleaseManifest(input).observedChecks.outcomes['PostgreSQL auth and tenant integration'], 'success');
  assert.throws(() => buildReleaseManifest({ ...input, checkEvidence: { ...input.checkEvidence, outcomes: { ...outcomes, 'PostgreSQL auth and tenant integration': 'failure' } } }), /Required check did not pass/);
  assert.throws(() => buildReleaseManifest({ ...input, checkEvidence: { ...input.checkEvidence, outcomes: { ...outcomes, 'Dependency audit': 'failure' } } }), /Required check did not pass/);
});
