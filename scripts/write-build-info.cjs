#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function safeExec(cmd) {
  try { return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); }
  catch { return ''; }
}

const commit = safeExec('git rev-parse HEAD') || process.env.CAREN_GIT_COMMIT || process.env.GIT_COMMIT || 'unknown';
const shortCommit = commit.substring(0, 7);
const branch = safeExec('git rev-parse --abbrev-ref HEAD') || process.env.CAREN_GIT_BRANCH || 'unknown';
const buildTime = new Date().toISOString();

const info = { commit, shortCommit, branch, buildTime };

const outDirs = [
  path.join(__dirname, '..', 'client', 'public'),
  path.join(__dirname, '..', 'dist', 'public'),
];

for (const dir of outDirs) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'build-info.json'), JSON.stringify(info, null, 2));
}

console.log(`[build-info] commit=${shortCommit} branch=${branch} time=${buildTime}`);
