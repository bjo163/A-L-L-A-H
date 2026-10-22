import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const run = (command, args, options = {}) => execFileSync(command, args, { encoding: 'utf8', ...options }).trim();
const git = (...args) => run('git', args);

export function nextVersion(base, tags, branch, runNumber) {
  if (!['dev', 'main'].includes(branch)) throw new Error('Only dev and main can release');
  if (!/^\d+\.\d+\.\d+$/.test(base)) throw new Error('Root version must be a stable semver');
  if (!/^[1-9]\d*$/.test(String(runNumber))) throw new Error('Invalid workflow run number');
  const stable = [base, ...tags.filter(t => /^v\d+\.\d+\.\d+$/.test(t)).map(t => t.slice(1))];
  stable.sort((a, b) => {
    const x = a.split('.').map(Number), y = b.split('.').map(Number);
    return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
  });
  const [major, minor, patch] = stable.at(-1).split('.').map(Number);
  const next = `${major}.${minor}.${patch + 1}`;
  return branch === 'dev' ? `${next}-dev.${runNumber}` : next;
}

export function formatChanges(log) {
  const groups = new Map([['Features', []], ['Fixes', []], ['Other changes', []]]);
  for (const line of log.split('\n').filter(Boolean)) {
    const [sha, ...parts] = line.split('\t');
    const subject = parts.join(' ').replace(/[<>]/g, '').replace(/\r/g, '');
    const group = /^feat(?:\(|:|!)/.test(subject) ? 'Features' : /^fix(?:\(|:|!)/.test(subject) ? 'Fixes' : 'Other changes';
    groups.get(group).push(`- ${subject} (${sha.slice(0, 8)})`);
  }
  return [...groups].filter(([, items]) => items.length).map(([title, items]) => `## ${title}\n\n${items.join('\n')}`).join('\n\n') || 'No additional commits.';
}

export function findExistingRelease(releases, { branch, runId, sha }) {
  return releases.find(release => release.body?.includes(`<!-- workflow-run:${runId} -->`)) ??
    (branch === 'main' ? releases.find(release =>
      /^v\d+\.\d+\.\d+$/.test(release.tag_name) &&
      release.body?.includes(`\nSource: ${sha}\n`)) : undefined);
}

export function publish() {
  const { GITHUB_REPOSITORY: repository, GITHUB_REF_NAME: branch, GITHUB_SHA: sha,
    GITHUB_RUN_ID: runId, GITHUB_RUN_NUMBER: runNumber, GITHUB_STEP_SUMMARY: summary } = process.env;
  if (!repository || !sha || !runId || !process.env.GH_TOKEN) throw new Error('GitHub Actions release context required');
  if (git('rev-parse', 'HEAD') !== sha) throw new Error('Checkout does not match tested source');
  const gh = (...args) => run('gh', [...args, '--repo', repository]);
  // Run identity survives retries, even after a tag was created but asset upload failed.
  const pages = JSON.parse(run('gh', ['api', '--paginate', '--slurp', `repos/${repository}/releases?per_page=100`]));
  const marker = `<!-- workflow-run:${runId} -->`;
  const existing = findExistingRelease(pages.flat(), { branch, runId, sha });
  if (existing && !existing.draft && branch === 'main') {
    console.log(`Main source ${sha} already published as ${existing.tag_name}`);
    return;
  }
  const tags = git('tag', '--list').split('\n').filter(Boolean);
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const version = existing ? existing.tag_name.slice(1) : nextVersion(pkg.version, tags, branch, runNumber);
  const tag = `v${version}`;
  // Only ancestors may be the changelog baseline: queued jobs can finish out of order.
  const ancestors = git('tag', '--merged', sha, '--sort=-version:refname').split('\n');
  const previous = ancestors.find(t => t !== tag && (branch === 'main' ? /^v\d+\.\d+\.\d+$/.test(t) : /^v\d+\.\d+\.\d+-dev\.\d+$/.test(t)));
  const changes = formatChanges(git('log', '--format=%H%x09%s', previous ? `${previous}..${sha}` : sha));
  const notes = `# ${tag}\n\nChannel: ${branch}\nSource: ${sha}\n\n${changes}\n\n${previous ? `[Compare changes](https://github.com/${repository}/compare/${previous}...${tag})\n\n` : ''}${marker}\n`;
  const output = resolve('.artifacts/release');
  mkdirSync(output, { recursive: true });
  const changelog = join(output, 'CHANGELOG.md');
  const metadata = join(output, 'release.json');
  writeFileSync(changelog, existing?.body || notes);
  writeFileSync(metadata, JSON.stringify({ version, channel: branch, source: sha, runId, previous: previous || null }, null, 2) + '\n');
  const temp = mkdtempSync(join(tmpdir(), 'allah-release-'));
  const archive = join(output, `A-L-L-A-H-${version}.tar.gz`);
  try {
    const sourceTar = join(temp, 'source.tar');
    const source = join(temp, 'source');
    mkdirSync(source);
    git('archive', '--format=tar', `--output=${sourceTar}`, sha);
    run('tar', ['-xf', sourceTar, '-C', source]);
    pkg.version = version;
    writeFileSync(join(source, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
    writeFileSync(join(source, 'CHANGELOG.md'), existing?.body || notes);
    writeFileSync(join(source, 'VERSION'), version + '\n');
    writeFileSync(join(source, 'release.json'), readFileSync(metadata));
    run('tar', ['-czf', archive, '-C', source, '.']);
    if (!existing) {
      // Draft first: failed uploads are repairable on rerun, and incomplete releases stay hidden.
      gh('release', 'create', tag, '--target', sha, '--title', tag, '--notes-file', changelog, '--draft', ...(branch === 'dev' ? ['--prerelease'] : []));
    }
    gh('release', 'upload', tag, changelog, metadata, archive, '--clobber');
    gh('release', 'edit', tag, '--draft=false', ...(branch === 'main' ? ['--latest'] : []));
    if (summary) writeFileSync(summary, `Released [${tag}](https://github.com/${repository}/releases/tag/${tag}) from ${sha}.\n`, { flag: 'a' });
    console.log(`Published ${tag}`);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) publish();
