// iakaframe update - checkpoint : snapshot + commit global + push. Iso PS.
import { parseArgs } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';
import { verifyFrame } from '../lib/frame.js';
import { isRepo, run, hasChanges, currentBranch } from '../lib/git.js';
import { listerRemotes, pousserFanout, formaterFanout, verdictFanout, DELAI_DEFAUT_S } from '../lib/canaux.js';
import { splitCanaux } from '../lib/forgejo.js';
import { testRepo } from '../lib/forgejo.js';
import { doSnapshot, formatRecit, normalizeVersion, versionErrorMessage, provenance } from './snapshot.js';
import { formatCadence } from '../lib/cadence.js';

const USAGE = `Usage : iakaframe update [options]

Checkpoint : etat des lieux + commit global (git add -A) + push. Auto-detection :
depot absent de Forgejo ou pas de git local -> bascule en 'onboard'.

Options :
  --path <dir>       Racine du projet (defaut : dossier courant)
  --repo <nom>       Nom du depot distant (defaut : nom du dossier)
  --reason <motif>   version | pause | reprise | manual (defaut : manual)
  --version <vX.Y.Z> Version a inscrire dans l'etat des lieux
  --note <txt>       Note libre ajoutee au journal
  --message <txt>    Message de commit (sinon message chore(iakaframe) auto)
  --no-push          Commit local seulement, sans push
  --remotes <a,b,c>  Cibles du push (defaut : TOUS les remotes configures, origin d'abord)
  --timeout <sec>    Delai par cible du push (defaut : ${DELAI_DEFAUT_S})
  --home <dir>       Canon de cadence (sinon IAKA_MEMORY_HOME, sinon ~/.iaka/memory/)
  --autoriser-creation-depot  Autorise la creation d'un depot distant a la bascule onboard`;

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
  const { values, tokens } = parseArgs({
    args: argv,
    tokens: true,
    options: {
      path: { type: 'string' }, reason: { type: 'string', default: 'manual' },
      version: { type: 'string' }, note: { type: 'string' }, message: { type: 'string' },
      repo: { type: 'string' }, 'no-push': { type: 'boolean', default: false },
      // Fan-out d'ecriture (lot 0, 0.a) : le push n'est plus mono-cible.
      remotes: { type: 'string' }, timeout: { type: 'string' },
      home: { type: 'string' },
      // Autorisation EXPLICITE de creation de depot lors d'une bascule vers onboard (§ 4.2/4.6).
      'autoriser-creation-depot': { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });
  if (values.help) { console.log(USAGE); return; }
  // D2 — la forme de --version est refusee AVANT tout : avant le routage, avant le snapshot,
  // et donc tres avant le `git add -A` / `commit`. Un checkpoint ne doit jamais graver une
  // fausse version dans un fichier versionne.
  const vNorm = normalizeVersion(values.version || '');
  if (!vNorm.ok) { console.error(versionErrorMessage(vNorm.value)); process.exitCode = 1; return; }
  const version = vNorm.value;   // '' si absente : la cascade de doSnapshot s'applique
  // Drapeaux REELLEMENT tapes par l'humain (distingue un defaut d'une valeur fournie) : c'est ce qui
  // permet de ne propager/declarer que ce qu'il a demande, sans forcer un defaut a la bascule.
  const passed = new Set(tokens.filter(t => t.kind === 'option').map(t => t.name));
  const root = path.resolve(values.path || process.cwd());
  const repo = values.repo || path.basename(root);

  // Routage : pas de git local ou depot absent de Forgejo -> onboard.
  const gitExists = isRepo(root);
  const exists = await testRepo(repo);
  if (exists === false || !gitExists) {
    const why = !gitExists ? 'pas de git local' : 'absent de Forgejo';
    console.log(`Le depot '${repo}' ${why} -> bascule en 'onboard'.`);
    const { runOnboard } = await import('./onboard.js');
    // Propagation CIBLEE de l'intention de l'humain (ne pas reconstruire un argv nu qui perd tout).
    // --from-update = marqueur d'origine : la creation de depot distant devient un acte a confirmer.
    const fwd = ['--path', root, '--repo', repo, '--from-update'];
    if (values['no-push']) fwd.push('--no-push');
    if (version) fwd.push('--version', version);
    if (values.home) fwd.push('--home', values.home);
    if (values['autoriser-creation-depot']) fwd.push('--autoriser-creation-depot');
    // Drapeaux sans objet pour un onboarding : DECLARES, jamais jetes en silence (§ 4.3).
    const ignored = ['reason', 'note', 'message'].filter(f => passed.has(f));
    if (ignored.length) console.log(`  i options ${ignored.map(f => '--' + f).join(', ')} sans objet pour un onboarding -> ignorees.`);
    return runOnboard(fwd);
  }

  console.log(`==== update iakaframe : ${root} ====`);
  console.log(provenance(root));   // D7 : quel CLI, sur quelle racine
  console.log(`\n[1/3] Etat des lieux (${values.reason})`);
  const r = doSnapshot({ projectPath: root, reason: values.reason, version, note: values.note || '', home: values.home });
  console.log(`  snapshot version=${r.version} branche=${r.branch} fichiers=${r.fileCount}`);
  console.log(`  ${formatRecit(r.recit)}`);
  console.log(`  ${formatCadence(r.cadence)}`);
  warnFrameLeak(root);

  run(root, ['add', '-A']);
  if (!hasChanges(root)) { console.log('\n[2/3] Rien a committer (arbre propre).'); return; }
  let msg = values.message;
  if (!msg) { const v = version ? ` ${version}` : ''; msg = `chore(iakaframe): update etat des lieux + commit global (${values.reason}${v})`; }
  run(root, ['commit', '-m', msg]);
  console.log(`\n[2/3] Commit global cree : ${msg}`);

  if (values['no-push']) { console.log('[3/3] Push ignore (--no-push).'); return; }

  // FAN-OUT (lot 0, 0.a) : on pousse vers TOUTES les cibles configurees, chacune reussissant ou
  // echouant INDEPENDAMMENT. Une cible injoignable n'est PAS un echec du checkpoint (CA-9) : le
  // commit local est deja le filet de securite. Ce qui est interdit, c'est de laisser croire a une
  // sauvegarde sans nommer QUI a recu (R7) — d'ou une ligne PAR cible.
  const branch = currentBranch(root);
  const remotes = values.remotes ? splitCanaux(values.remotes) : listerRemotes(root);
  if (!remotes.length) { console.log('[3/3] Aucun remote configure : push ignore.'); return; }
  const timeoutMs = Math.max(2, parseInt(values.timeout, 10) || DELAI_DEFAUT_S) * 1000;
  console.log(`\n[3/3] Push sur ${remotes.length} cible(s) : ${remotes.join(', ')}`);
  const res = pousserFanout(root, branch, remotes, { timeoutMs });
  for (const l of formaterFanout(res, branch)) console.log(l);
  if (verdictFanout(res).aucune) {
    console.log('  Commit local conserve. Etat des canaux / rattrapage : iakaframe canaux --rattraper');
  }
}
