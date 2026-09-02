// Generateur persona -> contrat Claude Code (specs/instructions/generateur-persona-contrat.md).
// Verrouille : (1) rendu PUR par golden, (2) regles tools/model scalaire-ou-omis, (3) resolution binding,
// (4) corps verbatim (ligne blanche de tete preservee), (5) anti-regression Lot 1 sur le canon reel
// (Loki/Odin CTO/Legolas RQV survivent, description seedee, guardrails/tools projetes).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  renderAgentContract, toolsForPersona, modelForPersona, verbatimBody, generateAgent, generateAll,
  loadDefaultBinding, personasForTarget,
} from '../src/lib/generate-agents.js';
import { readEntry } from '../src/lib/library.js';
import { parseFrontmatter } from '../src/lib/frontmatter.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..'); // depot iakaframe (vraie bibliotheque)
const IDS = ['aragorn', 'charon', 'feanor', 'gandalf', 'gimli', 'helm', 'legolas', 'loki', 'nathalie', 'odin'];

// --- 1. renderAgentContract : rendu PUR, ordre de champs, golden --------------------------------

test('renderAgentContract : golden (ordre name/description/tools/model/guardrails + corps verbatim)', () => {
  const out = renderAgentContract({
    id: 'gandalf',
    description: 'Architecte-cadreur. À déclencher pour cadrer.',
    tools: ['Read', 'Grep', 'Glob', 'Write'],
    model: 'opus',
    guardrails: ['identity', 'perimeter'],
    body: '\n# 🧙 Gandalf\n\nCorps de rôle.\n',
  });
  const expected =
    '---\n' +
    'name: gandalf\n' +
    'description: Architecte-cadreur. À déclencher pour cadrer.\n' +
    'tools: Read, Grep, Glob, Write\n' +
    'model: opus\n' +
    'guardrails: [identity, perimeter]\n' +
    '---\n' +
    '\n# 🧙 Gandalf\n\nCorps de rôle.\n';
  assert.equal(out, expected);
});

test('renderAgentContract : tools est un SCALAIRE virgule, PAS une flow-list', () => {
  const out = renderAgentContract({ id: 'x', description: 'd', tools: ['Read', 'Bash'], guardrails: [], body: '' });
  assert.match(out, /^tools: Read, Bash$/m);
  assert.doesNotMatch(out, /tools: \[/); // jamais `tools: [Read, Bash]`
});

test('renderAgentContract : tools VIDE => ligne tools OMISE (heritage de tous les outils)', () => {
  const out = renderAgentContract({ id: 'x', description: 'd', tools: [], guardrails: ['identity'], body: '' });
  assert.doesNotMatch(out, /^tools:/m);
  // enchainement direct description -> guardrails (pas de trou)
  assert.match(out, /description: d\nguardrails: \[identity\]/);
});

test('renderAgentContract : tools undefined => ligne omise (idem vide)', () => {
  const out = renderAgentContract({ id: 'x', description: 'd', guardrails: [], body: '' });
  assert.doesNotMatch(out, /^tools:/m);
});

test('renderAgentContract : guardrails rendu en flow-list', () => {
  const out = renderAgentContract({ id: 'x', description: 'd', tools: [], guardrails: ['identity', 'perimeter', 'delegation'], body: '' });
  assert.match(out, /^guardrails: \[identity, perimeter, delegation\]$/m);
});

// --- 1bis. skills : projection APRES tools, AVANT guardrails, flow-list, omise si vide (R8 § 5.2)

test('renderAgentContract : skills rendu en flow-list APRES tools et AVANT guardrails', () => {
  const out = renderAgentContract({
    id: 'x', description: 'd', tools: ['Read', 'Skill'],
    skills: ['iakaframe-cadrage', 'iakaframe-jalon'], guardrails: ['identity'], body: '',
  });
  assert.match(out, /^skills: \[iakaframe-cadrage, iakaframe-jalon\]$/m);
  // ordre : tools -> skills -> guardrails
  assert.match(out, /tools: Read, Skill\nskills: \[iakaframe-cadrage, iakaframe-jalon\]\nguardrails: \[identity\]/);
});

test('renderAgentContract : skills VIDE => ligne skills OMISE (enchainement tools->guardrails)', () => {
  const out = renderAgentContract({ id: 'x', description: 'd', tools: ['Read'], skills: [], guardrails: ['identity'], body: '' });
  assert.doesNotMatch(out, /^skills:/m);
  assert.match(out, /tools: Read\nguardrails: \[identity\]/);
});

// --- 1ter. model : projection APRES tools, AVANT skills, omis si vide (D2/D3) -------------------

test('CA-3 renderAgentContract : model rendu ENTRE tools et skills (ordre officiel F4)', () => {
  const out = renderAgentContract({
    id: 'x', description: 'd', tools: ['Read', 'Skill'], model: 'opus',
    skills: ['iakaframe-cadrage'], guardrails: ['identity'], body: '',
  });
  // enchainement EXACT tools -> model -> skills -> guardrails
  assert.match(out, /tools: Read, Skill\nmodel: opus\nskills: \[iakaframe-cadrage\]\nguardrails: \[identity\]/);
});

test('CA-4 renderAgentContract : model VIDE ou ABSENT => ligne OMISE (enchainement tools->skills)', () => {
  for (const model of ['', undefined, null]) {
    const out = renderAgentContract({
      id: 'x', description: 'd', tools: ['Read'], model,
      skills: ['iakaframe-qualite'], guardrails: ['identity'], body: '',
    });
    assert.doesNotMatch(out, /^model:/m, `model=${String(model)} : aucune ligne model`);
    assert.match(out, /tools: Read\nskills: \[iakaframe-qualite\]/, `model=${String(model)} : pas de trou`);
  }
  // D3 : on n'invente AUCUNE valeur de repli — surtout pas `inherit`.
  const out = renderAgentContract({ id: 'x', description: 'd', tools: [], guardrails: [], body: '' });
  assert.doesNotMatch(out, /inherit/);
});

test('CA-5 renderAgentContract : model SANS tools => enchainement description -> model', () => {
  const out = renderAgentContract({ id: 'x', description: 'd', model: 'sonnet', guardrails: ['identity'], body: '' });
  assert.doesNotMatch(out, /^tools:/m);
  assert.match(out, /description: d\nmodel: sonnet\nguardrails: \[identity\]/);
});

test('D5/D6 renderAgentContract : valeur projetee VERBATIM, sans allowlist et sans re-quoting', () => {
  // Aucune table codee ne benit ni ne rejette une valeur : `fable` (F2) et un full model ID
  // passent tels quels. Le prix assume de D5, mesure ici pour qu'il soit visible.
  assert.match(renderAgentContract({ id: 'x', description: 'd', model: 'fable', guardrails: [], body: '' }), /^model: fable$/m);
  assert.match(renderAgentContract({ id: 'x', description: 'd', model: 'claude-opus-5', guardrails: [], body: '' }), /^model: claude-opus-5$/m);
  // D6 : le binding ecrit `model: "opus"`, parseScalar retire les guillemets, on ne re-quote pas.
  assert.match(renderAgentContract({ id: 'x', description: 'd', model: 'opus', guardrails: [], body: '' }), /^model: opus$/m);
});

test('C8 generateAgent : le contrat porte skills: (liste RESOLUE) pour gimli (7, jalon inclus)', () => {
  const contract = generateAgent('gimli', { root: REPO });
  assert.match(contract, /^skills: \[iakaframe-fabrication, iakaframe-gestion-de-source, iakaframe-git, iakaframe-forgejo, iakaframe-conteneurisation, iakaframe-docker, iakaframe-jalon\]$/m);
});

// --- 2. verbatimBody : preserve la ligne blanche de tete + le \n final ---------------------------

test('verbatimBody : preserve la ligne blanche de tete (parseFrontmatter la strippe, pas nous)', () => {
  const src = '---\nname: x\n---\n\n# Titre\n\nfin\n';
  assert.equal(verbatimBody(src), '\n# Titre\n\nfin\n');
  // contraste : parseFrontmatter strippe le \n de tete
  assert.equal(parseFrontmatter(src).body, '# Titre\n\nfin\n');
});

test('verbatimBody : sans frontmatter => texte tel quel', () => {
  assert.equal(verbatimBody('# Titre\ncorps\n'), '# Titre\ncorps\n');
});

// --- 3. toolsForPersona : resolution DEPUIS le binding ------------------------------------------

test('toolsForPersona : renvoie le tools de l assignment homonyme du binding', () => {
  const binding = loadDefaultBinding(REPO);
  // `Skill` en fin de liste des 10 assignments (R8 § 5.3, Fait 3 : invocation a la demande).
  assert.deepEqual(toolsForPersona(binding, 'gandalf'), ['Read', 'Grep', 'Glob', 'Write', 'Edit', 'WebSearch', 'WebFetch', 'Skill']);
  assert.deepEqual(toolsForPersona(binding, 'gimli'), ['Read', 'Edit', 'Write', 'Bash', 'Grep', 'Glob', 'Skill']);
  // Task accorde a Odin (arbitrage CH-B, 2026-07-19) : rend actif son guardrail `delegation`.
  assert.deepEqual(toolsForPersona(binding, 'odin'), ['Read', 'Grep', 'Glob', 'Bash', 'Task', 'Skill']);
});

test('toolsForPersona : persona absente du binding => [] (=> ligne omise en aval)', () => {
  const binding = loadDefaultBinding(REPO);
  assert.deepEqual(toolsForPersona(binding, 'inconnu'), []);
  assert.deepEqual(toolsForPersona(null, 'gandalf'), []);
});

// --- 3bis. modelForPersona : resolution DEPUIS le binding (miroir de toolsForPersona) -----------

test('CA-1 modelForPersona : renvoie le model de l assignment homonyme du binding defaut', () => {
  const binding = loadDefaultBinding(REPO);
  assert.equal(modelForPersona(binding, 'gandalf'), 'opus');
  assert.equal(modelForPersona(binding, 'gimli'), 'sonnet');
});

test('CA-2 modelForPersona : persona absente / binding null => \'\' (=> ligne omise en aval)', () => {
  const binding = loadDefaultBinding(REPO);
  assert.equal(modelForPersona(binding, 'inconnu'), '');
  assert.equal(modelForPersona(null, 'gandalf'), '');
  assert.equal(modelForPersona(undefined, 'gandalf'), '');
  // champ `model` manquant sur un assignment present => '' (et non undefined)
  assert.equal(modelForPersona({ data: { assignments: [{ personaId: 'x', runner: 'claude-code' }] } }, 'x'), '');
});

test('D1 modelForPersona : LIT, ne filtre pas — elle rend le model d un runner non-claude', () => {
  // La fonction ne connait AUCUN runner (le filtre D4 vit dans generateAgent) : sur le binding
  // Ollama elle rend bien la valeur, c'est le GENERATEUR qui s'abstient de la projeter.
  const ollama = readEntry('bindings', 'iakaframe-ollama-default', REPO);
  assert.equal(modelForPersona(ollama, 'gimli'), 'qwen2.5-coder:14b');
});

test('D1 modelForPersona : lit AUSSI le schema alternatif `bindings:` (bindingRows, comme sa jumelle)', () => {
  const alt = { data: { bindings: [{ personaId: 'y', runner: 'claude-code', model: 'haiku' }] } };
  assert.equal(modelForPersona(alt, 'y'), 'haiku');
});

// --- 3ter. filtre de runner dans generateAgent (D4) ---------------------------------------------

test('CA-6 generateAgent : binding OLLAMA => AUCUNE ligne model sur les 10 personas (D4)', () => {
  const ollama = readEntry('bindings', 'iakaframe-ollama-default', REPO);
  for (const id of IDS) {
    const contract = generateAgent(id, { root: REPO, binding: ollama });
    assert.doesNotMatch(contract, /^model:/m, `${id}: aucun model projete pour un runner non claude-code`);
    // « Un champ absent est plus honnete qu'un champ plausible » : aucune des 3 VALEURS du
    // binding Ollama ne fuit dans le contrat. On mesure les valeurs exactes et non les mots
    // `qwen|gemma|coder` : `coder` est le verbe francais du corps canon de Gimli (« AVANT de
    // coder ») — une regex laxiste rougirait sur du texte de persona, pas sur une fuite.
    for (const v of ['qwen3.5:9b', 'gemma4:e4b', 'qwen2.5-coder:14b']) {
      assert.ok(!contract.includes(v), `${id}: le modele Ollama ${v} a fuite dans le contrat`);
    }
  }
});

test('D4 generateAgent : assignment SANS runner declare => abstention (pas de ligne model)', () => {
  const muet = { data: { assignments: [{ personaId: 'gimli', model: 'opus', tools: ['Read'] }] } };
  const contract = generateAgent('gimli', { root: REPO, binding: muet });
  assert.doesNotMatch(contract, /^model:/m);
  assert.match(contract, /^tools: Read$/m); // le reste de la projection est intact
});

test('D4 generateAgent : binding CLAUDE defaut => la ligne model est projetee (10/10)', () => {
  const binding = loadDefaultBinding(REPO);
  for (const id of IDS) {
    const contract = generateAgent(id, { root: REPO, binding });
    const m = contract.match(/^model: (.*)$/m);
    assert.ok(m, `${id}: ligne model attendue`);
    assert.equal(m[1], modelForPersona(binding, id), `${id}: valeur == binding`);
  }
});

// --- 4. Anti-regression Lot 1 : projection fidele du canon reel ---------------------------------

test('generateAll : produit un contrat par persona (10)', () => {
  const m = generateAll({ root: REPO });
  assert.equal(m.size, IDS.length);
  for (const id of IDS) assert.ok(m.has(id), `manque ${id}`);
});

// C15 (mecanique) : la cible GLOBALE materialise le roster 10 — Fëanor INCLUS (activation explicite
// != absence du runtime). personasForTarget(project=null) = les 10 personas dont agents generate
// --global + skills deploy --global partagent la definition. Le deploiement reel = phase (b).
test('C15 roster 10 : personasForTarget(global) inclut feanor ET odin (materialisation globale)', () => {
  const ids = personasForTarget({ root: REPO, project: null });
  assert.ok(ids.includes('feanor'), 'feanor doit etre materialise globalement (activation explicite)');
  assert.ok(ids.includes('odin'), 'odin (portefeuille) fait partie de la cible globale');
  assert.deepEqual([...ids].sort(), IDS, 'exactement le roster 10');
});

test('C15bis feanor : contrat global porte skills: [frame, jalon] + Skill (prechargement + invocation)', () => {
  const contract = generateAll({ root: REPO }).get('feanor');
  assert.match(contract, /^skills: \[iakaframe-frame, iakaframe-jalon\]$/m);
  assert.match(contract, /^tools: .*Skill$/m);
});

test('anti-regression : chaque contrat a name==id, description non vide, guardrails==persona, tools==binding', () => {
  const binding = loadDefaultBinding(REPO);
  for (const id of IDS) {
    const contract = generateAgent(id, { root: REPO, binding });
    const { data } = parseFrontmatter(contract);
    const persona = readEntry('personas', id, REPO);
    assert.equal(data.name, id, `${id}: name`);
    assert.ok(typeof data.description === 'string' && data.description.length > 0, `${id}: description non vide`);
    assert.match(data.name, /^[a-z-]+$/, `${id}: name lowercase`);
    assert.deepEqual(data.guardrails, persona.data.guardrails, `${id}: guardrails passthrough`);
    // tools genere == tools du binding (scalaire re-parse en tableau par le parseur virgule)
    const toolsField = contract.match(/^tools: (.*)$/m);
    const emitted = toolsField ? toolsField[1].split(',').map(s => s.trim()) : [];
    assert.deepEqual(emitted, toolsForPersona(binding, id), `${id}: tools == binding`);
    // model genere == model du binding (I3 : le binding est le SEUL endroit ou il est decide)
    assert.equal(data.model, modelForPersona(binding, id), `${id}: model == binding`);
  }
});

// CA-10 (au rendu) : `model` en position 5 du frontmatter, immediatement apres `tools` (l.4) et
// avant `skills` (l.6) — les 10 contrats portent aujourd'hui tools ET skills, la position est donc
// determinee pour tous. Verrou de POSITION, distinct du verrou de VALEUR ci-dessus.
test('CA-10 generateAgent : model en position 5 du frontmatter pour les 10 personas', () => {
  const binding = loadDefaultBinding(REPO);
  for (const id of IDS) {
    const lines = generateAgent(id, { root: REPO, binding }).split('\n');
    assert.equal(lines[0], '---', `${id}: delimiteur`);
    assert.match(lines[3], /^tools: /, `${id}: tools en l.4`);
    assert.match(lines[4], /^model: /, `${id}: model en l.5`);
    assert.match(lines[5], /^skills: \[/, `${id}: skills en l.6`);
  }
});

// CA-11 : aucun contrat ne porte `fable` (arbitrage du decideur : politique, pas contrainte
// technique — F2) ni `inherit` (D3 : jamais un defaut implicite).
test('CA-11 generateAgent : aucun des 10 contrats ne porte fable ni inherit', () => {
  const binding = loadDefaultBinding(REPO);
  for (const id of IDS) {
    const model = generateAgent(id, { root: REPO, binding }).match(/^model: (.*)$/m)[1];
    assert.ok(['opus', 'sonnet'].includes(model), `${id}: model=${model} hors du casting canon`);
  }
});

test('anti-regression : corps VERBATIM du canon (aucune reformulation)', () => {
  for (const id of IDS) {
    const raw = fs.readFileSync(path.join(REPO, 'library', 'personas', `${id}.md`), 'utf8');
    const contract = generateAgent(id, { root: REPO });
    assert.ok(contract.endsWith(verbatimBody(raw)), `${id}: corps verbatim`);
  }
});

test('anti-regression : le contenu Lot 1 survit (Loki atelier, Odin CTO, Legolas qualite)', () => {
  const m = generateAll({ root: REPO });
  assert.match(m.get('loki'), /Atelier|Expertise|charte/i, 'Loki : expertise/atelier rapatries');
  assert.match(m.get('odin'), /CTO|portefeuille/i, 'Odin : posture CTO');
  assert.match(m.get('legolas'), /qualit|verdict/i, 'Legolas : qualite/verdict');
});

test('idempotence : deux generations successives donnent le meme octet', () => {
  const a = generateAll({ root: REPO });
  const b = generateAll({ root: REPO });
  for (const id of IDS) assert.equal(a.get(id), b.get(id), `${id}: non deterministe`);
});
