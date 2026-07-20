// GARDE DE PARITE DU VOCABULAIRE DE ROLES (CH-A, criteres C2 / C21 / C22 / C23).
//
// Le vocabulaire de roles est porte par QUATRE artefacts qui doivent dire la MEME chose :
//   1. le canon        : `library/personas/*.md` (champ `roleKey`)
//   2. la table CLI    : `ROLE_OF` (`cli/src/lib/agents.js`)
//   3. la methode      : `methods/iakaframe.md` (champ `roleKeys`)
//   4. le coeur GUI    : `CANONICAL_ROLES` (`packages/core/src/roles.ts`, depot voisin)
//
// POURQUOI CETTE GARDE EXISTE. `roleKey` n'est projete dans AUCUN golden de contrat d'agent
// (`renderAgentContract` projette name/description/tools/guardrails). Une divergence de
// vocabulaire est donc invisible de toutes les suites existantes.
//
// PIRE : `assemble` applique la regle de repli "un role non couvert est pris en charge par le
// COORDINATEUR" (`library.js`, `orphans = hasCoordinator ? [] : uncoveredRoles`). La team
// `iakaframe-8` declarant `coordinator: aragorn`, un renommage PARTIEL de `roleKey` fait
// absorber silencieusement jusqu'a 5 roles sur 8 par Aragorn, `orphans` reste vide, `ok` reste
// true, et `library.test.js` reste VERT. Le filet ne manque pas : il MASQUE.
// -> C23 exige donc `coveredByCoordinator == []` : un role absorbe par le coordinateur vaut
//    ECHEC, jamais avertissement.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROLE_OF, SKILL_OF } from '../src/lib/agents.js';
import { readEntry, assemble, toArray } from '../src/lib/library.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..'); // depot iakaframe (vraie bibliotheque)
const METHOD_ID = 'iakaframe';
const TEAM_ID = 'iakaframe-8';

// --- C2 : canon `roleKey` <-> table CLI `ROLE_OF` -------------------------------------------
test('C2 : le roleKey canon de chaque persona est IDENTIQUE a ROLE_OF (parite canon <-> CLI)', () => {
  const team = readEntry('teams', TEAM_ID, REPO);
  assert.ok(team, `team ${TEAM_ID} introuvable`);

  const divergences = [];
  for (const pid of toArray(team.data.personas)) {
    const p = readEntry('personas', pid, REPO);
    assert.ok(p, `persona ${pid} introuvable dans library/personas/`);
    const canon = p.data.roleKey;
    const table = ROLE_OF[pid];
    assert.ok(table, `${pid} absent de ROLE_OF (cli/src/lib/agents.js)`);
    if (canon !== table) divergences.push(`${pid} : canon="${canon}" != ROLE_OF="${table}"`);
  }
  assert.deepEqual(divergences, [],
    `divergence(s) roleKey canon <-> ROLE_OF :\n  - ${divergences.join('\n  - ')}`);
});

test('C2-bis : ROLE_OF ne rattache pas deux personas au meme role par defaut de case', () => {
  // Deux personas partageant un role canonique = symptome du rangement par defaut qui avait
  // impose l'exception codee SKILL_OVERRIDE_OF (helm range en "coordination" faute de case).
  const byRole = new Map();
  for (const [persona, role] of Object.entries(ROLE_OF)) {
    if (!byRole.has(role)) byRole.set(role, []);
    byRole.get(role).push(persona);
  }
  const partages = [...byRole.entries()].filter(([, ps]) => ps.length > 1)
    .map(([role, ps]) => `${role} <- ${ps.join(', ')}`);
  assert.deepEqual(partages, [], `role(s) canonique(s) partage(s) par plusieurs personas :\n  - ${partages.join('\n  - ')}`);
});

test('C3 : chaque role de ROLE_OF a une entree dans SKILL_OF (aucune exception codee requise)', () => {
  const manquants = [...new Set(Object.values(ROLE_OF))]
    .filter(role => !Object.prototype.hasOwnProperty.call(SKILL_OF, role));
  assert.deepEqual(manquants, [],
    `role(s) sans skill declaree dans SKILL_OF : ${manquants.join(', ')} (une skill manquante force une surcharge par persona)`);
});

// --- C21 / C22 : methods/iakaframe.md `roleKeys` <-> union des `roleKey` de la team ----------
test('C22 : method.roleKeys == union des roleKey des personas de la team (aucun ecart, dans les deux sens)', () => {
  const method = readEntry('methods', METHOD_ID, REPO);
  assert.ok(method, `methode ${METHOD_ID} introuvable`);
  const team = readEntry('teams', TEAM_ID, REPO);
  assert.ok(team, `team ${TEAM_ID} introuvable`);

  const methodRoles = new Set(toArray(method.data.roleKeys));
  const teamRoles = new Set();
  for (const pid of toArray(team.data.personas)) {
    const p = readEntry('personas', pid, REPO);
    if (p?.data?.roleKey) teamRoles.add(p.data.roleKey);
  }

  const dansMethodePasDansTeam = [...methodRoles].filter(r => !teamRoles.has(r)).sort();
  const dansTeamPasDansMethode = [...teamRoles].filter(r => !methodRoles.has(r)).sort();

  assert.deepEqual(dansMethodePasDansTeam, [],
    `role(s) declare(s) par methods/${METHOD_ID}.md mais incarne(s) par AUCUNE persona : ${dansMethodePasDansTeam.join(', ')}`);
  assert.deepEqual(dansTeamPasDansMethode, [],
    `roleKey(s) de persona absent(s) de methods/${METHOD_ID}.md : ${dansTeamPasDansMethode.join(', ')}`);
});

test('C21 : method.roleKeys porte le meme vocabulaire que ROLE_OF', () => {
  const method = readEntry('methods', METHOD_ID, REPO);
  const methodRoles = [...new Set(toArray(method.data.roleKeys))].sort();
  const tableRoles = [...new Set(Object.values(ROLE_OF))].sort();
  assert.deepEqual(methodRoles, tableRoles,
    `methods/${METHOD_ID}.md et ROLE_OF portent des vocabulaires differents`);
});

// --- C23 : aucun role absorbe silencieusement par le coordinateur ---------------------------
test('C23 : assemble(iakaframe, iakaframe-8) -> coveredByCoordinator == [] et warnings == []', () => {
  const r = assemble(METHOD_ID, TEAM_ID, null, REPO);
  assert.equal(r.ok, true, `assemble a echoue : ${r.error || ''}`);
  assert.deepEqual(r.unknownPersonas, [], 'persona(s) inconnue(s)');
  assert.deepEqual(r.orphans, [], 'role(s) orphelin(s)');
  // Le point de cette assertion : sur cette team, `orphans` est STRUCTURELLEMENT vide
  // (coordinator: aragorn). Un role non couvert n'apparait QUE dans coveredByCoordinator.
  assert.deepEqual(r.coveredByCoordinator, [],
    `role(s) absorbe(s) par le coordinateur ${r.coordinator} au lieu d'etre incarne(s) : ${r.coveredByCoordinator.join(', ')} -- ECHEC du lot, pas un avertissement`);
  assert.deepEqual(r.warnings, [], `avertissement(s) d'assemblage : ${r.warnings.join(' | ')}`);
});

// --- C1 (volet cross-repo) : canon <-> coeur GUI --------------------------------------------
// Le coeur vit dans un DEPOT VOISIN (iakaFrameGUI). Absent en CI isolee -> test SKIPPE, jamais
// rouge (meme convention que vocab-parity.test.js).
const GUI_CANDIDATES = [
  process.env.IAKAFRAME_CORE_ROLES,
  path.resolve(HERE, '..', '..', '..', 'iakaFrameGUI', 'packages', 'core', 'src', 'roles.ts'),
  path.resolve(HERE, '..', '..', '..', 'iakaframegui', 'packages', 'core', 'src', 'roles.ts'),
].filter(Boolean);

function findRolesTs() {
  for (const p of GUI_CANDIDATES) { try { if (fs.existsSync(p)) return p; } catch { /* ignore */ } }
  return null;
}

const rolesTsPath = findRolesTs();
const skipGui = rolesTsPath ? false : 'coeur GUI roles.ts introuvable (depot iakaFrameGUI absent - CI isolee)';

test('C1 : ROLE_OF <-> CANONICAL_ROLES du coeur GUI (meme vocabulaire, roleIndex sans trou)', { skip: skipGui }, () => {
  const src = fs.readFileSync(rolesTsPath, 'utf8');
  // Extraction textuelle (le CLI ne compile pas de TS) : { key: "x", label: "...", roleIndex: N }
  const entries = [...src.matchAll(/\{\s*key:\s*"([^"]+)",\s*label:\s*"[^"]*",\s*roleIndex:\s*(\d+)\s*\}/g)]
    .map(m => ({ key: m[1], roleIndex: Number(m[2]) }));
  assert.ok(entries.length > 0, `aucun role extrait de ${rolesTsPath}`);

  const guiRoles = entries.map(e => e.key).sort();
  const tableRoles = [...new Set(Object.values(ROLE_OF))].sort();
  assert.deepEqual(guiRoles, tableRoles, 'CANONICAL_ROLES (GUI) != ROLE_OF (CLI)');

  // C18 : roleIndex contigus 0..n-1, sans trou ni doublon.
  const indexes = entries.map(e => e.roleIndex).sort((a, b) => a - b);
  assert.deepEqual(indexes, entries.map((_, i) => i), 'roleIndex non contigus (trou ou doublon)');
});
