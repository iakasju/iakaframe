// iakaframe onboard - structure + Forgejo + 1er commit + etat des lieux + push. Iso PS.
import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { isRepo, initRepoMain, run, hasChanges, hasRemoteOrigin } from '../lib/git.js';
import { testRepo, createRepo, remoteUrl, token } from '../lib/forgejo.js';
import { contractFileForNode, frameworkRoot, frameworkVersion } from '../lib/kit.js';
import { affectPersona } from '../lib/agents.js';
import { libraryRoot } from '../lib/library.js';
import { HARDWIRED_DEFAULT_FRAME, PORTFOLIO_MARKER, frameVersionOf, parseKeyValueFile } from '../lib/frame-active.js';
import { hasCmd } from '../lib/which.js';
import { runInit, resolveNode } from './init.js';
import { doSnapshot } from './snapshot.js';
import readline from 'node:readline';

const USAGE = `Usage : iakaframe onboard [options]

Met en place la methode : structure + depot Forgejo + 1er commit + etat des lieux + push.
Auto-detection : depot deja sur Forgejo (git local present) -> bascule en 'update'.

Options :
  --path <dir>       Racine du projet (defaut : dossier courant)
  --node <n>         claude | codex | ollama-localhost | ollama-lan (defaut : claude)
  --repo <nom>       Nom du depot distant (defaut : nom du dossier)
  --description <txt> Description ASCII du depot (creation Forgejo)
  --version <vX.Y.Z> Version initiale (defaut : v0.1.0)
  --skip-forgejo     N'ecrit rien sur Forgejo (structure + git local seulement)
  --no-push          Ne pousse pas
  --force            Ecrase les fichiers de structure existants
  --umbrella         Mode chapeau (Odin + dashboard + scan du portefeuille)
  --init-projects    (umbrella) Amorce les projets non onboardes du chapeau
  --home <dir>       Canon de cadence propage au snapshot
  --autoriser-creation-depot  Autorise la creation de depot a la bascule depuis update
  (--target = alias deprecie de --node)`;

// Confirmation interactive o/N, DEFAUT = non (seul 'o'/'oui' vaut oui). Jamais appelee en
// non-interactif (le chemin sur reste le REFUS, cf. runOnboard).
function askYesNo(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (ans) => { rl.close(); resolve(/^o(ui)?$/i.test(String(ans).trim())); });
  });
}

export async function runOnboard(argv) {
  const { values, tokens } = parseArgs({
    args: argv,
    tokens: true,
    options: {
      path: { type: 'string' },
      node: { type: 'string' },                 // claude|codex|ollama-localhost|ollama-lan
      target: { type: 'string' },               // alias DEPRECIE de --node
      repo: { type: 'string' }, description: { type: 'string', default: '' },
      version: { type: 'string', default: 'v0.1.0' },
      home: { type: 'string' },                 // canon de cadence -> propage a doSnapshot
      'skip-forgejo': { type: 'boolean', default: false },
      'no-push': { type: 'boolean', default: false },
      force: { type: 'boolean', default: false },
      umbrella: { type: 'boolean', default: false },
      'init-projects': { type: 'boolean', default: false },
      'dashboard-source': { type: 'string' },
      // Marqueur INTERNE pose par la bascule update->onboard (jamais un usage direct). Il fait de la
      // creation de depot distant un acte a CONFIRMER (l'humain a demande un checkpoint, pas un onboard).
      'from-update': { type: 'boolean', default: false },
      // Echappatoire EXPLICITE : autorise la creation de depot malgre le marqueur de bascule.
      'autoriser-creation-depot': { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });
  if (values.help) { console.log(USAGE); return; }
  const passed = new Set(tokens.filter(t => t.kind === 'option').map(t => t.name));
  const { node, error } = resolveNode(values);
  if (error) { console.error(error); process.exitCode = 1; return; }
  const root = path.resolve(values.path || process.cwd());
  const repo = values.repo || path.basename(root);
  fs.mkdirSync(root, { recursive: true });

  if (values.umbrella) { return runUmbrella(root, values, node); }

  // Routage : depot deja sur Forgejo + git local -> update.
  if (!values['skip-forgejo']) {
    const exists = await testRepo(repo);
    if (exists === true && isRepo(root)) {
      console.log(`Le depot '${repo}' existe deja sur Forgejo (git local present) -> bascule en 'update'.`);
      const { runUpdate } = await import('./update.js');
      // Propagation CIBLEE (l'ancien argv nu '--path --repo' perdait --no-push/--version/--home).
      const fwd = ['--path', root, '--repo', repo];
      if (values['no-push']) fwd.push('--no-push');
      if (passed.has('version')) fwd.push('--version', values.version);   // pas le defaut v0.1.0
      if (passed.has('home')) fwd.push('--home', values.home);
      return runUpdate(fwd);
    }
  }

  // GARDE DE BASCULE (§ 4.2 / 4.6) : quand onboard est ATTEINT PAR BASCULE depuis update
  // (--from-update), creer un depot distant DEPASSE ce que l'humain a demande (un checkpoint).
  // -> refus par defaut. Echappatoire : --autoriser-creation-depot. En interactif : confirmation
  //    o/N (defaut non). En NON-interactif (CI/agent) : REFUS, jamais passage (defaut = le sur).
  //    Le refus reste LOCAL : structure + commits conserves, seule la creation distante + le push
  //    sont supprimes. Onboard DIRECT (sans --from-update) n'est JAMAIS touche : batch intact.
  let refuseCreation = false;
  if (values['from-update'] && !values['skip-forgejo'] && !values['autoriser-creation-depot']) {
    const interactive = Boolean(process.stdout.isTTY) && !process.env.CI && !process.env.IAKA_NON_INTERACTIF;
    const confirmed = interactive
      ? await askYesNo(`Creer le depot distant '${repo}' ? (bascule depuis 'update', non demande explicitement) [o/N] `)
      : false;
    if (!confirmed) {
      refuseCreation = true;
      process.exitCode = 1;
      console.log(`REFUS : creation de depot distant non confirmee (bascule 'update' -> 'onboard').`);
      console.log(`  Aucun depot distant cree, aucun push. Structure et commits locaux conserves.`);
      console.log(`  Pour creer le depot explicitement : iakaframe onboard --path ${root}`);
      console.log(`  (ou relancer en mode interactif, ou ajouter --autoriser-creation-depot).`);
    }
  }

  console.log(`==== iakaframe : onboarding de ${root} ====`);
  const contract = contractFileForNode(node);

  // [1] Structure
  console.log(`\n[1/5] Structure de la methode (nœud: ${node})`);
  runInit(['--path', root, '--node', node, ...(values.force ? ['--force'] : [])]);

  // [2] Git + Forgejo
  const doForgejo = !values['skip-forgejo'] && !refuseCreation;
  if (doForgejo) {
    console.log('\n[2/5] Depot Forgejo + remote');
    const st = await createRepo(repo, values.description, true);
    console.log(st === 'exists' ? '  = depot deja existant (409) -> on continue.' : '  + depot cree.');
    if (!isRepo(root)) { initRepoMain(root); console.log('  + git init (branche main).'); }
    const url = remoteUrl(repo);
    if (hasRemoteOrigin(root)) run(root, ['remote', 'set-url', 'origin', url]);
    else run(root, ['remote', 'add', 'origin', url]);
    console.log("  + remote 'origin' configure (token masque).");
  } else {
    console.log(refuseCreation ? '\n[2/5] Forgejo NON touche (creation refusee : bascule)' : '\n[2/5] Forgejo ignore (--skip-forgejo)');
    if (!isRepo(root)) { initRepoMain(root); console.log('  + git init local (branche main).'); }
  }

  // [3] Premier commit
  console.log('\n[3/5] Premier commit');
  const gi = path.join(root, '.gitignore');
  if (!fs.existsSync(gi)) fs.writeFileSync(gi, 'node_modules/\n.env\n.env.local\ndist/\nbuild/\ntarget/\n', 'utf8');
  // .env du projet : recopie auto du token Forgejo depuis la source unique (<chapeau>/.env).
  // .env est gitignore -> jamais committe/pousse.
  const tk = token();
  if (tk) { fs.writeFileSync(path.join(root, '.env'), `FORGEJO_TOKEN=${tk}\n`, { mode: 0o600 }); console.log('  + .env projet (token Forgejo recopie).'); }
  else console.log('  ! token Forgejo absent -> .env projet non ecrit (colle-le dans <chapeau>/.env puis relance token-sync).');
  run(root, ['add', '-A']);
  if (hasChanges(root)) { run(root, ['commit', '-m', 'chore: init iakaframe (structure + methode de travail)']); console.log('  + commit cree.'); }
  else console.log('  = rien a committer.');

  // [4] Etat des lieux initial
  console.log('\n[4/5] Etat des lieux initial (MD + HTML)');
  doSnapshot({ projectPath: root, reason: 'version', version: values.version, note: 'onboarding initial', home: values.home });
  run(root, ['add', '-A']);
  if (hasChanges(root)) { run(root, ['commit', '-m', 'docs: etat des lieux initial (iakaframe snapshot)']); console.log('  + docs commitees.'); }

  // [5] Push
  console.log('\n[5/5] Push');
  if (values['no-push'] || values['skip-forgejo'] || refuseCreation) { console.log('  push ignore.'); }
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
function runUmbrella(root, values, node) {
  console.log(`==== iakaframe : onboarding UMBRELLA (dossier chapeau) : ${root} ====`);

  // [0] Pointeur portefeuille (D-D, reservoir-de-frames.md) : marqueur au niveau chapeau portant
  // la frame default heritee par les nouveaux projets. NON DESTRUCTIF (pose s'il manque, jamais
  // ecrase). Lisible par le CLI (init) ET la GUI (source unique). Absent -> repli cable a l'init.
  const marker = path.join(root, PORTFOLIO_MARKER);
  if (!parseKeyValueFile(marker).defaultFrame) {
    const dv = frameVersionOf(HARDWIRED_DEFAULT_FRAME, libraryRoot(), frameworkVersion(frameworkRoot()));
    fs.writeFileSync(marker, `defaultFrame=${HARDWIRED_DEFAULT_FRAME}\ndefaultFrameVersion=${dv || ''}\n`, 'utf8');
    console.log(`\n[0] Pointeur portefeuille : ${PORTFOLIO_MARKER} (frame ${HARDWIRED_DEFAULT_FRAME} ${dv || ''})`);
  } else {
    console.log(`\n[0] Pointeur portefeuille : ${PORTFOLIO_MARKER} deja present (conserve).`);
  }

  // [1/3] Odin (portefeuille) : local + global
  console.log('\n[1/3] Odin (portefeuille) : local + global');
  affectPersona('odin', { project: root });
  affectPersona('odin', { global: true });

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
    console.log(`  amorcage de ${pending.length} projet(s) (structure seule, nœud ${node})...`);
    for (const name of pending) { runInit(['--path', path.join(root, name), '--node', node]); console.log(`    + ${name}`); }
    console.log('  (Forgejo non touche : brancher chaque depot ensuite via onboard.)');
  } else {
    console.log(`  ${pending.length} projet(s) non onboarde(s) : ${pending.join(', ')}`);
    console.log('  -> relancer avec --init-projects pour les amorcer (structure seule, sans Forgejo).');
  }

  console.log('\n==== Chapeau pret ====');
  if (dashOk) console.log(`  - Dashboard : ouvrir ${path.join(dashDest, 'index.html')}`);
  console.log('  - Onboarder un projet : iakaframe onboard --path <projet> [--node claude|codex|ollama-localhost|ollama-lan]');
}
