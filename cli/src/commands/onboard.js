// iakaframe onboard - structure + Forgejo + 1er commit + etat des lieux + push. Iso PS.
import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { isRepo, initRepoMain, run, hasChanges, hasRemoteOrigin } from '../lib/git.js';
import { testRepo, createRepo, remoteUrl } from '../lib/forgejo.js';
import { contractFile } from '../lib/kit.js';
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
    },
  });
  if (!TARGETS.includes(values.target)) { console.error(`target invalide : ${values.target}`); process.exitCode = 1; return; }
  const root = path.resolve(values.path || process.cwd());
  const repo = values.repo || path.basename(root);
  fs.mkdirSync(root, { recursive: true });

  if (values.umbrella) {
    console.log('Mode --umbrella pas encore porte dans la CLI (Odin + dashboard).');
    console.log('Utiliser pour l\'instant : powershell iakaframe-onboard.ps1 -Umbrella -Path <chapeau>.');
    return;
  }

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
