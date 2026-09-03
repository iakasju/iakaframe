// G1/G2 du Lot A (mode guide du terminal, specs/instructions/cli-mode-guide-selections.md §
// Preuve). ⚠️ Piege nomme par le decideur : « un test d'interactivite est NOTOIREMENT facile a
// ecrire a vide » — G1 seul (« aucun prompt en non-TTY ») est vert sur un CLI ou --guide n'est
// branche NULLE PART. D'ou les deux controles :
//   - G1 (ce fichier) : contrôle NEGATIF — sur les 10 cibles, `--guide` ne change RIEN quand
//     l'execution n'est pas interactive (spawnSync : stdin = pipe, jamais un TTY), compare a
//     L'EXECUTION DE REFERENCE (jamais une chaine figee dans le test), sur QUATRE variantes.
//   - G2 (test/guidage.test.js + test/guard-guidage-autorite.test.js) : contrôles POSITIFS —
//     le moteur EXISTE, produit une liste DERIVEE de l'autorite reelle, une ligne A3 rejouable, et
//     ne recopie aucune valeur en dur. Sans eux, G1 serait un temoin vide.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PassThrough } from 'node:stream';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, '..', 'src', 'index.js');
const REPO = path.join(HERE, '..', '..');

function cli(args, env = {}) {
  const r = spawnSync(process.execPath, [CLI, ...args], {
    cwd: REPO, encoding: 'utf8', env: { ...process.env, ...env },
  });
  return { stdout: r.stdout, stderr: r.stderr, status: r.status };
}

// Les 10 cibles (§ LOT A) — args MINIMAUX, deterministes, SANS EFFET DE BORD (chacune echoue au
// controle d'usage AVANT toute ecriture, sauf `list` qui rend son resume normal). `--guide` est
// insere APRES le verbe, avant les autres options, dans les deux executions comparees.
const CIBLES = [
  ['models set', ['models', 'set']],
  ['models unset', ['models', 'unset']],
  ['show', ['show']],
  ['list', ['list']],
  ['add', ['add']],
  ['remove', ['remove']],
  ['attach', ['attach']],
  ['detach', ['detach']],
  ['frame use', ['frame', 'use']],
  ['switch', ['switch']],
];

// Quatre variantes : non-TTY (baseline, TOUJOURS vrai sous spawnSync), --json, CI=1,
// IAKA_NON_INTERACTIF=1 — exercees UNE PAR UNE (jamais cumulees), § Preuve/G1.
const VARIANTES = [
  ['non-TTY (baseline)', { extra: [], env: {} }],
  ['--json', { extra: ['--json'], env: {} }],
  ['CI=1', { extra: [], env: { CI: '1' } }],
  ['IAKA_NON_INTERACTIF=1', { extra: [], env: { IAKA_NON_INTERACTIF: '1' } }],
];

for (const [nom, base] of CIBLES) {
  for (const [nomVariante, { extra, env }] of VARIANTES) {
    test(`G1 : ${nom} — --guide ne change RIEN (${nomVariante}), compare a l'execution de reference`, () => {
      const sansGuide = cli([...base, ...extra], env);
      const avecGuide = cli([...base, '--guide', ...extra], env);
      assert.equal(avecGuide.stdout, sansGuide.stdout, `stdout doit rester IDENTIQUE (${nom}, ${nomVariante})\n--guide:\n${avecGuide.stdout}\nsans:\n${sansGuide.stdout}`);
      assert.equal(avecGuide.stderr, sansGuide.stderr, `stderr doit rester IDENTIQUE (${nom}, ${nomVariante})`);
      assert.equal(avecGuide.status, sansGuide.status, `exit code doit rester IDENTIQUE (${nom}, ${nomVariante})`);
    });
  }
}

// --- G2 (contrôle POSITIF n°1, complementaire a guidage.test.js/guard-guidage-autorite.test.js) :
//     l'ARGV assemble par un parcours guide, REJOUE en non-interactif, produit le MEME EFFET que
//     l'invocation normale — preuve de l'ABSENCE DE SECOND CHEMIN D'ECRITURE (A4.2, G2.3). --------

test('G2.3 : models set — un argv "comme assemble par le guidage" ecrit exactement comme la forme normale', () => {
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-g2-models-'));
  const argv = ['models', 'set', 'gandalf', 'opus', '--path', proj];   // forme qu'un parcours guide assemblerait
  const r = cli(argv);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const conf = JSON.parse(fs.readFileSync(path.join(proj, 'iakaframe.json'), 'utf8'));
  assert.equal(conf.modelOverrides.gandalf, 'opus');
  assert.ok(fs.existsSync(path.join(proj, '.claude', 'agents', 'gandalf.md')));
  fs.rmSync(proj, { recursive: true, force: true });
});

test('G2.3 : show — un argv "comme assemble par le guidage" (id + --type) rend le MEME contrat que --json direct', () => {
  const guide = cli(['show', 'gandalf', '--type', 'personas', '--json']);
  const direct = cli(['show', 'gandalf', '--json']);
  assert.equal(guide.status, 0);
  assert.deepEqual(JSON.parse(guide.stdout), JSON.parse(direct.stdout));
});

test('G2.3 : list — un argv "comme assemble par le guidage" (type seul) rend le MEME inventaire que l\'appel direct', () => {
  const guide = cli(['list', 'personas', '--json']);
  const direct = cli(['list', 'personas', '--json']);
  assert.deepEqual(JSON.parse(guide.stdout), JSON.parse(direct.stdout));
});

test('G2.3 : switch — un argv "comme assemble par le guidage" (methode+team) assemble EXACTEMENT comme l\'appel direct', () => {
  const guide = cli(['assemble', 'iakaframe', 'iakaframe-8', '--json']);   // assemble() = le coeur partage par switch
  assert.equal(guide.status, 0);
  const o = JSON.parse(guide.stdout);
  assert.equal(o.descriptor.methodId, 'iakaframe');
  assert.equal(o.descriptor.teamId, 'iakaframe-8');
});

test('G2.3 : remove — un argv "comme assemble par le guidage" sur un id EXISTANT MAIS reference refuse EXACTEMENT comme l\'appel direct (RESTRICT)', () => {
  const guide = cli(['remove', 'skill', 'iakaframe-cadrage', '--json']);
  const direct = cli(['remove', 'skill', 'iakaframe-cadrage', '--json']);
  assert.equal(guide.status, 1);
  assert.equal(direct.status, 1);
  assert.deepEqual(JSON.parse(guide.stdout), JSON.parse(direct.stdout));
});

// --- A4.3, verifie a la SORTIE (complementaire au verrou d'entree, test/guidage.test.js) : aucune
// des 10 cibles ne peut jamais VOIR --force/--yes/--cascade dans un argv assemble par le guidage —
// le verrou assemblerArgv() est deja mutation-eprouve ; ceci verifie qu'AUCUN appelant ne le
// contourne en construisant son propre tableau APRES l'avoir appele.
test('A4.3 : aucun fichier de commande ne construit un argv guide contenant --force/--yes/--cascade en dur', () => {
  const dir = path.join(HERE, '..', 'src', 'commands');
  const interdits = /suite\.push\([^)]*(--force|--yes|--cascade|--autoriser-creation-depot)/;
  const offenders = [];
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.js')) continue;
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    if (interdits.test(src)) offenders.push(f);
  }
  assert.deepEqual(offenders, []);
});

// --- G2 (contrôle POSITIF n°2) : PARCOURS COMPLET, en process, du palier 1 REEL — pas seulement le
// moteur isole (guidage.test.js) ni l'argv rejoue (G2.3 ci-dessus), mais le CABLAGE dans models.js
// lui-meme : `process.stdin`/`process.stdout` sont remplaces par des flux factices AVEC `isTTY:true`
// et SANS `setRawMode` — `peutDemander()` autorise le guidage, `peutModeBrut()` le refuse (repli
// automatique, A1), le palier 1 tourne donc pour de vrai sur `readline`. C'est la preuve que
// `--guide` n'est pas un drapeau mort : sans ce test, une regression qui deconnecterait le cablage
// (ex. `peutDemander` jamais atteint) resterait invisible a G1 (qui ne peut, PAR CONSTRUCTION, JAMAIS
// entrer cette branche puisqu'il tourne hors TTY).
async function avecTTYFactice(reponses, executer) {
  const stdin = new PassThrough(); stdin.isTTY = true;     // TTY... mais SANS setRawMode -> palier 1
  const stdout = new PassThrough(); stdout.isTTY = true;
  const stderr = new PassThrough();
  let sortie = '';
  stdout.on('data', (d) => { sortie += d.toString(); });
  stderr.on('data', (d) => { sortie += d.toString(); });   // fail() humain ecrit sur stderr (lib/output.js)
  const stdinOrig = Object.getOwnPropertyDescriptor(process, 'stdin');
  const stdoutOrig = Object.getOwnPropertyDescriptor(process, 'stdout');
  const stderrOrig = Object.getOwnPropertyDescriptor(process, 'stderr');
  Object.defineProperty(process, 'stdin', { value: stdin, configurable: true });
  Object.defineProperty(process, 'stdout', { value: stdout, configurable: true });
  Object.defineProperty(process, 'stderr', { value: stderr, configurable: true });
  // Chaque reponse est ecrite apres un tick (setImmediate) : le moteur ferme et rouvre une
  // interface readline PAR QUESTION (cf. lib/guidage.js) — l'ecrire trop tot la perd.
  const alimenter = (async () => {
    for (const r of reponses) {
      await new Promise((res) => setImmediate(res));
      stdin.write(r + '\n');
    }
  })();
  try {
    await Promise.all([executer(), alimenter]);
  } finally {
    Object.defineProperty(process, 'stdin', stdinOrig);
    Object.defineProperty(process, 'stdout', stdoutOrig);
    Object.defineProperty(process, 'stderr', stderrOrig);
  }
  return sortie;
}

test('G2 (bout en bout, palier 1 REEL) : models set --guide — persona puis modele, ecrit exactement comme la forme normale', async () => {
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-g2-e2e-'));
  const { runModels } = await import('../src/commands/models.js');
  const sortie = await avecTTYFactice(['1', '1'], () => runModels(['set', '--guide', '--path', proj]));

  // Le menu vient bien de personasForTarget (G2.1) et l'echo A3 est present et rejouable (G2.2/G2.3).
  assert.match(sortie, /Persona a surcharger :/);
  assert.match(sortie, /Modele :/);
  assert.match(sortie, /→ iakaframe models set \S+ \S+ --path/);

  const conf = JSON.parse(fs.readFileSync(path.join(proj, 'iakaframe.json'), 'utf8'));
  assert.equal(typeof conf.modelOverrides, 'object');
  assert.equal(Object.keys(conf.modelOverrides).length, 1, sortie);
  fs.rmSync(proj, { recursive: true, force: true });
});

test('G2 (bout en bout, palier 1 REEL) : models set --guide, valeur libre — assemble puis appelle le CHEMIN NORMAL (A4.2), refus AFFICHE (A4.3)', async () => {
  const proj = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-g2-e2e-'));
  const { runModels } = await import('../src/commands/models.js');
  // '1' = premiere persona proposee ; entree LIBRE pour le modele (position = items.length+1 = 6),
  // valeur HORS VOCABULAIRE -> le CHEMIN NORMAL (validateModelValue) doit refuser, PAS le moteur.
  const sortie = await avecTTYFactice(['1', '6', 'zzz-modele-inconnu'], () => runModels(['set', '--guide', '--path', proj]));

  assert.match(sortie, /hors du vocabulaire accepte/, sortie);
  // A4.3 : le refus PEUT MENTIONNER --force en texte (c'est le chemin normal qui le dit, pas le
  // guidage) — ce qui est INTERDIT, c'est que le guidage l'AJOUTE a l'ARGV EXECUTE (l'echo A3).
  const echo = sortie.match(/→ iakaframe .*/)?.[0] || '';
  assert.doesNotMatch(echo, /--force/, `l'argv assemble par le guidage ne doit JAMAIS porter --force : ${echo}`);
  assert.ok(!fs.existsSync(path.join(proj, 'iakaframe.json')), 'rien ne doit etre ecrit sur un refus');
  process.exitCode = 0;   // le refus (fail()) positionne exitCode=1 : neutralise pour ne pas polluer la suite
  fs.rmSync(proj, { recursive: true, force: true });
});
