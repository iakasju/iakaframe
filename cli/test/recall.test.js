// T2 - `recall` : rappel plein-texte sur l'historique brut du canon (instruction
// boucle-apprentissage-incrementale.md § 5.2). Couvre : requete trouvee / non trouvee, sortie
// --json, override --home / IAKA_MEMORY_HOME, classement par recence, semantiques smart-case, et le
// cas rg ABSENT (repli Node marque degrade). Les tests N'ECRIVENT JAMAIS dans le vrai ~/.iaka/ : tout
// passe par un tmpdir avec des transcripts de fixture, et NE DEPENDENT PAS d'une installation systeme
// (le moteur Node est force ou detecte ; le chemin ripgrep n'est exerce que si rg est reellement la).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { recall, transcriptsDir, dateFromName, rgAvailable } from '../src/lib/recall.js';
import { ensureLayout } from '../src/lib/memory.js';
import { runRecall } from '../src/commands/recall.js';

// Prepare un canon temporaire avec quelques transcripts de fixture.
function tmpCanon(files = {}) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-recall-'));
  ensureLayout(home);
  for (const [name, content] of Object.entries(files)) {
    const full = path.join(transcriptsDir(home), name);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
  }
  return home;
}
const rm = (home) => fs.rmSync(home, { recursive: true, force: true });

// Capture console.log/console.error d'un appel synchrone (pour tester la couche commande).
function capture(fn) {
  const out = [], err = [];
  const ol = console.log, oe = console.error, code = process.exitCode;
  console.log = (...a) => out.push(a.join(' '));
  console.error = (...a) => err.push(a.join(' '));
  try { fn(); } finally { console.log = ol; console.error = oe; }
  const exitCode = process.exitCode;
  process.exitCode = code; // ne pas polluer le runner de tests
  return { out: out.join('\n'), err: err.join('\n'), exitCode };
}

// --- lib recall : requete trouvee / non trouvee (moteur Node force = deterministe) ----------------
test('recall : retrouve un fait present dans un transcript passe (invariant 3)', () => {
  const home = tmpCanon({
    '2026-07-10--claude--iakaframe.md': '# session\n- decision: Forgejo sur le LAN iakabox\n- autre\n',
  });
  try {
    const r = recall(home, 'Forgejo', { engine: 'node' });
    assert.equal(r.ok, true);
    assert.equal(r.count, 1);
    const hit = r.results[0];
    assert.equal(hit.file, path.join('transcripts', '2026-07-10--claude--iakaframe.md'));
    assert.equal(hit.line, 2);
    assert.match(hit.text, /Forgejo sur le LAN/);
    assert.equal(hit.date, '2026-07-10');
    assert.ok(path.isAbsolute(hit.path));
  } finally { rm(home); }
});

test('recall : requete sans correspondance -> count 0, ok true (pas une erreur)', () => {
  const home = tmpCanon({ '2026-07-10--claude--x.md': '- rien de pertinent ici\n' });
  try {
    const r = recall(home, 'introuvable_zzz', { engine: 'node' });
    assert.equal(r.ok, true);
    assert.equal(r.count, 0);
    assert.deepEqual(r.results, []);
  } finally { rm(home); }
});

// --- Classement par recence (§ 5.2 : recence puis pertinence) -------------------------------------
test('recall : classe les passages par recence (date de fichier decroissante)', () => {
  const home = tmpCanon({
    '2026-07-05--claude--vieux.md': '- ancienne mention de canon\n',
    '2026-07-16--claude--recent.md': '- mention recente de canon\n',
    '2026-07-10--claude--milieu.md': '- mention intermediaire de canon\n',
  });
  try {
    const r = recall(home, 'canon', { engine: 'node' });
    assert.equal(r.count, 3);
    assert.deepEqual(r.results.map((x) => x.date), ['2026-07-16', '2026-07-10', '2026-07-05']);
  } finally { rm(home); }
});

// --- Sous-dossier odin/ (miroir #odin) est bien parcouru ------------------------------------------
test('recall : parcourt aussi les sous-dossiers (transcripts/odin/)', () => {
  const home = tmpCanon({
    'odin/2026-07-16--odin--arbitrage.md': '- Stephane tranche: MVP d\'abord puis iterer\n',
  });
  try {
    const r = recall(home, 'MVP', { engine: 'node' });
    assert.equal(r.count, 1);
    assert.equal(r.results[0].file, path.join('transcripts', 'odin', '2026-07-16--odin--arbitrage.md'));
  } finally { rm(home); }
});

// --- Cas limites : transcripts absent, requete vide -----------------------------------------------
test('recall : dossier transcripts absent -> count 0, ok true (degradation gracieuse)', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-recall-empty-'));
  try {
    assert.equal(fs.existsSync(transcriptsDir(home)), false);
    const r = recall(home, 'quoi', { engine: 'node' });
    assert.equal(r.ok, true);
    assert.equal(r.count, 0);
  } finally { rm(home); }
});

test('recall : requete vide -> ok false, reason empty-query', () => {
  const home = tmpCanon();
  try {
    const r = recall(home, '   ', { engine: 'node' });
    assert.equal(r.ok, false);
    assert.equal(r.reason, 'empty-query');
  } finally { rm(home); }
});

// --- Semantiques smart-case (litteral) ------------------------------------------------------------
test('recall : smart-case (minuscule = insensible ; majuscule = sensible)', () => {
  const home = tmpCanon({ '2026-07-10--claude--case.md': '- Forgejo et forgejo et FORGEJO\n- discord\n' });
  try {
    // Tout minuscule -> insensible : matche la ligne (une seule ligne contient les 3 variantes).
    assert.equal(recall(home, 'forgejo', { engine: 'node' }).count, 1);
    // Contient une majuscule -> sensible : 'Discord' (majuscule) absent, 'discord' present mais casse differente.
    assert.equal(recall(home, 'Discord', { engine: 'node' }).count, 0);
    assert.equal(recall(home, 'discord', { engine: 'node' }).count, 1);
  } finally { rm(home); }
});

// --- Degradation : rg absent -> repli Node marque degrade -----------------------------------------
test('recall : moteur Node marque degraded true (repli rg absent)', () => {
  const home = tmpCanon({ '2026-07-10--claude--x.md': '- une ligne trouvable\n' });
  try {
    const r = recall(home, 'trouvable', { engine: 'node' });
    assert.equal(r.degraded, true);
    assert.equal(r.engine, 'node');
  } finally { rm(home); }
});

test('recall : rg absent du PATH -> auto-detection retombe sur Node (degraded), sans crash', () => {
  const home = tmpCanon({ '2026-07-10--claude--x.md': '- passerelle discord\n' });
  const oldPath = process.env.PATH;
  process.env.PATH = ''; // aucun binaire joignable -> rgAvailable() = false
  try {
    const r = recall(home, 'passerelle'); // engine auto
    assert.equal(r.ok, true);
    assert.equal(r.engine, 'node');
    assert.equal(r.degraded, true);
    assert.equal(r.count, 1);
  } finally { process.env.PATH = oldPath; rm(home); }
});

// --- dateFromName (helper d'horodatage) -----------------------------------------------------------
test('dateFromName : extrait le prefixe date du nom, sinon null', () => {
  assert.equal(dateFromName('2026-07-16--claude--scope.md'), '2026-07-16');
  assert.equal(dateFromName('/abs/path/2026-01-02--odin--x.md'), '2026-01-02');
  assert.equal(dateFromName('sans-date.md'), null);
});

// --- Couche commande : --json + override --home ---------------------------------------------------
test('commande recall : --json + --home rend le rapport structure', () => {
  const home = tmpCanon({ '2026-07-12--claude--iaka.md': '- le canon vit sous ~/.iaka/memory\n' });
  try {
    const { out, exitCode } = capture(() => runRecall(['--json', '--home', home, 'canon']));
    const report = JSON.parse(out);
    assert.equal(report.ok, true);
    assert.equal(report.count, 1);
    assert.equal(report.results[0].line, 1);
    assert.match(report.results[0].text, /canon vit sous/);
    assert.notEqual(exitCode, 1);
  } finally { rm(home); }
});

test('commande recall : requete multi-mots (positionals joints)', () => {
  const home = tmpCanon({ '2026-07-12--claude--iaka.md': '- mode absence via la passerelle Discord\n' });
  try {
    const { out } = capture(() => runRecall(['--json', '--home', home, 'passerelle', 'Discord']));
    const report = JSON.parse(out);
    assert.equal(report.query, 'passerelle Discord');
    assert.equal(report.count, 1);
  } finally { rm(home); }
});

// --- Couche commande : override par IAKA_MEMORY_HOME (sans --home) ---------------------------------
test('commande recall : override par IAKA_MEMORY_HOME (sans --home)', () => {
  const home = tmpCanon({ '2026-07-12--claude--iaka.md': '- fait archive: ripgrep est le moteur MVP\n' });
  const old = process.env.IAKA_MEMORY_HOME;
  process.env.IAKA_MEMORY_HOME = home;
  try {
    const { out } = capture(() => runRecall(['--json', 'ripgrep']));
    const report = JSON.parse(out);
    assert.equal(report.count, 1);
    assert.match(report.results[0].text, /ripgrep est le moteur MVP/);
  } finally {
    if (old === undefined) delete process.env.IAKA_MEMORY_HOME; else process.env.IAKA_MEMORY_HOME = old;
    rm(home);
  }
});

// --- Couche commande : requete vide -> usage + exit 1 ---------------------------------------------
test('commande recall : requete vide -> exit 1 + usage', () => {
  const { exitCode, err } = capture(() => runRecall([]));
  assert.equal(exitCode, 1);
  assert.match(err, /Usage : iakaframe recall/);
});

// --- Couche commande : rg absent -> avertissement clair sur stderr, resultats sur stdout ----------
test('commande recall : rg absent -> avertissement clair, jamais de crash', () => {
  const home = tmpCanon({ '2026-07-12--claude--iaka.md': '- trace de session\n' });
  const oldPath = process.env.PATH;
  process.env.PATH = '';
  try {
    const { out, err } = capture(() => runRecall(['--home', home, 'session']));
    assert.match(err, /ripgrep .* introuvable/);
    assert.match(out, /1 passage\(s\)/);
  } finally { process.env.PATH = oldPath; rm(home); }
});

// --- Chemin ripgrep REEL : exerce SEULEMENT si rg est un vrai binaire du PATH (sinon saute) --------
test('recall : moteur ripgrep si rg est installe (sinon test saute)', { skip: !rgAvailable() }, () => {
  const home = tmpCanon({ '2026-07-10--claude--rg.md': '- fait retrouve par ripgrep reel\n' });
  try {
    const r = recall(home, 'ripgrep reel'); // engine auto -> rg
    assert.equal(r.engine, 'rg');
    assert.equal(r.degraded, false);
    assert.equal(r.count, 1);
    assert.match(r.results[0].text, /retrouve par ripgrep reel/);
  } finally { rm(home); }
});
