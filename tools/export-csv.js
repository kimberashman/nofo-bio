#!/usr/bin/env node
// Extracts the OPPORTUNITIES array from index.html and writes entries.csv
// Usage: node tools/export-csv.js
//
// Re-run any time you add or update entries. The output is meant for
// human verification (open in Excel / Google Sheets, fill in the
// "verified" / "notes" columns as you click through each URL).

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const m = html.match(/const OPPORTUNITIES = (\[[\s\S]*?\n\]);/);
if (!m) {
  console.error("Couldn't find OPPORTUNITIES array in index.html");
  process.exit(1);
}

// The array literal contains only data, no external refs — safe to eval.
const OPPORTUNITIES = eval(m[1]);

const cols = ['title', 'funder', 'url', 'kind', 'deadline', 'deadlineNote', 'award', 'tags', 'verified', 'notes'];

const esc = v => {
  if (v === undefined || v === null) v = '';
  if (Array.isArray(v)) v = v.join('; ');
  return `"${String(v).replace(/"/g, '""')}"`;
};

const rows = [cols.join(',')];
for (const o of OPPORTUNITIES) {
  rows.push(cols.map(c => {
    if (c === 'verified' || c === 'notes') return esc('');
    if (c === 'kind') return esc(o.kind || 'program');
    return esc(o[c]);
  }).join(','));
}

const outPath = path.join(root, 'entries.csv');
fs.writeFileSync(outPath, rows.join('\n') + '\n');
console.log(`Wrote ${OPPORTUNITIES.length} entries to ${path.relative(root, outPath)}`);
