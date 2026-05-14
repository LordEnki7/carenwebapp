#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

function safeExec(cmd) {
  try { return execSync(cmd, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); }
  catch { return ''; }
}

// Read the commit hash directly from .git files — no git binary required.
// Works in Docker even when only .git/HEAD + .git/refs + .git/packed-refs are
// present in the build context (full .git history is excluded via .dockerignore).
function readCommitFromGitFiles() {
  try {
    const headFile = path.join(ROOT, '.git', 'HEAD');
    if (!fs.existsSync(headFile)) return null;

    const head = fs.readFileSync(headFile, 'utf8').trim();

    if (head.startsWith('ref: ')) {
      const refPath = head.slice(5).trim(); // e.g. "refs/heads/main"

      // Try individual ref file first (standard for fresh clones)
      const refFile = path.join(ROOT, '.git', refPath);
      if (fs.existsSync(refFile)) {
        return fs.readFileSync(refFile, 'utf8').trim();
      }

      // Fall back to packed-refs (used after git gc or on some hosts)
      const packedRefs = path.join(ROOT, '.git', 'packed-refs');
      if (fs.existsSync(packedRefs)) {
        for (const line of fs.readFileSync(packedRefs, 'utf8').split('\n')) {
          if (line.startsWith('#')) continue;
          const parts = line.trim().split(' ');
          if (parts.length === 2 && parts[1] === refPath) {
            return parts[0];
          }
        }
      }
      return null;
    }

    // Detached HEAD — HEAD itself is the commit hash
    if (/^[0-9a-f]{40}$/i.test(head)) return head;
  } catch (_) {
    return null;
  }
  return null;
}

function readBranchFromGitFiles() {
  try {
    const headFile = path.join(ROOT, '.git', 'HEAD');
    if (!fs.existsSync(headFile)) return null;
    const head = fs.readFileSync(headFile, 'utf8').trim();
    if (head.startsWith('ref: refs/heads/')) return head.slice('ref: refs/heads/'.length).trim();
  } catch (_) {}
  return null;
}

// Resolution order:
//  1. git command (works in Replit dev environment where full .git exists)
//  2. Direct .git file parsing (works in Docker with partial .git context)
//  3. Environment variable (last-resort manual override)
const commit =
  safeExec('git rev-parse HEAD') ||
  readCommitFromGitFiles() ||
  process.env.CAREN_GIT_COMMIT ||
  'unknown';

const branch =
  safeExec('git rev-parse --abbrev-ref HEAD') ||
  readBranchFromGitFiles() ||
  process.env.CAREN_GIT_BRANCH ||
  'unknown';

const shortCommit = commit.substring(0, 7);
const buildTime = new Date().toISOString();
const info = { commit, shortCommit, branch, buildTime };

const outDirs = [
  path.join(ROOT, 'client', 'public'),
  path.join(ROOT, 'dist', 'public'),
];

for (const dir of outDirs) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'build-info.json'), JSON.stringify(info, null, 2));
}

console.log(`[build-info] commit=${shortCommit} branch=${branch} time=${buildTime}`);
