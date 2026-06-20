// iakaframe update - checkpoint : snapshot + commit global + push. Iso PS.
import { parseArgs } from 'node:util';
import path from 'node:path';
import { isRepo, run, hasChanges, currentBranch, hasRemoteOrigin } from '../lib/git.js';
import { testRepo } from '../lib/forgejo.js';
import { doSnapshot } from './snapshot.js';

export async function runUpdate(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      path: { type: 'string' }, reason: { type: 'string', default: 'manual' },
      version: { type: 'string' }, note: { type: 'string' }, message: { type: 'string' },
      repo: { type: 'string' }, 'no-push': { type: 'boolean', default: false },
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
  const r = doSnapshot({ projectPath: root, reason: values.reason, version: values.version || '', note: values.note || '' });
  console.log(`  snapshot version=${r.version} branche=${r.branch} fichiers=${r.fileCount}`);

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
