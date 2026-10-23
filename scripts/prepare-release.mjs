import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readLocalReleaseContext, readReleaseContext } from './release-planner.mjs';

const requiredChecks = ['Branch policy', 'PostgreSQL auth and tenant integration', 'PostgreSQL schema upgrade and rollback integration', 'Quality checks', 'CodeQL', 'Dependency audit'];

export function buildReleaseManifest({ plan, targetCommit, repository, createdAt, checkEvidence }) {
  if (!plan?.release) throw new Error('There are no eligible changes to release.');
  if (!/^[a-f0-9]{40}$/.test(targetCommit)) throw new Error('Target commit must be a full 40-character SHA.');
  if (!repository || !/^[\w.-]+\/[\w.-]+$/.test(repository)) throw new Error('Repository must be owner/name.');
  const date = new Date(createdAt);
  if (!Number.isFinite(date.valueOf()) || date.toISOString() !== createdAt) throw new Error('createdAt must be a UTC ISO timestamp.');
  if (checkEvidence?.commit !== targetCommit) throw new Error('CI evidence must refer to the exact target commit.');
  if (checkEvidence?.runUrl !== `https://github.com/${repository}/actions/runs/${checkEvidence?.runId}` || !/^\d+$/.test(String(checkEvidence?.runId))) {
    throw new Error('CI evidence must include the GitHub Actions run URL and numeric run ID for this repository.');
  }
  const outcomes = checkEvidence?.outcomes;
  if (!outcomes || typeof outcomes !== 'object' || Array.isArray(outcomes)) throw new Error('CI evidence outcomes are required.');
  for (const name of requiredChecks) {
    if (outcomes[name] !== 'success') throw new Error(`Required check did not pass: ${name}`);
  }
  const changes = Object.fromEntries(Object.entries(plan.changes).map(([category, commits]) => [
    category,
    commits.map(({ hash, message }) => ({ commit: hash, subject: message.trim().split(/\r?\n/, 1)[0] })),
  ]));
  return {
    schemaVersion: 1,
    version: plan.version,
    tag: plan.tag,
    commit: targetCommit,
    createdAt,
    repository,
    previousTag: `v${plan.previousVersion}`,
    changes,
    observedChecks: { runId: String(checkEvidence.runId), runUrl: checkEvidence.runUrl, commit: targetCommit, outcomes },
  };
}

export function formatReleaseNotes(manifest) {
  const sections = [
    ['breaking', 'Breaking changes'],
    ['features', 'Features'],
    ['fixes', 'Fixes'],
    ['performance', 'Performance'],
  ];
  const lines = [`# ${manifest.tag}`, '', `Commit: ${manifest.commit}`, `Previous stable tag: ${manifest.previousTag}`, ''];
  for (const [key, title] of sections) {
    const entries = manifest.changes[key] ?? [];
    if (!entries.length) continue;
    lines.push(`## ${title}`, '');
    for (const entry of entries) lines.push(`- ${entry.subject} (${entry.commit.slice(0, 8)})`);
    lines.push('');
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

function parseArgs(args) {
  const values = {};
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    if (!['--checks-file', '--output-dir'].includes(key) || !args[index + 1] || args[index + 1].startsWith('--')) {
      throw new Error('Usage: pnpm release:prepare --checks-file <verified-run.json> [--output-dir .artifacts/releases]');
    }
    values[key] = args[++index];
  }
  if (!values['--checks-file']) throw new Error('A verified GitHub check record is required with --checks-file.');
  return values;
}

async function prepare() {
  const args = parseArgs(process.argv.slice(2));
  const releaseContext = process.env.RELEASE_TARGET_SHA
    ? readReleaseContext({ branch: 'main', head: process.env.RELEASE_TARGET_SHA, remoteMain: process.env.RELEASE_TARGET_SHA, fetchTags: true })
    : readLocalReleaseContext();
  const { targetCommit, previousTag, plan } = releaseContext;
  if (!plan.release) throw new Error('No eligible Conventional Commits since the previous stable tag.');
  const checkPath = resolve(args['--checks-file']);
  const evidence = JSON.parse(await readFile(checkPath, 'utf8'));
  const repository = 'bjo163/A-L-L-A-H';
  const manifest = buildReleaseManifest({ plan, targetCommit, repository, createdAt: new Date().toISOString(), checkEvidence: evidence });

  const outputRoot = resolve('.artifacts/releases');
  const outputDir = resolve(args['--output-dir'] ?? outputRoot);
  const rel = relative(outputRoot, outputDir);
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error('Release output must stay inside .artifacts/releases.');
  await mkdir(outputRoot, { recursive: true });
  const resolvedRoot = await realpath(outputRoot);
  await mkdir(outputDir, { recursive: true });
  const resolvedOutput = await realpath(outputDir);
  const resolvedRel = relative(resolvedRoot, resolvedOutput);
  if (resolvedRel === '..' || resolvedRel.startsWith(`..${sep}`) || isAbsolute(resolvedRel)) throw new Error('Release output resolves outside .artifacts/releases.');
  const destination = resolve(outputDir, plan.version);
  try { await stat(destination); throw new Error(`Release artifact directory already exists: ${destination}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }

  const staging = await mkdtemp(resolve(os.tmpdir(), 'eol-release-'));
  try {
    const folder = `A-L-L-A-H-${plan.version}`;
    const sourceTar = resolve(staging, 'source.tar');
    const tree = resolve(staging, 'tree');
    await mkdir(tree);
    execFileSync('git', ['archive', '--format=tar', `--prefix=${folder}/`, `--output=${sourceTar}`, targetCommit], { stdio: 'inherit' });
    execFileSync('tar', ['-xf', sourceTar, '-C', tree], { stdio: 'inherit' });
    const releaseRoot = resolve(tree, folder);
    const changelog = formatReleaseNotes(manifest);
    const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
    await writeFile(resolve(releaseRoot, 'release.json'), manifestText, 'utf8');
    await writeFile(resolve(releaseRoot, 'CHANGELOG.md'), changelog, 'utf8');

    const bundle = resolve(staging, 'bundle');
    await mkdir(bundle);
    await writeFile(resolve(bundle, 'release.json'), manifestText, 'utf8');
    await writeFile(resolve(bundle, 'CHANGELOG.md'), changelog, 'utf8');
    const archiveName = `${folder}.tar.gz`;
    const archivePath = resolve(bundle, archiveName);
    execFileSync('tar', ['-czf', archivePath, '-C', tree, folder], { stdio: 'inherit' });
    const checksums = [];
    for (const name of ['release.json', 'CHANGELOG.md', archiveName]) {
      const bytes = await readFile(resolve(bundle, name));
      checksums.push(`${createHash('sha256').update(bytes).digest('hex')}  ${name}`);
    }
    await writeFile(resolve(bundle, 'SHA256SUMS.txt'), `${checksums.join('\n')}\n`, 'utf8');
    await mkdir(outputDir, { recursive: true });
    await mkdir(destination);
    for (const name of ['release.json', 'CHANGELOG.md', archiveName, 'SHA256SUMS.txt']) {
      await writeFile(resolve(destination, name), await readFile(resolve(bundle, name)));
    }
    console.log(JSON.stringify({ status: 'prepared-local-only', previousTag, targetCommit, version: plan.version, output: destination, remoteWrites: false }, null, 2));
  } catch (error) {
    throw new Error(`${error.message}${await stat(destination).then(() => ' (inspect the local output directory for partial artifacts)').catch(() => '')}`);
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  prepare().catch((error) => { console.error(`Release preparation refused: ${error.message}`); process.exitCode = 1; });
}
