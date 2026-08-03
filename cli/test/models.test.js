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
         writeAssignments, summarize, serverMessage, applyMakeAvailable, applyRemove,
         pickAndAct } from '../src/commands/models.js';

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
  // GATE QUALITE 2026-08-03 : cette assertion exigeait `en-place` pour tout role couvert — elle
  // VERROUILLAIT le defaut bloquant (statut aveugle a la disponibilite reelle) au lieu de
  // l'attraper. Ici aucun hote LAN n'est fourni : les modeles du binding ollama ne sont exposes
  // NULLE PART, donc le bon statut est « a installer », et les roles doivent rester ACTIONNABLES.
  for (const r of o.roles.filter(x => x.covered)) {
    assert.ok(r.aligned, `${r.roleKey} : le binding doit rester aligne sur la suggestion`);
    assert.notEqual(r.status, 'en-place',
      `${r.roleKey} : « en place » exige une presence MESUREE, pas seulement une egalite de noms`);
    assert.deepEqual(r.availableOn, [], 'aucune cible ne doit exposer ce modele dans ce contexte');
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
  // `m1` (affecte a dev) ET `m2` (suggere pour qualite) sont exposes : les deux cas sont mesures.
  const probes = [{ target: 'ollama-distant', available: true, kind: 'ollama', models: ['m1', 'm2'] }];
  const roles = buildState({ canon, suggestions, probes });
  assert.equal(roles.find(r => r.roleKey === 'dev').status, 'en-place', 'aligne ET present');
  assert.equal(roles.find(r => r.roleKey === 'qualite').status, 'disponible', 'present mais non affecte');
  assert.equal(roles.find(r => r.roleKey === 'orphelin').status, 'non-couvert');

  // LE DEFAUT BLOQUANT du gate qualite : aligne mais ABSENT de toute cible. L'ancienne regle
  // rendait `en-place` — donc non actionnable — et gelait tout le process sur le binding ollama.
  const sansM1 = [{ target: 'ollama-distant', available: true, kind: 'ollama', models: ['m2'] }];
  const dev = buildState({ canon, suggestions, probes: sansM1 }).find(r => r.roleKey === 'dev');
  assert.equal(dev.status, 'a-installer', 'un modele affecte mais introuvable reste A INSTALLER');
  assert.equal(dev.aligned, true, 'il reste aligne sur la suggestion : les deux notions sont distinctes');
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

// Recette du 2026-08-03 (scenario C-05, cle presente) : la passerelle a refuse la declaration
// avec un motif parfaitement actionnable (« Set STORE_MODEL_IN_DB=True »), que le CLI reduisait a
// « HTTP 500 ». Un code de statut ne dit rien de ce qu'il faut faire ensuite.
test('serverMessage : deballe le motif d\'erreur de la passerelle', () => {
  const reel = { body: { error: { message: "{'error': \"Set `'STORE_MODEL_IN_DB='True'` in your env to enable this feature.\"}",
                                  type: 'auth_error', code: '500' } } };
  const msg = serverMessage(reel);
  assert.match(msg, /STORE_MODEL_IN_DB/, 'le motif actionnable doit survivre');
  assert.ok(!msg.includes('\\"'), 'aucune contre-oblique d\'echappement ne doit remonter a l\'ecran');

  assert.equal(serverMessage({ body: { detail: 'quota depasse' } }), 'quota depasse');
  assert.match(serverMessage({ body: null, text: 'Bad Gateway' }), /Bad Gateway/, 'repli sur le corps brut');
  assert.equal(serverMessage({ body: null, text: '' }), '', 'aucun motif -> chaine vide, pas de bruit');
  assert.equal(serverMessage(undefined), '', 'reponse absente toleree');
});

// ================================================================================================
// ADAPTATEURS ET GATE — chemin que le gate qualite du 2026-08-03 a trouve SANS AUCUN TEST
// (models.js 330-451 et http.js 23-42 non couverts : pull, declare, delete, gate, ecriture).
// Ces tests montent un faux service local : aucun reseau externe, aucun TTY.
// ================================================================================================
import http from 'node:http';
import os from 'node:os';

function fakeService(routes) {
  const calls = [];
  const srv = http.createServer((req, res) => {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      calls.push({ method: req.method, url: req.url, body: body ? JSON.parse(body) : null });
      const key = `${req.method} ${req.url}`;
      const handler = routes[key];
      if (!handler) { res.writeHead(404).end('{}'); return; }
      const [code, payload] = handler(calls.at(-1));
      res.writeHead(code, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
    });
  });
  return new Promise(resolve => srv.listen(0, '127.0.0.1', () => {
    resolve({ url: `http://127.0.0.1:${srv.address().port}`, calls, close: () => srv.close() });
  }));
}

test('applyMakeAvailable : Ollama -> pull, et un echec remonte le motif du service', async () => {
  const okSrv = await fakeService({ 'POST /api/pull': () => [200, { status: 'success' }] });
  try {
    const r = await applyMakeAvailable({ target: { kind: 'ollama', url: okSrv.url }, model: 'm:1b' });
    assert.equal(r.ok, true);
    assert.deepEqual(okSrv.calls.map(c => c.url), ['/api/pull']);
    assert.equal(okSrv.calls[0].body.name, 'm:1b', 'le modele demande doit etre celui transmis');
  } finally { okSrv.close(); }

  const koSrv = await fakeService({ 'POST /api/pull': () => [500, { error: { message: 'disque plein' } }] });
  try {
    const r = await applyMakeAvailable({ target: { kind: 'ollama', url: koSrv.url }, model: 'm:1b' });
    assert.equal(r.ok, false);
    assert.ok(r.lines.join(' ').includes('disque plein'), 'le motif du service doit remonter');
  } finally { koSrv.close(); }
});

test('applyMakeAvailable : LiteLLM SAUVEGARDE avant d\'ecrire (AC-8), et n\'ecrit pas sans filet', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-bak-'));
  process.env.IAKAFRAME_BACKUP_DIR = dir;
  t.after(() => { delete process.env.IAKAFRAME_BACKUP_DIR; fs.rmSync(dir, { recursive: true, force: true }); });

  // Cas nominal : la sauvegarde precede l'ecriture, et le fichier existe vraiment.
  const srv = await fakeService({
    'GET /model/info': () => [200, { data: [{ model_name: 'deja', model_info: { id: 'abc' } }] }],
    'POST /model/new': () => [200, { ok: true }],
  });
  try {
    const r = await applyMakeAvailable({ target: { kind: 'litellm', url: srv.url }, model: 'm:1b', key: 'k', stamp: 'STAMP' });
    assert.equal(r.ok, true);
    assert.deepEqual(srv.calls.map(c => c.url), ['/model/info', '/model/new'],
      'la sauvegarde doit PRECEDER l\'ecriture, jamais l\'inverse');
    const bak = path.join(dir, 'litellm-catalog-STAMP.json');
    assert.ok(fs.existsSync(bak), 'le fichier de sauvegarde doit exister');
    assert.match(fs.readFileSync(bak, 'utf8'), /deja/, 'la sauvegarde doit contenir le catalogue lu');
  } finally { srv.close(); }

  // Filet impossible -> on N'ECRIT PAS. C'est le coeur d'AC-8.
  const noBak = await fakeService({ 'POST /model/new': () => [200, { ok: true }] });  // /model/info absent -> 404
  try {
    const r = await applyMakeAvailable({ target: { kind: 'litellm', url: noBak.url }, model: 'm:1b', key: 'k', stamp: 'S2' });
    assert.equal(r.ok, false);
    assert.ok(!noBak.calls.some(c => c.url === '/model/new'), 'AUCUNE ecriture ne doit partir sans sauvegarde');
    assert.match(r.lines.join(' '), /ecriture ANNULEE/i);
  } finally { noBak.close(); }
});

test('applyMakeAvailable : LiteLLM sans cle -> aucun appel, bloc a coller rendu', async () => {
  const srv = await fakeService({ 'POST /model/new': () => [200, {}] });
  try {
    const r = await applyMakeAvailable({ target: { kind: 'litellm', url: srv.url }, model: 'm:1b', key: '' });
    assert.equal(r.ok, false);
    assert.equal(srv.calls.length, 0, 'sans cle, on ne contacte meme pas le service');
    assert.ok(r.lines.join('\n').includes('model_name: m:1b'), 'le repli exploitable doit etre fourni');
  } finally { srv.close(); }
});

test('applyRemove : ROUTE par type de cible (defaut #4 du gate)', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-bak-'));
  process.env.IAKAFRAME_BACKUP_DIR = dir;
  t.after(() => { delete process.env.IAKAFRAME_BACKUP_DIR; fs.rmSync(dir, { recursive: true, force: true }); });

  const ollama = await fakeService({ 'DELETE /api/delete': () => [200, {}] });
  try {
    const r = await applyRemove({ target: { kind: 'ollama', url: ollama.url }, model: 'm:1b' });
    assert.equal(r.ok, true);
    assert.deepEqual(ollama.calls.map(c => `${c.method} ${c.url}`), ['DELETE /api/delete']);
  } finally { ollama.close(); }

  // Sur LiteLLM, `/api/delete` n'existe pas : le retrait passe par l'id du catalogue.
  const gw = await fakeService({
    'GET /model/info': () => [200, { data: [{ model_name: 'm:1b', model_info: { id: 'ID-42' } }] }],
    'POST /model/delete': () => [200, {}],
  });
  try {
    const r = await applyRemove({ target: { kind: 'litellm', url: gw.url }, model: 'm:1b', key: 'k', stamp: 'S' });
    assert.equal(r.ok, true);
    const urls = gw.calls.map(c => `${c.method} ${c.url}`);
    assert.ok(!urls.includes('DELETE /api/delete'), 'l\'endpoint d\'Ollama ne doit JAMAIS etre appele sur la passerelle');
    assert.ok(urls.includes('POST /model/delete'), 'le retrait au catalogue doit passer par /model/delete');
    assert.equal(gw.calls.at(-1).body.id, 'ID-42', 'le retrait se fait par ID interne, pas par nom');
  } finally { gw.close(); }

  // Modele absent du catalogue : on le DIT, on ne supprime pas au hasard.
  const vide = await fakeService({ 'GET /model/info': () => [200, { data: [] }] });
  try {
    const r = await applyRemove({ target: { kind: 'litellm', url: vide.url }, model: 'introuvable', key: 'k', stamp: 'S' });
    assert.equal(r.ok, false);
    assert.match(r.lines.join(' '), /absent du catalogue/);
  } finally { vide.close(); }
});

test('pickAndAct : REFUSER au gate n\'emet aucun appel et n\'ecrit rien (AC-3)', async () => {
  const srv = await fakeService({
    'POST /api/pull': () => [200, {}], 'DELETE /api/delete': () => [200, {}],
  });
  const binding = path.join(HERE, 'fixtures', `binding-gate-${process.pid}.md`);
  fs.writeFileSync(binding, ['---', 'id: t', 'teamId: t8', 'assignments:',
    '  - { personaId: p1, runner: claude-code, model: "avant" }', '---', '# corps', ''].join('\n'), 'utf8');
  const avant = fs.readFileSync(binding, 'utf8');
  try {
    const answers = ['1', 'r', 'n'];                       // cible 1, remplacer, PUIS REFUS
    const res = await pickAndAct({
      ask: async () => answers.shift(), yes: (s) => /^(o|oui|y|yes)$/i.test(s),
      pick: '1',
      diff: [{ roleKey: 'dev', personas: [{ id: 'p1', name: 'P1' }], assigned: ['avant'],
               recommended: 'apres', sizeGb: 1, status: 'a-installer' }],
      probes: [{ target: 'ollama-distant', label: 'O', url: srv.url, kind: 'ollama',
                 available: true, installMeans: 'pull' }],
      canon: { bindingPath: binding },
    });
    assert.equal(res.executed, false, 'un refus ne doit rien executer');
    assert.equal(srv.calls.length, 0, 'AUCUN appel reseau apres un refus');
    assert.equal(fs.readFileSync(binding, 'utf8'), avant, 'le binding doit etre intact');
  } finally { srv.close(); fs.rmSync(binding, { force: true }); }
});

test('pickAndAct : CONFIRMER execute, et « remplacer » n\'ecrit QUE si la mise a disposition a reussi', async () => {
  const ko = await fakeService({ 'POST /api/pull': () => [500, { error: { message: 'refus' } }] });
  const binding = path.join(HERE, 'fixtures', `binding-gate2-${process.pid}.md`);
  fs.writeFileSync(binding, ['---', 'id: t', 'teamId: t8', 'assignments:',
    '  - { personaId: p1, runner: claude-code, model: "avant" }', '---', '# corps', ''].join('\n'), 'utf8');
  try {
    const answers = ['1', 'r', 'o'];                       // cible 1, remplacer, CONFIRME
    const res = await pickAndAct({
      ask: async () => answers.shift(), yes: (s) => /^(o|oui|y|yes)$/i.test(s),
      pick: '1',
      diff: [{ roleKey: 'dev', personas: [{ id: 'p1', name: 'P1' }], assigned: ['avant'],
               recommended: 'apres', sizeGb: 1, status: 'a-installer' }],
      probes: [{ target: 'ollama-distant', label: 'O', url: ko.url, kind: 'ollama',
                 available: true, installMeans: 'pull' }],
      canon: { bindingPath: binding },
    });
    assert.equal(res.executed, true, 'la confirmation doit declencher l\'execution');
    assert.equal(res.ok, false, 'le pull a echoue');
    assert.match(fs.readFileSync(binding, 'utf8'), /model: "avant"/,
      'une affectation ne doit PAS etre ecrite si le modele n\'a pas pu etre mis a disposition');
  } finally { ko.close(); fs.rmSync(binding, { force: true }); }
});

test('buildState : sans AUCUNE cible mesurable, le statut est « indetermine » (on ne devine pas)', () => {
  const suggestions = { roles: { dev: { recommended: 'm1', alternatives: [], requires: [] } } };
  const canon = { roles: [{ roleKey: 'dev', covered: true, personas: [{ id: 'a', name: 'A', model: 'm1' }] }] };
  const mortes = [{ target: 'ollama-distant', available: false, kind: 'ollama', models: [] },
                  { target: 'claude', available: true, kind: 'cli', models: [] }];
  assert.equal(buildState({ canon, suggestions, probes: mortes })[0].status, 'indetermine',
    'un CLI joignable ne mesure aucun parc : il ne rend pas la disponibilite connue');
});
