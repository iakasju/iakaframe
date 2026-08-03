// Garde du verbe `iakaframe models` (instruction specs/instructions/models-par-rolekey.md).
//
// Contrat verifie ici, dans l'ordre des criteres de l'instruction :
//   - l'aide sort proprement (contrat help-systemique) ;
//   - l'etat des lieux tourne SANS RESEAU et sans TTY, sans planter ;
//   - il couvre TOUS les roleKeys de la methode active, y compris non couverts ;
//   - AUCUNE ecriture ni aucun telechargement hors gate (le binding est intact apres un run) ;
//   - les 5 cibles sont couvertes, claude/codex etant des VERIFICATIONS (rien a telecharger) ;
//   - la source unique des suggestions couvre le referentiel de roles (pas de trou silencieux) ;
//   - neutralite : aucun hote prive en dur dans le code ni dans la donnee.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { hostsForTarget, replaceModelInLine, ageInDays, buildState, TARGETS, loadSuggestions,
         writeAssignments, summarize } from '../src/commands/models.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, '..', 'src', 'index.js');
const ROOT = path.join(HERE, '..', '..');           // racine de la bibliotheque iakaframe

// Hote de sonde volontairement mort : les tests ne doivent JAMAIS dependre d'un service vivant.
const DEAD = '203.0.113.1';                         // TEST-NET-3 (RFC 5737), non routable
// Par defaut on ne fournit AUCUN hote LAN : les cibles distantes n'ont alors rien a sonder et la
// suite ne paie pas 3 timeouts reseau par execution. Un seul test ci-dessous exerce le chemin
// « hote injoignable » avec DEAD — c'est la ou ce cout se justifie.
const NO_LAN = 'localhost';

function run(args, env = {}) {
  return execFileSync('node', [CLI, ...args], {
    cwd: ROOT, encoding: 'utf8',
    env: { ...process.env, IAKAFRAME_HOSTS: NO_LAN, ...env },
  });
}

test('models --help : aide propre, exit 0, aucune stack', () => {
  const out = run(['models', '--help']);
  assert.ok(/Usage : iakaframe/.test(out), 'ligne Usage attendue');
  assert.ok(out.includes('models'), 'le verbe doit etre cite');
  assert.ok(!/ERR_PARSE_ARGS_UNKNOWN_OPTION/.test(out), 'aucune erreur de parse');
  assert.ok(!/^\s+at \w/m.test(out), 'aucune trace de stack');
});

test('models --json : tourne sans reseau, enveloppe C-JSON conforme', () => {
  const out = run(['models', '--json', '--timeout', '1']);
  const o = JSON.parse(out);
  assert.equal(o.ok, true, 'ok doit etre en premiere cle et vrai');
  assert.ok(Array.isArray(o.roles), 'roles doit etre une collection');
  assert.equal(o.count, o.roles.length, 'count doit egaler la longueur exacte');
  assert.ok(o.suggestions && o.suggestions.updatedAt, 'la fraicheur des suggestions est rendue');
});

test('models --json : couvre tous les roleKeys de la methode active', () => {
  const o = JSON.parse(run(['models', '--json', '--timeout', '1']));
  const method = fs.readFileSync(path.join(ROOT, 'methods', 'iakaframe.md'), 'utf8');
  const declared = (method.match(/roleKeys:\s*\[([^\]]+)\]/) || [, ''])[1]
    .split(',').map(s => s.trim()).filter(Boolean);
  assert.ok(declared.length >= 9, 'la methode doit declarer ses roleKeys');
  for (const key of declared) {
    assert.ok(o.roles.some(r => r.roleKey === key), `roleKey manquant a l'etat des lieux : ${key}`);
  }
});

test('models --json : les 5 cibles sont mesurees, claude/codex sans telechargement', () => {
  // Seul test a exercer un hote LAN injoignable : les cibles distantes doivent etre RENDUES
  // (available:false) et non omises — un inventaire qui tait une cible morte ment par silence.
  const o = JSON.parse(run(['models', '--json', '--timeout', '1'], { IAKAFRAME_HOSTS: DEAD }));
  assert.equal(o.targets.find(t => t.target === 'ollama-distant').available, false);
  const ids = o.targets.map(t => t.target);
  for (const t of ['ollama-local', 'ollama-distant', 'litellm', 'claude', 'codex']) {
    assert.ok(ids.includes(t), `cible manquante : ${t}`);
  }
  for (const t of o.targets.filter(x => ['claude', 'codex'].includes(x.target))) {
    assert.match(t.installMeans, /verification/i, 'claude/codex : installer = verifier, pas telecharger');
  }
});

test('--binding : lit le binding demande, et ses affectations sont celles du canon', () => {
  const o = JSON.parse(run(['models', '--json', '--timeout', '1', '--binding', 'iakaframe-ollama-default']));
  assert.equal(o.bindingId, 'iakaframe-ollama-default');
  const models = new Set(o.roles.flatMap(r => r.personas.map(p => p.model)));
  assert.ok(models.has('qwen2.5-coder:7b'), 'le binding ollama doit porter des modeles locaux');
  assert.ok(!models.has('sonnet') && !models.has('opus'), 'aucun modele du binding claude ne doit fuiter');
  // Le binding derive de la source unique : tout roleKey couvert doit etre « en-place ».
  for (const r of o.roles.filter(x => x.covered)) {
    assert.equal(r.status, 'en-place', `${r.roleKey} devrait etre aligne sur la suggestion`);
  }
});

test('--binding etranger a la team active : refus explicite, exit 1', () => {
  assert.throws(() => run(['models', '--json', '--timeout', '1', '--binding', 'scrum-default']),
    (err) => {
      assert.equal(err.status, 1, 'exit code 1 attendu');
      const o = JSON.parse(err.stdout);
      assert.equal(o.ok, false);
      assert.match(o.error, /binding inconnu ou etranger/);
      return true;
    });
});

test('un etat des lieux n\'ecrit RIEN (aucune ecriture hors gate)', () => {
  const binding = path.join(ROOT, 'bindings', 'iakaframe-claude-default.md');
  const before = fs.readFileSync(binding, 'utf8');
  run(['models', '--json', '--timeout', '1']);
  run(['models', '--timeout', '1']);                 // rendu humain, sans TTY -> etat des lieux seul
  assert.equal(fs.readFileSync(binding, 'utf8'), before, 'le binding doit etre intact');
});

test('hostsForTarget : local et distant ne sondent jamais les memes hotes', () => {
  const local = TARGETS.find(t => t.id === 'ollama-local');
  const distant = TARGETS.find(t => t.id === 'ollama-distant');
  const hosts = ['localhost', '127.0.0.1', '10.0.0.5'];
  assert.deepEqual(hostsForTarget(local, hosts), ['localhost', '127.0.0.1']);
  assert.deepEqual(hostsForTarget(distant, hosts), ['10.0.0.5'], 'le LAN exclut la machine locale');
  assert.deepEqual(hostsForTarget(distant, ['localhost']), [], 'sans hote LAN, rien a sonder');
});

test('replaceModelInLine : remplace le modele et preserve le reste de la ligne', () => {
  const line = '  - { personaId: gimli,    runner: claude-code, model: "sonnet", tools: [Read, Edit] }';
  const out = replaceModelInLine(line, 'qwen2.5-coder:7b');
  assert.ok(out.includes('model: "qwen2.5-coder:7b"'), 'le modele doit etre remplace');
  assert.ok(out.includes('personaId: gimli'), 'la persona doit etre preservee');
  assert.ok(out.includes('tools: [Read, Edit]'), 'les outils doivent etre preserves');
  assert.ok(out.includes('runner: claude-code'), 'le runner doit etre preserve');
  assert.equal(replaceModelInLine('  ligne sans champ modele', 'x'), null, 'ligne sans model -> null');
});

test('writeAssignments : ecrit les personas du roleKey, laisse les autres intactes', () => {
  const tmp = path.join(HERE, 'fixtures', `binding-tmp-${process.pid}.md`);
  fs.writeFileSync(tmp, [
    '---', 'id: t', 'teamId: t8', 'assignments:',
    '  - { personaId: gimli,   runner: claude-code, model: "sonnet", tools: [Read] }',
    '  - { personaId: legolas, runner: claude-code, model: "sonnet", tools: [Read] }',
    '---', '# corps', '',
  ].join('\n'), 'utf8');
  try {
    const res = writeAssignments({ bindingPath: tmp }, ['gimli'], 'qwen2.5-coder:7b');
    assert.equal(res.ok, true);
    assert.deepEqual(res.written, ['gimli']);
    const after = fs.readFileSync(tmp, 'utf8');
    assert.match(after, /personaId: gimli,\s+runner: claude-code, model: "qwen2\.5-coder:7b"/);
    assert.match(after, /personaId: legolas,\s+runner: claude-code, model: "sonnet"/, 'les autres personas ne bougent pas');
    assert.match(after, /# corps/, 'le corps du document est preserve');

    // Persona absente du binding : on n'ecrit rien plutot que d'ecrire au hasard.
    const miss = writeAssignments({ bindingPath: tmp }, ['inconnu'], 'x');
    assert.equal(miss.ok, false);
    assert.deepEqual(miss.written, []);
  } finally {
    fs.rmSync(tmp, { force: true });
  }
});

test('ageInDays : mesure la peremption, tolere une date illisible', () => {
  const now = new Date('2026-08-03T12:00:00Z');
  assert.equal(ageInDays('2026-08-03', now), 0);
  assert.equal(ageInDays('2026-05-05', now), 90);
  assert.equal(ageInDays('pas-une-date', now), null);
  assert.equal(ageInDays(undefined, now), null);
});

test('buildState : les statuts distinguent en-place, a-installer et non-couvert', () => {
  const suggestions = { roles: { dev: { recommended: 'm1', alternatives: [], requires: [] },
                                 qualite: { recommended: 'm2', alternatives: [], requires: [] },
                                 orphelin: { recommended: 'm3', alternatives: [], requires: [] } } };
  const canon = { roles: [
    { roleKey: 'dev',      covered: true,  personas: [{ id: 'a', name: 'A', model: 'm1' }] },
    { roleKey: 'qualite',  covered: true,  personas: [{ id: 'b', name: 'B', model: 'autre' }] },
    { roleKey: 'orphelin', covered: false, personas: [] },
  ] };
  const probes = [{ target: 'ollama-distant', available: true, kind: 'ollama', models: ['m2'] }];
  const roles = buildState({ canon, suggestions, probes });
  assert.equal(roles.find(r => r.roleKey === 'dev').status, 'en-place');
  assert.equal(roles.find(r => r.roleKey === 'qualite').status, 'disponible');
  assert.equal(roles.find(r => r.roleKey === 'orphelin').status, 'non-couvert');
});

test('source unique : chaque roleKey de la methode a une suggestion', () => {
  const s = loadSuggestions(ROOT);
  assert.ok(s, 'models/suggestions.json doit exister a la racine de la bibliotheque');
  const method = fs.readFileSync(path.join(ROOT, 'methods', 'iakaframe.md'), 'utf8');
  const declared = (method.match(/roleKeys:\s*\[([^\]]+)\]/) || [, ''])[1]
    .split(',').map(x => x.trim()).filter(Boolean);
  for (const key of declared) {
    assert.ok(s.roles[key], `suggestion manquante pour le roleKey ${key}`);
    assert.ok(s.roles[key].recommended, `pas de modele recommande pour ${key}`);
  }
});

test('neutralite : aucun hote prive en dur dans le code ni dans la donnee', () => {
  const priv = /\b(?:10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)\b/;
  for (const f of [path.join(HERE, '..', 'src', 'commands', 'models.js'),
                   path.join(ROOT, 'models', 'suggestions.json')]) {
    const src = fs.readFileSync(f, 'utf8');
    assert.ok(!priv.test(src), `hote prive en dur dans ${path.basename(f)} (doctrine de neutralite)`);
  }
});

// Recette du 2026-08-03 (scenario B-02, angle « rendu » que le gate auto ne voit pas) : les motifs
// de suggestion portent l'historique des mesures et avaient grossi au point de noyer l'ecran de
// choix. Un ecran de selection doit tenir d'un coup d'oeil ; le detail reste dans la source.
test('summarize : coupe proprement les motifs longs, laisse les courts intacts', () => {
  const court = 'Modele de code dedie, le seul du parc.';
  assert.equal(summarize(court), court, 'un motif court ne doit pas etre touche');

  const long = 'CORRIGE DEUX FOIS LE MEME JOUR, et la seconde fois parce que la premiere mesure '
    + 'etait TROP ETROITE. Suggestion d\'origine : mistral, choisi sur sa taille, sans aucune '
    + 'observation, puis qwen3.5 apres un duel incomplet, puis gemma4 apres le banc complet.';
  const out = summarize(long);
  assert.ok(out.length <= 160, `resume trop long : ${out.length}`);
  assert.ok(out.endsWith('[…]'), 'la troncature doit etre SIGNALEE (sinon on lit un motif ampute comme complet)');
  assert.ok(!/\s\[…\]$/.test(out.replace(' […]', 'X')), 'pas d\'espace parasite avant l\'ellipse');
  assert.ok(!out.includes('  '), 'les espaces multiples sont normalises');

  // Un mot coupe en deux est illisible : la coupe cherche un espace.
  assert.ok(!/\w\[…\]$/.test(out), 'ne doit pas trancher au milieu d\'un mot');
});
