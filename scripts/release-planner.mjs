import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function parseStableVersion(value) {
  const match = semverPattern.exec(value);
  if (!match) throw new Error(`Expected stable SemVer X.Y.Z, received: ${value}`);
  const version = match.slice(1).map(Number);
  if (version.some((component) => !Number.isSafeInteger(component))) {
    throw new Error(`Version components exceed the supported safe integer range: ${value}`);
  }
  return version;
}

export function compareStableVersions(left, right) {
  const a = parseStableVersion(left);
  const b = parseStableVersion(right);
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return Math.sign(a[index] - b[index]);
  }
  return 0;
}

export function selectLatestStableTag(tags) {
  const stable = tags.filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag));
  if (stable.length === 0) return null;
  return stable.sort((a, b) => compareStableVersions(b.slice(1), a.slice(1)))[0];
}

export function planRelease(previousVersion, commits, existingTags = []) {
  const [major, minor, patch] = parseStableVersion(previousVersion);
  let bump = null;
  const changes = { breaking: [], features: [], fixes: [], performance: [] };

  for (const commit of commits) {
    if (commit.parents?.length > 1) continue;
    const message = String(commit.message ?? '').trim();
    if (/^Merge (pull request|branch)\b/i.test(message)) continue;
    const [subject, ...bodyLines] = message.split(/\r?\n/);
    const match = /^([a-z][a-z0-9-]*)(?:\(([^()\n]+)\))?(!)?: (.+)$/.exec(subject);
    if (!match) throw new Error(`Ambiguous commit message; use Conventional Commits: ${subject}`);

    const [, type, , bang] = match;
    const breaking = Boolean(bang) || bodyLines.some((line) => /^BREAKING(?: CHANGE|-CHANGE):\s*\S/i.test(line.trim()));
    if (breaking) {
      bump = major === 0 ? Math.max(bump ?? 0, 2) : 3;
      changes.breaking.push(commit);
    } else if (type === 'feat') {
      bump = Math.max(bump ?? 0, major === 0 ? 1 : 2);
      changes.features.push(commit);
    } else if (type === 'fix') {
      bump = Math.max(bump ?? 0, 1);
      changes.fixes.push(commit);
    } else if (type === 'perf') {
      bump = Math.max(bump ?? 0, 1);
      changes.performance.push(commit);
    }
  }

  if (bump === null) return { release: false, previousVersion, version: null, tag: null, changes };
  const next = [major, minor, patch];
  if (bump === 3) { next[0] += 1; next[1] = 0; next[2] = 0; }
  else if (bump === 2) { next[1] += 1; next[2] = 0; }
  else next[2] += 1;
  const version = next.join('.');
  const tag = `v${version}`;
  if (compareStableVersions(version, previousVersion) <= 0) throw new Error('Calculated version must be greater than the previous stable version.');
  if (existingTags.includes(tag)) throw new Error(`Version tag already exists: ${tag}`);
  return { release: true, previousVersion, version, tag, changes };
}

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

export function readReleaseContext({ branch = git(['branch', '--show-current']), head = git(['rev-parse', 'HEAD']), remoteMain = git(['rev-parse', 'origin/main']), allTags, fetchTags = false } = {}) {
  if (branch !== 'main') throw new Error(`Release planning requires the main branch; current branch is ${branch || '(detached)'}.`);
  if (head !== remoteMain) throw new Error('Release planning requires HEAD to match the locally fetched origin/main ref.');
  allTags ??= git(['tag', '--list', 'v*']).split(/\r?\n/).filter(Boolean);
  if (fetchTags) {
    execFileSync('git', ['fetch', '--tags', 'origin'], { stdio: 'inherit' });
    allTags = git(['tag', '--list', 'v*']).split(/\r?\n/).filter(Boolean);
  }
  const latestTag = selectLatestStableTag(allTags);
  if (!latestTag) throw new Error('No stable tag exists; an owner must select and document the initial release baseline.');
  const latestCommit = git(['rev-parse', `${latestTag}^{commit}`]);
  let previousTag = latestTag;
  let releaseTagExists = false;
  let previousCommit = latestCommit;
  if (latestCommit === head) {
    const olderStableTags = allTags
      .filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag) && tag !== latestTag)
      .filter((tag) => git(['rev-parse', `${tag}^{commit}`]) !== head)
      .sort((a, b) => compareStableVersions(b.slice(1), a.slice(1)));
    previousTag = olderStableTags.find((tag) => git(['merge-base', git(['rev-parse', `${tag}^{commit}`]), head]) === git(['rev-parse', `${tag}^{commit}`]));
    if (!previousTag) throw new Error(`Stable tag ${latestTag} points to main, but no earlier stable baseline exists.`);
    previousCommit = git(['rev-parse', `${previousTag}^{commit}`]);
    releaseTagExists = true;
  }
  if (git(['merge-base', previousCommit, head]) !== previousCommit) {
    throw new Error(`Latest stable tag ${previousTag} does not point to an ancestor of main.`);
  }
  const hashes = git(['rev-list', '--no-merges', `${previousTag}..HEAD`]).split(/\r?\n/).filter(Boolean);
  const commits = hashes.map((hash) => ({
    hash,
    message: git(['show', '-s', '--format=%B', hash]),
    parents: git(['rev-list', '--parents', '-n', '1', hash]).split(' ').slice(1),
  }));
  const tagsForPlanning = releaseTagExists ? allTags.filter((tag) => tag !== latestTag) : allTags;
  const plan = planRelease(previousTag.slice(1), commits, tagsForPlanning);
  if (releaseTagExists && plan.tag !== latestTag) throw new Error(`Existing tag ${latestTag} does not match the release candidate ${plan.tag}.`);
  return { branch, targetCommit: head, previousTag, plan, releaseTagExists };
}

export function readLocalReleaseContext() {
  return readReleaseContext();
}

export function planReleaseForCommit({ branch, targetCommit, previousTag, commits, existingTags }) {
  if (branch !== 'main') throw new Error(`Release planning requires main; received ${branch || '(detached)'}.`);
  if (!/^[a-f0-9]{40}$/.test(targetCommit)) throw new Error('Release target must be a full commit SHA.');
  if (!previousTag) throw new Error('No stable release baseline is configured.');
  if (!/^v\d+\.\d+\.\d+$/.test(previousTag)) throw new Error(`Invalid stable release baseline: ${previousTag}`);
  return { branch, targetCommit, previousTag, plan: planRelease(previousTag.slice(1), commits, existingTags) };
}

function main() {
  if (!process.argv.includes('--dry-run')) {
    throw new Error('This planner is read-only. Run with --dry-run; it never creates tags or GitHub Releases.');
  }
  const { targetCommit, previousTag, plan } = readLocalReleaseContext();
  console.log(JSON.stringify({
    mode: 'dry-run',
    targetCommit,
    previousTag,
    ...plan,
    requiredChecks: 'NOT QUERIED; verify successful GitHub checks for this exact commit before any release.',
    remoteWrites: false,
  }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { main(); }
  catch (error) { console.error(`Release plan refused: ${error.message}`); process.exitCode = 1; }
}
