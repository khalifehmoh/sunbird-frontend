/**
 * One-off / local: reads github-issues-backend.html and writes issues-backend.json
 * Usage: node scripts/extract-backend-issues-from-html.mjs [path-to-html]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const defaultHtml = path.join(process.env.USERPROFILE || '', 'Downloads', 'github-issues-backend.html');
const htmlPath = process.argv[2] || defaultHtml;

const html = fs.readFileSync(htmlPath, 'utf8');
const start = html.indexOf('const issues = [');
const close = html.indexOf('];\n\nconst sprintConfig');
if (start === -1 || close === -1) {
  console.error('Could not find issues array in HTML');
  process.exit(1);
}
const arrSrc = html.slice(start + 'const issues = '.length, close + 1).trim();

// eslint-disable-next-line no-new-func
const issues = new Function(`return ${arrSrc}`)();

const out = issues.map((i) => ({
  title: i.title,
  milestone: i.sprint,
  labels: i.labels,
  body: i.assignee ? `**Planned assignee:** ${i.assignee}\n\n${i.body}` : i.body,
}));

const outPath = path.join(root, 'issues-backend.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`Wrote ${out.length} issues to ${outPath}`);
