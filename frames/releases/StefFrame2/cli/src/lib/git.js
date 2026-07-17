// Helpers git portables (git CLI via child_process).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export function isRepo(cwd) { return fs.existsSync(path.join(cwd, '.git')); }

// Execute git ; renvoie { ok, out, err }.
export function run(cwd, args) {
  try {
    const out = execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { ok: true, out: (out || '').trim(), err: '' };
  } catch (e) {
    return { ok: false, out: (e.stdout || '').toString().trim(), err: (e.stderr || '').toString().trim() };
  }
}

// Sortie stdout (vide si erreur).
export function out(cwd, args) { return run(cwd, args).out; }

export function initRepoMain(cwd) {
  run(cwd, ['init']);
  run(cwd, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
}

export function hasChanges(cwd) { return out(cwd, ['status', '--porcelain']) !== ''; }
export function currentBranch(cwd) { return out(cwd, ['rev-parse', '--abbrev-ref', 'HEAD']) || 'main'; }
export function hasRemoteOrigin(cwd) { return out(cwd, ['remote']).split(/\r?\n/).includes('origin'); }
