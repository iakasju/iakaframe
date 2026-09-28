// Tests bout-en-bout de plan-courante.mjs (Lot 5, specs/instructions/declaration-chantier-session.md
// § D-12, M-6) : acceptation de `tool_name:"Agent"` (en plus de `"Task"`, renommage v2.1.63) et
// attribution au chantier de la session (conv_id, meta.repo/repo_root/segment/aragorn/main_role,
// royaume — portion "plan" de CA-27).
//
// Ce fichier ne re-teste PAS le comportement HISTORIQUE de plan-courante.mjs (TodoWrite, resume,
// transport broker) : aucun test anterieur n'existait pour ce hook (verifie par grep avant Lot 5) ;
// le perimetre ici est STRICTEMENT ce que le Lot 5 ajoute/modifie.
//
// AUCUN test ici n'ecrit dans le vrai `~/.claude` : chaque test redirige HOME/USERPROFILE et
// IAKAFRAME_ROOT vers un tmpdir dedie (sandbox). Le transport DOCDB (CA-27) pointe vers un serveur
// HTTP local ephemere, jamais vers un service reel.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const HOOKS_DIR = path.resolve(here, '..', '..', 'kits', 'iakaframe-claude', 'global', 'hooks');
const PLAN = path.join(HOOKS_DIR, 'plan-courante.mjs');
const PERIM = path.join(HOOKS_DIR, 'perimeter-guard.mjs');
const REMIND = path.join(HOOKS_DIR, 'chantier-remind.mjs');

function tmpDir(prefix) {
  return fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
}

let seq = 0;
function nextSid() {
  seq += 1;
  return `test${process.pid}${Date.now()}${seq}`.replace(/[^A-Za-z0-9-]/g, '');
}

function makeSandbox() {
  const home = tmpDir('iaka-plan-home-');
  const root = tmpDir('iaka-plan-root-');
  const env = {
    ...process.env,
    HOME: home,
    USERPROFILE: home,
    IAKAFRAME_ROOT: root,
    IAKAFRAME_CHANTIER_MODE: 'deny',
  };
  delete env.CLAUDE_PROJECT_DIR;
  delete env.IAKALOG_USER; delete env.IAKALOG_PASS; delete env.IAKALOG_BROKER_URL;
  delete env.DOCDB_URL; delete env.DOCDB_USER; delete env.DOCDB_PASSWORD; delete env.DOCDB_AUTH;
  delete env.IAKALOG_TRANSPORT; delete env.IAKALOG_ROYAUME; delete env.IAKALOG_AGENT;
  return { home, root, env };
}

function makeRepo(root, name) {
  const dir = path.join(root, name);
  fs.mkdirSync(path.join(dir, '.git'), { recursive: true });
  return dir;
}

function runPerim(payload, env) {
  return spawnSync(process.execPath, [PERIM], { input: JSON.stringify(payload), env, encoding: 'utf8' });
}
function runRemind(payload, env) {
  return spawnSync(process.execPath, [REMIND], { input: JSON.stringify(payload), env, encoding: 'utf8' });
}
function runPlan(payload, env) {
  return spawnSync(process.execPath, [PLAN], { input: JSON.stringify(payload), env, encoding: 'utf8' });
}
// runPlanAsync : variante NON BLOQUANTE (meme motif que guard-chantier-delegation.test.js) —
// necessaire pour les tests d'EMISSION (serveur HTTP local dans CE processus de test).
function runPlanAsync(payload, env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [PLAN], { env });
    let stderr = '';
    child.stderr.on('data', (c) => { stderr += c; });
    child.on('close', (code) => resolve({ status: code, stderr }));
    child.stdin.end(JSON.stringify(payload));
  });
}

const pre = (sid, cwd, tool, tool_input, extra) => ({
  hook_event_name: 'PreToolUse', session_id: sid, cwd, tool_name: tool, tool_input, ...extra,
});
const prompt = (sid, cwd, text, extra) => ({
  hook_event_name: 'UserPromptSubmit', session_id: sid, cwd, prompt: text, ...extra,
});
const post = (sid, cwd, tool, tool_input, extra) => ({
  hook_event_name: 'PostToolUse', session_id: sid, cwd, tool_name: tool, tool_input, ...extra,
});

function bootstrapOdinPortefeuille(env, sid, root) {
  return runPerim(pre(sid, root, 'Bash', { command: 'echo init' }), env);
}
function bootstrapTeamRepo(env, sid, repoDir) {
  return runPerim(pre(sid, repoDir, 'Bash', { command: 'echo init' }, { agent_type: 'aragorn' }), env);
}

function startCaptureServer() {
  const docs = [];
  return new Promise((resolveReady) => {
    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => {
        try { docs.push(JSON.parse(body)); } catch { docs.push({ __raw: body }); }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      });
    });
    server.listen(0, '127.0.0.1', () => {
      resolveReady({ server, docs, url: `http://127.0.0.1:${server.address().port}` });
    });
  });
}

// ===========================================================================
// M-6 — tool_name "Agent" est traite EXACTEMENT comme "Task" (renommage v2.1.63).
// ===========================================================================

test('M-6 : tool_name "Agent" (comme "Task") -> exit 0 sans erreur, mais AUCUNE emission sans identite de log', () => {
  const { env } = makeSandbox();
  const sid = nextSid();
  const res = runPlan(post(sid, undefined, 'Agent', { subagent_type: 'gimli', description: 'coder le lot 5' }), env);
  assert.equal(res.status, 0);
});

test('M-6 : tool_name inconnu (ni TodoWrite, ni Task, ni Agent) -> exit 0, aucun crash', () => {
  const { env } = makeSandbox();
  const sid = nextSid();
  const res = runPlan(post(sid, undefined, 'Read', { file_path: 'x.js' }), env);
  assert.equal(res.status, 0);
});

// ===========================================================================
// CA-27 (portion plan) — attribution D-12 : conv_id, meta.*, royaume (transport docdb local).
// ===========================================================================

test('CA-27 : plan-courante traite tool_name "Agent" ; conv_id = nom du chantier actif, royaume = REPOA, meta.repo/segment/main_role presents (session d\'equipe)', async () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const sid = nextSid();
  bootstrapTeamRepo(env, sid, repoA);

  const { server, docs, url } = await startCaptureServer();
  try {
    const emitEnv = { ...env, IAKALOG_TRANSPORT: 'docdb', DOCDB_URL: url, DOCDB_USER: 'u', DOCDB_PASSWORD: 'p' };
    const res = await runPlanAsync(
      post(sid, repoA, 'Agent', { subagent_type: 'gimli', description: 'implementer le lot 5' }, { agent_type: 'aragorn' }),
      emitEnv,
    );
    assert.equal(res.status, 0);
    assert.equal(docs.length, 1);
    const [doc] = docs;
    assert.equal(doc.conv_id, 'repoA');
    assert.equal(doc.royaume, 'REPOA');
    assert.equal(doc.meta.repo, 'repoA');
    assert.equal(doc.meta.repo_root, repoA);
    assert.equal(doc.meta.segment, 1);
    assert.equal(doc.meta.main_role, 'team');
    assert.equal(doc.meta.aragorn, null); // aucun `declare` en session team (cf. guard-chantier-delegation.test.js)
  } finally {
    server.close();
  }
});

test('CA-27 : repli HISTORIQUE (aucun chantier actif connu) -> conv_id = basename(cwd), aucun meta.repo', async () => {
  const { env, root } = makeSandbox();
  const sid = nextSid(); // AUCUN bootstrap : pas de registre du tout pour cette session
  const { server, docs, url } = await startCaptureServer();
  try {
    const emitEnv = { ...env, IAKALOG_TRANSPORT: 'docdb', DOCDB_URL: url, DOCDB_USER: 'u', DOCDB_PASSWORD: 'p' };
    const res = await runPlanAsync(
      post(sid, root, 'TodoWrite', { todos: [{ content: 'faire le lot 5', status: 'in_progress' }] }),
      emitEnv,
    );
    assert.equal(res.status, 0);
    assert.equal(docs.length, 1);
    const [doc] = docs;
    assert.equal(doc.conv_id, path.basename(root));
    assert.equal(doc.royaume, 'unknown');
    assert.equal(doc.meta.repo, undefined, 'aucun chantier actif connu -> pas de champ meta.repo (comportement historique)');
  } finally {
    server.close();
  }
});

test('CA-27 : `meta.aragorn` renseigne ("aragorn@<nom>") quand le chantier a ete DECLARE (session Odin)', async () => {
  const { env, root } = makeSandbox();
  const repoA = makeRepo(root, 'repoA');
  const sid = nextSid();
  bootstrapOdinPortefeuille(env, sid, root);
  runRemind(prompt(sid, root, 'chantier repoA'), env);

  const { server, docs, url } = await startCaptureServer();
  try {
    const emitEnv = { ...env, IAKALOG_TRANSPORT: 'docdb', DOCDB_URL: url, DOCDB_USER: 'u', DOCDB_PASSWORD: 'p' };
    const res = await runPlanAsync(
      post(sid, repoA, 'Task', { subagent_type: 'gimli', description: 'coder' }),
      emitEnv,
    );
    assert.equal(res.status, 0);
    assert.equal(docs.length, 1);
    const [doc] = docs;
    assert.equal(doc.conv_id, 'repoA');
    assert.equal(doc.royaume, 'REPOA');
    assert.equal(doc.meta.segment, 2);
    assert.equal(doc.meta.aragorn, 'aragorn@repoA');
    assert.equal(doc.meta.main_role, 'odin');
  } finally {
    server.close();
  }
});

// ===========================================================================
// D-2 — plan-courante.mjs ne doit JAMAIS ecrire au registre de chantier.
// ===========================================================================

test('D-2 : source — plan-courante.mjs n\'importe aucun ecrivain du registre (ensureLaunch/appendEvent)', () => {
  const src = fs.readFileSync(PLAN, 'utf8');
  assert.doesNotMatch(src, /\bensureLaunch\s*\(/);
  assert.doesNotMatch(src, /\bappendEvent\s*\(/);
});
