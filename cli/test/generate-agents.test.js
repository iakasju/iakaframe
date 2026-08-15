// Generateur persona -> contrat Claude Code (specs/instructions/generateur-persona-contrat.md).
// Verrouille : (1) rendu PUR par golden, (2) regles tools scalaire/omis, (3) resolution binding,
// (4) corps verbatim (ligne blanche de tete preservee), (5) anti-regression Lot 1 sur le canon reel
// (Loki/Odin CTO/Legolas RQV survivent, description seedee, guardrails/tools projetes).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  renderAgentContract, toolsForPersona, verbatimBody, generateAgent, generateAll, loadDefaultBinding,
  personasForTarget,
} from '../src/lib/generate-agents.js';
import { readEntry } from '../src/lib/library.js';
import { parseFrontmatter } from '../src/lib/frontmatter.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..'); // depot iakaframe (vraie bibliotheque)
const IDS = ['aragorn', 'charon', 'feanor', 'gandalf', 'gimli', 'helm', 'legolas', 'loki', 'nathalie', 'odin'];

// --- 1. renderAgentContract : rendu PUR, ordre de champs, golden --------------------------------

test('renderAgentContract : golden (ordre name/description/tools/guardrails + corps verbatim)', () => {
  const out = renderAgentContract({
    id: 'gandalf',
    description: 'Architecte-cadreur. À déclencher pour cadrer.',
    tools: ['Read', 'Grep', 'Glob', 'Write'],
    guardrails: ['identity', 'perimeter'],
    body: '\n# 🧙 Gandalf\n\nCorps de rôle.\n',
  });
  const expected =
    '---\n' +
    'name: gandalf\n' +
    'description: Architecte-cadreur. À déclencher pour cadrer.\n' +
    'tools: Read, Grep, Glob, Write\n' +
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
