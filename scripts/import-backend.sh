#!/bin/bash
# Creates GitHub issues on the backend repo from issues-backend.json.
# You do not need to own the repo: any account with permission to open issues works.
# Use: gh auth login (same GitHub user that was invited as collaborator / has org access).
# If the org uses SAML SSO: gh auth refresh -h github.com -s read:org
# Create milestones + labels on that repo first. Override repo: SUNBIRD_BACKEND_REPO=owner/name ./import-backend.sh
REPO="${SUNBIRD_BACKEND_REPO:-zainaitriq/sunbird.core.backend}"
export SUNBIRD_BACKEND_REPO="$REPO"
echo ""
echo ""
echo "=== Creating backend issues on ${REPO} ==="

if ! gh repo view "$REPO" &>/dev/null; then
  echo ""
  echo "Could not read ${REPO} with the GitHub CLI. Typical fixes:"
  echo "  1) gh auth login   — use the account that has access to this repo (not necessarily the owner)."
  echo "  2) Confirm the slug: gh repo view OWNER/REPO"
  echo "  3) Organization SSO: gh auth refresh -h github.com -s read:org"
  echo ""
  exit 1
fi

node <<'NODE'
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repo = process.env.SUNBIRD_BACKEND_REPO;
if (!repo) {
  console.error('Missing SUNBIRD_BACKEND_REPO');
  process.exit(1);
}
const tmpFile = path.join(process.cwd(), '.tmp_issue_body_backend.md');

const issues = JSON.parse(fs.readFileSync('issues-backend.json', 'utf8'));

function runGhIssueCreate(issue) {
  const args = [
    'issue',
    'create',
    '--repo',
    repo,
    '--title',
    issue.title,
    '--body-file',
    tmpFile,
    ...issue.labels.flatMap((label) => ['--label', label]),
    '--milestone',
    issue.milestone,
  ];
  return spawnSync('gh', args, { stdio: 'inherit', windowsHide: true });
}

for (const issue of issues) {
  console.log(`Creating: ${issue.title}`);
  fs.writeFileSync(tmpFile, issue.body, 'utf8');

  const result = runGhIssueCreate(issue);
  if (result.error) {
    console.error(`Failed: ${issue.title} (${result.error.message})`);
  } else if (result.status !== 0) {
    console.error(`Failed: ${issue.title} (exit ${result.status})`);
  }
}

try {
  fs.unlinkSync(tmpFile);
} catch (_) {
  /* ignore */
}
NODE

echo ""
echo "=== DONE ==="


