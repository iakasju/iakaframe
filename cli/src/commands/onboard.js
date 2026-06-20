// iakaframe onboard - structure + Forgejo + 1er commit + etat des lieux + push. Iso PS.
import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { isRepo, initRepoMain, run, hasChanges, hasRemoteOrigin } from '../lib/git.js';
import { testRepo, createRepo, remoteUrl } from '../lib/forgejo.js';
import { contractFile, frameworkRoot } from '../lib/kit.js';
import { affectAgent } from '../lib/agents.js';
import { hasCmd } from '../lib/which.js';
import { runInit } from './init.js';
import { doSnapshot } from './snapshot.js';

const TARGETS = ['claude', 'codex', 'ollama'];

export async function runOnboard(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      path: { type: 'string' }, target: { type: 'string', default: 'claude' },
      repo: { type: 'string' }, description: { type: 'string', default: '' },
      version: { type: 'string', default: 'v0.1.0' },
      'skip-forgejo': { type: 'boolean', default: false },
      'no-push': { type: 'boolean', default: false },
      force: { type: 'boolean', default: false },
      umbrella: { type: 'boolean', default: false },
      'init-projects': { type: 'boolean', default: false },
      'dashboard-source': { type: 'string' },
    },
  });
  if (!TARGETS.includes(values.target)) { console.error(`target invalide : ${values.target}`); process.exitCode = 1; return; }
  const root = path.resolve(values.path || process.cwd());
  const repo = values.repo || path.basename(root);
  fs.mkdirSync(root, { recursive: true });

  if (values.umbrella) { return runUmbrella(root, values); }

  // Routage : depot deja sur Forgejo + git local -> update.
  if (!values['skip-forgejo']) {
    const exists = await testRepo(repo);
    if (exists === true && isRepo(root)) {
      console.log(`Le depot '${repo}' existe deja sur Forgejo (git local present) -> bascule en 'update'.`);
      const { runUpdate } = await import('./update.js');
      return runUpdate(['--path', root, '--repo', repo]);
    }
  }

  console.log(`==== iakaframe : onboarding de ${root} ====`);
  const contract = contractFile(values.target);

  // [1] Structure
  console.log(`\n[1/5] Structure de la methode (cible: ${values.target})`);
  runInit(['--path', root, '--target', values.target, ...(values.force ? ['--force'] : [])]);

  // [2] Git + Forgejo
  if (!values['skip-forgejo']) {
    console.log('\n[2/5] Depot Forgejo + remote');
    const st = await createRepo(repo, values.description, true);
    console.log(st === 'exists' ? '  = depot deja existant (409) -> on continue.' : '  + depot cree.');
    if (!isRepo(root)) { initRepoMain(root); console.log('  + git init (branche main).'); }
    const url = remoteUrl(repo);
    if (hasRemoteOrigin(root)) run(root, ['remote', 'set-url', 'origin', url]);
    else run(root, ['remote', 'add', 'origin', url]);
    console.log("  + remote 'origin' configure (token masque).");
  } else {
    console.log('\n[2/5] Forgejo ignore (--skip-forgejo)');
    if (!isRepo(root)) { initRepoMain(root); console.log('  + git init local (branche main).'); }
  }

  // [3] Premier commit
  console.log('\n[3/5] Premier commit');
  const gi = path.join(root, '.gitignore');
  if (!fs.existsSync(gi)) fs.writeFileSync(gi, 'node_modules/\n.env\n.env.local\ndist/\nbuild/\ntarget/\n', 'utf8');
  run(root, ['add', '-A']);
  if (hasChanges(root)) { run(root, ['commit', '-m', 'chore: init iakaframe (structure + methode de travail)']); console.log('  + commit cree.'); }
  else console.log('  = rien a committer.');

  // [4] Etat des lieux initial
  console.log('\n[4/5] Etat des lieux initial (MD + HTML)');
  doSnapshot({ projectPath: root, reason: 'version', version: values.version, note: 'onboarding initial' });
  run(root, ['add', '-A']);
  if (hasChanges(root)) { run(root, ['commit', '-m', 'docs: etat des lieux initial (iakaframe snapshot)']); console.log('  + docs commitees.'); }

  // [5] Push
  console.log('\n[5/5] Push');
  if (values['no-push'] || values['skip-forgejo']) { console.log('  push ignore.'); }
  else {
    const p = run(root, ['push', '-u', 'origin', 'main']);
    console.log(p.ok ? '  + pousse sur origin/main.' : `  ! push echoue : ${p.err || 'voir git'}`);
  }

  console.log('\n==== Termine ====');
  console.log(`Prochaines etapes : remplir ${contract} + specs/PROJET.md ; une instruction par feature ; relancer 'iakaframe update' a chaque version/pause.`);
}

function copyDirExcept(src, dst, exclude = []) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (exclude.includes(e.name)) continue;
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDirExcept(s, d, exclude); else fs.copyFileSync(s, d);
  }
}

// Mode chapeau : Odin (local + global) + dashboard NaonEdge + scan + projets en attente.
function runUmbrella(root, values) {
  console.log(`==== iakaframe : onboarding UMBRELLA (dossier chapeau) : ${root} ====`);

  // [1/3] Odin (portefeuille) : local + global
  console.log('\n[1/3] Odin (portefeuille) : local + global');
  affectAgent('odin', { project: root });
  affectAgent('odin', { global: true });

  // [2/3] Dashboard NaonEdge
  console.log('\n[2/3] Dashboard NaonEdge');
  const fwRoot = frameworkRoot();
  const dashSrc = values['dashboard-source']
    || (fwRoot ? path.join(path.dirname(fwRoot), 'naonedge-dashboard') : '');
  const dashDest = path.join(root, 'naonedge-dashboard');
  let dashOk = false;
  if (dashSrc && fs.existsSync(dashSrc)) {
    copyDirExcept(dashSrc, dashDest, ['data', '.git', 'node_modules']);
    fs.mkdirSync(path.join(dashDest, 'data'), { recursive: true });
    console.log(`  + dashboard copie -> ${dashDest}`);
    dashOk = true;
  } else {
    console.log(`  ! source dashboard introuvable : ${dashSrc || '(inconnue)'} (non deploye)`);
  }

  // [3/3] Scan initial : scan.js (Node, cross-OS) en priorite ; fallback scan.ps1.
  console.log('\n[3/3] Scan initial du portefeuille');
  const scanJs = path.join(dashDest, 'scan.js');
  const scanPs = path.join(dashDest, 'scan.ps1');
  if (dashOk && fs.existsSync(scanJs)) {
    const r = spawnSync(process.execPath, [scanJs, '--root', root], { stdio: 'ignore' });
    console.log(r.status === 0 ? '  + data/projects.js genere (scan.js).' : '  ! scan.js a echoue.');
  } else if (dashOk && fs.existsSync(scanPs)) {
    const ps = hasCmd('pwsh') ? 'pwsh' : hasCmd('powershell') ? 'powershell' : null;
    if (ps) { const r = spawnSync(ps, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scanPs, '-Root', root], { stdio: 'ignore' }); console.log(r.status === 0 ? '  + data/projects.js genere (scan.ps1).' : '  ! scan.ps1 a echoue.'); }
    else console.log('  i scan a lancer manuellement : node scan.js --root <chapeau>.');
  }

  // [*] Projets du chapeau : proposer / amorcer
  console.log('\n[*] Projets du chapeau');
  const meta = ['naonedge-dashboard', 'iakaframe'];
  const pending = [];
  for (const e of fs.readdirSync(root, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    if (meta.includes(e.name) || e.name[0] === '.' || e.name[0] === '_') continue;
    const p = path.join(root, e.name);
    const onboarded = ['.iakaframe', 'CLAUDE.md', 'AGENTS.md'].some(f => fs.existsSync(path.join(p, f)));
    if (!onboarded) pending.push(e.name);
  }
  if (pending.length === 0) console.log('  = tous les projets sont deja onboardes.');
  else if (values['init-projects']) {
    console.log(`  amorcage de ${pending.length} projet(s) (structure seule, cible ${values.target})...`);
    for (const name of pending) { runInit(['--path', path.join(root, name), '--target', values.target]); console.log(`    + ${name}`); }
    console.log('  (Forgejo non touche : brancher chaque depot ensuite via onboard.)');
  } else {
    console.log(`  ${pending.length} projet(s) non onboarde(s) : ${pending.join(', ')}`);
    console.log('  -> relancer avec --init-projects pour les amorcer (structure seule, sans Forgejo).');
  }

  console.log('\n==== Chapeau pret ====');
  if (dashOk) console.log(`  - Dashboard : ouvrir ${path.join(dashDest, 'index.html')}`);
  console.log('  - Onboarder un projet : iakaframe onboard --path <projet> [--target claude|codex]');
}
