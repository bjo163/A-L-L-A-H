import { execFileSync } from 'node:child_process';

// Run once with an authenticated GitHub CLI account that administers this repo.
// --dry-run prints the exact changes without accessing or changing GitHub.
const repository = 'bjo163/A-L-L-A-H';
const common = {
  enforce_admins: true,
  restrictions: null,
  required_linear_history: false,
  allow_force_pushes: false,
  allow_deletions: false,
  required_conversation_resolution: true,
};
const changes = [
  ['PATCH', `repos/${repository}`, {
    default_branch: 'main', allow_merge_commit: true,
    allow_squash_merge: false, allow_rebase_merge: false,
    delete_branch_on_merge: false,
  }],
  ['PUT', `repos/${repository}/branches/main/protection`, {
    ...common,
    required_status_checks: { strict: false, contexts: ['Branch policy', 'Quality checks', 'CodeQL'] },
    required_pull_request_reviews: { required_approving_review_count: 0, dismiss_stale_reviews: true },
  }],
  ['PUT', `repos/${repository}/branches/dev/protection`, {
    ...common, required_status_checks: null, required_pull_request_reviews: null,
  }],
  ['PUT', `repos/${repository}/vulnerability-alerts`, null],
];
if (process.argv.includes('--dry-run')) {
  console.log(JSON.stringify(changes, null, 2));
} else {
  execFileSync('gh', ['auth', 'status'], { stdio: 'inherit' });
  for (const [method, endpoint, body] of changes) {
    execFileSync('gh', ['api', '--method', method, endpoint, ...(body ? ['--input', '-'] : [])], {
      input: body ? JSON.stringify(body) : undefined,
      stdio: ['pipe', 'ignore', 'inherit'],
    });
    console.log(`${method} ${endpoint}: configured`);
  }
  // Verify persisted settings, not just HTTP success.
  for (const branch of ['main', 'dev']) {
    const protection = JSON.parse(execFileSync('gh', ['api', `repos/${repository}/branches/${branch}/protection`], { encoding: 'utf8' }));
    if (!protection.enforce_admins.enabled || protection.allow_force_pushes.enabled || protection.allow_deletions.enabled) {
      throw new Error(`Unexpected protection state on ${branch}`);
    }
  }
  console.log('Repository settings applied and verified.');
}
