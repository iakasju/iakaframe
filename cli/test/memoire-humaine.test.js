// R3 (lot 5) — POINT D'ACCROCHE de la publication de la memoire humaine sur le rituel de doc.
//
// Le point retenu est `doSnapshot()` : le passage oblige des trois moments (version / pause /
// reprise) ET du checkpoint `update`. Ces tests verrouillent les trois garanties qui rendent la
// greffe acceptable :
//   1. NON-BLOQUANTE : une publication en echec laisse l'etat des lieux ECRIT et REUSSI ;
//   2. OPT-IN STRICT : sans opt-in projet, AUCUNE publication (pas d'espace cree par effet de bord) ;
//   3. MOTIFS PILOTES par le projet (publier_sur), `manual` exclu par defaut.
// AUCUN test ne touche le reseau ni AppFlowy : le lancement du script est INJECTE.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runMemoireHumaine, formatMemoireHumaine, readMemoireHumaineConf, appflowyDocScript }
  from '../src/lib/memoire-humaine.js';
import { doSnapshot } from '../src/commands/snapshot.js';

// Projet tmpdir + un faux script de publication (present sur le disque, jamais execute).
function tmpProjet(conf) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-memhum-'));
  if (conf !== undefined) fs.writeFileSync(path.join(dir, 'iakaframe.json'), JSON.stringify(conf), 'utf8');
  const script = path.join(dir, 'appflowy-doc.mjs');
  fs.writeFileSync(script, '// faux script, jamais execute (le lancement est injecte)\n', 'utf8');
  return { dir, env: { IAKAFRAME_APPFLOWY_DOC: script } };
}
// Faux lanceur : enregistre l'appel et rend un resultat programmable.
const lanceur = (res = { status: 0, stdout: 'appflowy-doc: termine — 0 creee(s), 17 inchangee(s)\n' }) => {
  const appels = [];
  const fn = (argv, opts) => { appels.push({ argv, opts }); return res; };
  fn.appels = appels;
  return fn;
};

test('R3 readMemoireHumaineConf : absent / illisible / non conforme -> jamais opte, jamais de jet', () => {
  const vide = tmpProjet();
  assert.equal(readMemoireHumaineConf(vide.dir).publier, false);
  fs.writeFileSync(path.join(vide.dir, 'iakaframe.json'), '{ ceci n est pas du json', 'utf8');
  assert.equal(readMemoireHumaineConf(vide.dir).publier, false);
  const faux = tmpProjet({ memoireHumaine: 'oui' });
  assert.equal(readMemoireHumaineConf(faux.dir).publier, false);
  // Defaut des motifs : les TROIS moments de doc, `manual` exclu.
  const opte = tmpProjet({ memoireHumaine: { publier: true } });
  assert.deepEqual(readMemoireHumaineConf(opte.dir).publierSur, ['version', 'pause', 'reprise']);
});

test('R3 OPT-IN STRICT : sans opt-in, AUCUNE publication (zero creation par effet de bord)', () => {
  const p = tmpProjet({ frame: 'iakaframe' });
  const run = lanceur();
  const r = runMemoireHumaine({ projectPath: p.dir, reason: 'version', env: p.env, runFn: run });
  assert.equal(r.triggered, false);
  assert.equal(r.skipped, 'non-opte');
  assert.equal(run.appels.length, 0, 'le script ne doit meme pas etre lance');
  assert.match(formatMemoireHumaine(r), /non activee/);
});

test('R3 : opte -> publication lancee sur version, pause ET reprise ; jamais sur manual', () => {
  const p = tmpProjet({ memoireHumaine: { publier: true, workspace: 'projects' } });
  for (const motif of ['version', 'pause', 'reprise']) {
    const run = lanceur();
    const r = runMemoireHumaine({ projectPath: p.dir, reason: motif, env: p.env, runFn: run });
    assert.equal(r.ok, true, motif);
    assert.equal(run.appels.length, 1, motif);
    const argv = run.appels[0].argv;
    assert.equal(argv[1], '--project');
    assert.equal(argv[2], path.basename(p.dir), 'a defaut d’espace nomme, le nom du dossier');
    assert.equal(argv[3], '--root');
    assert.equal(argv[4], path.resolve(p.dir));
    assert.deepEqual(argv.slice(5), ['--workspace', 'projects'], 'le workspace est EXPLICITE, jamais devine');
  }
  const run = lanceur();
  const r = runMemoireHumaine({ projectPath: p.dir, reason: 'manual', env: p.env, runFn: run });
  assert.equal(r.skipped, 'motif-hors-cadence')
  assert.equal(run.appels.length, 0, '`manual` ne publie pas : le rituel de doc, ce sont les 3 motifs');
});

test('R3 : `publier_sur` vide DESACTIVE le cablage sans toucher au code', () => {
  const p = tmpProjet({ memoireHumaine: { publier: true, publier_sur: [] } });
  const run = lanceur();
  const r = runMemoireHumaine({ projectPath: p.dir, reason: 'version', env: p.env, runFn: run });
  assert.equal(r.triggered, false);
  assert.equal(run.appels.length, 0);
});

test('R3 : `espace` nomme l’espace cible independamment du nom de dossier', () => {
  const p = tmpProjet({ memoireHumaine: { publier: true, espace: 'IakaCockpit' } });
  const run = lanceur();
  runMemoireHumaine({ projectPath: p.dir, reason: 'pause', env: p.env, runFn: run });
  assert.equal(run.appels[0].argv[2], 'IakaCockpit');
});

test('R3 NON-BLOQUANT : script en echec -> rapport ok:false, JAMAIS d’exception', () => {
  const p = tmpProjet({ memoireHumaine: { publier: true } });
  const run = lanceur({ status: 1, stderr: 'appflowy-doc: instance injoignable (http://x) : ECONNREFUSED\n' });
  const r = runMemoireHumaine({ projectPath: p.dir, reason: 'version', env: p.env, runFn: run });
  assert.equal(r.triggered, true);
  assert.equal(r.ok, false);
  assert.match(r.error, /instance injoignable/, 'le message NET de la skill est releve tel quel');
  assert.match(formatMemoireHumaine(r), /non bloquant/);
});

test('R3 NON-BLOQUANT : un lanceur qui LEVE est ravale en rapport', () => {
  const p = tmpProjet({ memoireHumaine: { publier: true } });
  const r = runMemoireHumaine({
    projectPath: p.dir, reason: 'version', env: p.env,
    runFn: () => { throw new Error('boum'); },
  });
  assert.equal(r.triggered, false);
  assert.equal(r.skipped, 'garde');
  assert.match(formatMemoireHumaine(r), /ravale/);
});

test('R3 : skill de publication non deployee -> ignoree proprement', () => {
  const p = tmpProjet({ memoireHumaine: { publier: true } });
  const r = runMemoireHumaine({
    projectPath: p.dir, reason: 'version',
    env: { IAKAFRAME_APPFLOWY_DOC: path.join(p.dir, 'inexistant.mjs') }, runFn: lanceur(),
  });
  assert.equal(r.skipped, 'skill-absente');
  assert.equal(typeof appflowyDocScript({ IAKAFRAME_APPFLOWY_DOC: '' }), 'string');
});

test('R3 GREFFE : doSnapshot publie sur pause, et l’etat des lieux reste ECRIT si ca echoue', () => {
  const p = tmpProjet({ memoireHumaine: { publier: true } });
  const vus = [];
  // 1) Motif propage tel quel, publication reussie.
  let r = doSnapshot({
    projectPath: p.dir, reason: 'pause',
    cadenceRun: () => ({ triggered: false }), projectCadenceRun: () => ({ triggered: false }),
    memoireHumaineRun: (a) => { vus.push(a.reason); return { triggered: true, ok: true, projet: 'X', resume: 'ok' }; },
  });
  assert.deepEqual(vus, ['pause']);
  assert.equal(r.memoireHumaine.ok, true);
  assert.ok(fs.existsSync(path.join(p.dir, 'specs', 'etat-des-lieux.md')));

  // 2) GARANTIE NON-BLOQUANTE : la greffe LEVE -> l'etat des lieux est quand meme ecrit.
  fs.rmSync(path.join(p.dir, 'specs'), { recursive: true, force: true });
  r = doSnapshot({
    projectPath: p.dir, reason: 'version',
    cadenceRun: () => ({ triggered: false }), projectCadenceRun: () => ({ triggered: false }),
    memoireHumaineRun: () => { throw new Error('catastrophe'); },
  });
  assert.equal(r.memoireHumaine.skipped, 'garde');
  assert.ok(fs.existsSync(path.join(p.dir, 'specs', 'etat-des-lieux.md')),
    'l’etat des lieux DOIT survivre a un echec de publication');
  assert.ok(fs.existsSync(path.join(p.dir, 'specs', 'etat-des-lieux.html')));
});

test('R3 : un projet SANS opt-in traverse doSnapshot sans rien publier (parite canon-absent)', () => {
  const p = tmpProjet({ frame: 'iakaframe' });
  const run = lanceur();
  const r = doSnapshot({
    projectPath: p.dir, reason: 'version',
    cadenceRun: () => ({ triggered: false }), projectCadenceRun: () => ({ triggered: false }),
    memoireHumaineRun: (a) => runMemoireHumaine({ ...a, env: p.env, runFn: run }),
  });
  assert.equal(r.memoireHumaine.skipped, 'non-opte');
  assert.equal(run.appels.length, 0);
});
