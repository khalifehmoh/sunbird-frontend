#!/bin/bash

REPO="khalifehmoh/sunbird-frontend"
echo ""
echo ""
echo "=== Creating Issues ==="

node <<'NODE'
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repo = 'khalifehmoh/sunbird-frontend';
const tmpFile = path.join(process.cwd(), '.tmp_issue_body.md');

const issues = JSON.parse(fs.readFileSync('issues.json', 'utf8'));

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
