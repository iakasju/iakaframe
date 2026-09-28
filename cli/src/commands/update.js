// iakaframe update - checkpoint : snapshot + commit global + push. Iso PS.
import { parseArgs } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';
import { verifyFrame } from '../lib/frame.js';
import { isRepo, run, hasChanges, currentBranch } from '../lib/git.js';
import {
  pousserFanout, formaterFanout, verdictFanout, DELAI_DEFAUT_S, resoudreCibles, formaterEcarts,
} from '../lib/canaux.js';
import { splitCanaux, testRepo } from '../lib/forgejo.js';
import {
  SEMVER_RELEASE, tagCandidat, lireVitrine, classerPublication, formaterVitrineDefaut,
  executerPublication, publierVitrine,
} from '../lib/vitrine.js';
import { peutDemander, askYesNo } from '../lib/interactif.js';
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
  --remotes <a,b,c>  Cibles du push, parmi les remotes des forges self-hosted (defaut : toutes, origin d'abord ; GitHub et hors forge : jamais)
  --publier <vX.Y.Z>  Publie ce tag de release (+ la branche) sur la vitrine opt-in (iakaframe.json "pushOptInRemotes") : version majeure/mineure, accord du decideur au terminal ; patch = confirmation renforcee ; jamais en non-interactif
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
      // Publication vitrine explicite (specs/instructions/update-remotes-github-opt-in.md § 5).
      publier: { type: 'string' },
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

  // --publier : CONTROLE 1 (§ 5.2), forme STRICTE (vX.Y.Z uniquement, pre-versions/metadonnees
  // refusees) — place AVANT le routage, comme --version (D2 ci-dessus).
  let tagPublier = '';
  if (values.publier !== undefined) {
    const pNorm = normalizeVersion(values.publier);
    if (!pNorm.ok || !SEMVER_RELEASE.test(pNorm.value)) {
      console.error(`--publier invalide : ${values.publier} (attendu vX.Y.Z strict — pas de pre-version -rc.1 ni de metadonnee +build)`);
      process.exitCode = 1;
      return;
    }
    tagPublier = pNorm.value;
    // CONTROLE 2 (§ 5.2) : --publier exige un push (branche + tag) -> incompatible avec --no-push.
    if (values['no-push']) {
      console.error('--publier et --no-push sont incompatibles (la publication doit pousser la branche et le tag).');
      process.exitCode = 1;
      return;
    }
  }

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
    // --publier CONTROLE 3 (§ 5.2) : ignore a la bascule, jamais transmis, les controles 4-7
    // (ci-dessous) ne s'appliquent alors pas (on ne les atteint jamais, cf. `return` ci-dessous).
    const ignored = ['reason', 'note', 'message', 'publier'].filter(f => passed.has(f));
    if (ignored.length) console.log(`  i options ${ignored.map(f => '--' + f).join(', ')} sans objet pour un onboarding -> ignorees.`);
    return runOnboard(fwd);
  }

  console.log(`==== update iakaframe : ${root} ====`);
  console.log(provenance(root));   // D7 : quel CLI, sur quelle racine

  // --publier : CONTROLES 4 a 7 (§ 5.2), TOUS avant le snapshot -> aucun commit, aucun push tant
  // qu'un refus n'a pas ete leve. `selectionVitrines` sert aussi plus bas (§ 6/§ 5, une seule
  // resolution des cibles pour toute la commande).
  const branchePourControle = currentBranch(root);
  if (tagPublier) {
    const vitrinesOptIn = resoudreCibles(root, null).vitrines;
    if (vitrinesOptIn.length === 0) {
      console.error('--publier refuse (aucune-vitrine) : aucun remote vitrine opt-in dans iakaframe.json ("pushOptInRemotes").');
      process.exitCode = 1;
      return;
    }
    const tagExiste = run(root, ['rev-parse', '--verify', '--quiet', `refs/tags/${tagPublier}`]).ok;
    if (!tagExiste) {
      console.error(`--publier refuse (tag-absent) : le tag ${tagPublier} n existe pas localement.`);
      process.exitCode = 1;
      return;
    }
    const ancetre = run(root, ['merge-base', '--is-ancestor', `${tagPublier}^{commit}`, 'HEAD']).ok;
    if (!ancetre) {
      console.error(`--publier refuse (tag-hors-branche) : le tag ${tagPublier} n est pas atteignable depuis la branche ${branchePourControle}.`);
      process.exitCode = 1;
      return;
    }
    if (!peutDemander({ guide: true })) {
      console.error('--publier exige l accord du decideur au terminal (session interactive) : rien n a ete committe ni pousse.');
      process.exitCode = 1;
      return;
    }
  }

  console.log(`\n[1/3] Etat des lieux (${values.reason})`);
  const r = doSnapshot({ projectPath: root, reason: values.reason, version, note: values.note || '', home: values.home });
  console.log(`  snapshot version=${r.version} branche=${r.branch} fichiers=${r.fileCount}`);
  console.log(`  ${formatRecit(r.recit)}`);
  console.log(`  ${formatCadence(r.cadence)}`);
  warnFrameLeak(root);

  run(root, ['add', '-A']);
  if (!hasChanges(root)) {
    // § 5.2 fin : `update --publier` ne s'arrete PAS a « Rien a committer » quand l'arbre est
    // propre — il saute le commit et poursuit au push (la publication n'exige pas de checkpoint).
    if (!tagPublier) { console.log('\n[2/3] Rien a committer (arbre propre).'); return; }
    console.log('\n[2/3] Rien a committer (arbre propre) -> poursuite pour --publier.');
  } else {
    let msg = values.message;
    if (!msg) { const v = version ? ` ${version}` : ''; msg = `chore(iakaframe): update etat des lieux + commit global (${values.reason}${v})`; }
    run(root, ['commit', '-m', msg]);
    console.log(`\n[2/3] Commit global cree : ${msg}`);
  }

  if (values['no-push']) { console.log('[3/3] Push ignore (--no-push).'); return; }

  // SELECTION DES CIBLES (§ 2-4) : le fan-out ne vise QUE les remotes `forge` (self-hosted ou
  // locaux). GitHub / hors forge ne sont JAMAIS dans `retenues` — ecartes ou refuses, nommes.
  const branch = currentBranch(root);
  const demandes = values.remotes ? splitCanaux(values.remotes) : null;
  const selection = resoudreCibles(root, demandes);
  for (const l of formaterEcarts(selection)) console.log(l);
  const timeoutMs = Math.max(2, parseInt(values.timeout, 10) || DELAI_DEFAUT_S) * 1000;

  let branchRes = [];
  if (!selection.retenues.length) {
    console.log('[3/3] Aucun remote eligible (forge self-hosted) : push ignore, le commit n existe que localement.');
  } else {
    console.log(`\n[3/3] Push sur ${selection.retenues.length} cible(s) : ${selection.retenues.join(', ')}`);
    branchRes = pousserFanout(root, branch, selection.retenues, { timeoutMs });
    for (const l of formaterFanout(branchRes, branch)) console.log(l);
    if (verdictFanout(branchRes).aucune) {
      console.log('  Commit local conserve. Etat des canaux / rattrapage : iakaframe canaux --rattraper');
    }
  }

  if (!tagPublier) {
    // § 6 : projet opt-in, update SANS --publier -> push forge seulement, une ligne INFORMATIVE
    // par vitrine (jamais poussee ici). Ces lignes n'affectent jamais le code retour (§ 6, fin).
    for (const v of selection.vitrines) {
      const candidat = tagCandidat(root);
      let lecture = null;
      if (candidat) lecture = lireVitrine(root, v.nom, { timeoutMs: Math.min(timeoutMs, 10000) });
      const classement = (candidat && lecture && lecture.ok) ? classerPublication(candidat, lecture.tags) : null;
      console.log(formaterVitrineDefaut({ nom: v.nom, hote: v.hote, candidat, classement, lectureOk: lecture ? lecture.ok : null }));
    }
  } else {
    // § 5.2 point final + § 5.4 : le SEUL tag nomme part vers les memes cibles forge retenues ;
    // la vitrine n'est publiee QUE si au moins une cible forge a recu A LA FOIS la branche ET le
    // tag (`forgeServie`) — jamais en avance sur la forge de reference.
    const servesBranche = new Set(branchRes.filter((res) => res.ok).map((res) => res.remote));
    const tagRes = selection.retenues.length
      ? pousserFanout(root, `refs/tags/${tagPublier}`, selection.retenues, { timeoutMs })
      : [];
    const servesTag = new Set(tagRes.filter((res) => res.ok).map((res) => res.remote));
    const forgeServie = [...servesBranche].some((nom) => servesTag.has(nom));

    const pub = await executerPublication({
      tag: tagPublier,
      branche: branch,
      vitrines: selection.vitrines,
      forgeServie,
      lire: (v) => lireVitrine(root, v.nom, { timeoutMs: Math.min(timeoutMs, 10000) }),
      demander: (q) => askYesNo(q),
      pousser: (nom, br, t) => publierVitrine(root, nom, br, t, { timeoutMs }),
    });
    for (const res of pub.resultats) {
      if (res.verdict === 'publie') console.log(`  [OK] ${res.nom} <- ${branch} + ${tagPublier}`);
      else if (res.verdict === 'annule') console.log(`  ${res.nom} : publication annulee par le decideur`);
      else console.log(`  ! ${res.nom} REFUSE : ${res.motif}`);
    }
    if (pub.exitCode !== 0) process.exitCode = 1;
  }

  if (selection.refusees.length > 0) process.exitCode = 1;
}
