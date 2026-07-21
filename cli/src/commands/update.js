// iakaframe update - checkpoint : snapshot + commit global + push. Iso PS.
import { parseArgs } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';
import { verifyFrame } from '../lib/frame.js';
import { isRepo, run, hasChanges, currentBranch, hasRemoteOrigin } from '../lib/git.js';
import { testRepo } from '../lib/forgejo.js';
import { doSnapshot } from './snapshot.js';
import { formatCadence } from '../lib/cadence.js';

// Avertissement NON BLOQUANT sur l'etat du miroir (specs/instructions/outillage-scrub-miroir-frame.md
// § 5 « Cadence », critere C8).
//
// POURQUOI NON BLOQUANT, ET POURQUOI C'EST DELIBERE. `update` est un CHECKPOINT — un filet de
// securite (« commits atomiques et frequents »). Y placer un gate bloquant transformerait le geste
// de sauvegarde en geste de publication, et la premiere fois qu'il empecherait de sauvegarder du
// travail en cours, il serait contourne ou desactive. Le BLOCAGE vit dans la suite de tests
// (cli/test/frame-verify.test.js) ; ici on se contente de rendre la fuite VISIBLE.
//
// Ne peut jamais faire echouer `update` : tout est capture.
function warnFrameLeak(root) {
  try {
    const dir = path.join(root, 'frames', 'releases');
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const res = verifyFrame(path.join(dir, e.name));
      if (res.ok) continue;
      console.log(`  ! AVERTISSEMENT : le miroir ${e.name} porte ${res.blocking} fuite(s) bloquante(s).`);
      console.log(`    detail : iakaframe frame verify --frame frames/releases/${e.name}`);
      console.log('    (non bloquant : le checkpoint reste un filet de securite, pas une publication)');
    }
  } catch { /* le checkpoint ne doit JAMAIS echouer a cause du gate */ }
}

export async function runUpdate(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      path: { type: 'string' }, reason: { type: 'string', default: 'manual' },
      version: { type: 'string' }, note: { type: 'string' }, message: { type: 'string' },
      repo: { type: 'string' }, 'no-push': { type: 'boolean', default: false },
      home: { type: 'string' },
    },
  });
  const root = path.resolve(values.path || process.cwd());
  const repo = values.repo || path.basename(root);

  // Routage : pas de git local ou depot absent de Forgejo -> onboard.
  const gitExists = isRepo(root);
  const exists = await testRepo(repo);
  if (exists === false || !gitExists) {
    const why = !gitExists ? 'pas de git local' : 'absent de Forgejo';
    console.log(`Le depot '${repo}' ${why} -> bascule en 'onboard'.`);
    const { runOnboard } = await import('./onboard.js');
    return runOnboard(['--path', root, '--repo', repo]);
  }

  console.log(`==== update iakaframe : ${root} ====`);
  console.log(`\n[1/3] Etat des lieux (${values.reason})`);
  const r = doSnapshot({ projectPath: root, reason: values.reason, version: values.version || '', note: values.note || '', home: values.home });
  console.log(`  snapshot version=${r.version} branche=${r.branch} fichiers=${r.fileCount}`);
  console.log(`  ${formatCadence(r.cadence)}`);
  warnFrameLeak(root);

  run(root, ['add', '-A']);
  if (!hasChanges(root)) { console.log('\n[2/3] Rien a committer (arbre propre).'); return; }
  let msg = values.message;
  if (!msg) { const v = values.version ? ` ${values.version}` : ''; msg = `chore(iakaframe): update etat des lieux + commit global (${values.reason}${v})`; }
  run(root, ['commit', '-m', msg]);
  console.log(`\n[2/3] Commit global cree : ${msg}`);

  if (values['no-push']) { console.log('[3/3] Push ignore (--no-push).'); return; }
  if (!hasRemoteOrigin(root)) { console.log("[3/3] Pas de remote 'origin' : push ignore."); return; }
  const branch = currentBranch(root);
  const p = run(root, ['push', 'origin', branch]);
  console.log(p.ok ? `[3/3] Pousse sur origin/${branch}.` : `[3/3] ECHEC du push (${p.err || 'voir git'}). Commit local conserve.`);
}
