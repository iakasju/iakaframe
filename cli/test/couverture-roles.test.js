// G-SURV — GARDE DE COUVERTURE DE ROLE DU SQUAD PROD.
//
// Instruction : specs/instructions/scission-squad-prod-charon-helm.md (§ 8, R1 ; § 10, CA-1..CA-4).
//
// 🛑 POURQUOI CETTE GARDE EXISTE, ET POURQUOI ELLE N'ASSERTE PAS `orphans`.
// `assemble` calcule `coveredByCoordinator = hasCoordinator ? uncoveredRoles : []` et
// `orphans = hasCoordinator ? [] : uncoveredRoles` (cli/src/lib/library.js:270-276). La team
// `iakaframe-8` DECLARE `coordinator: aragorn` : `orphans` y est donc STRUCTURELLEMENT VIDE,
// quoi qu'il arrive. Un roleKey declare par la methode et porte par AUCUN persona est
// SILENCIEUSEMENT absorbe par le coordinateur — le lot passerait vert sur un squad prod casse
// (fait F30 de l'instruction ; reprise litterale de la contrainte § 10.2 de
// specs/instructions/decision-rolekey-reconciliation.md).
//
// Aggravant (fait F29) : `roleKey` n'est projete dans AUCUN contrat genere — les goldens ne
// bougent pas quand il change. Sans cette garde, RIEN dans la suite ne verrait la scission ratee.
//
// La garde asserte donc `coveredByCoordinator == []` sur la VRAIE bibliotheque, et le casting
// NOMME des deux roles du squad prod.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assemble, readEntry, toArray } from '../src/lib/library.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..'); // depot iakaframe (vraie bibliotheque)

const METHOD = 'iakaframe';
const TEAM = 'iakaframe-8';

// roleKey -> [personaIds] sur le casting reel de la team.
function castingByRoleKey(root = REPO) {
  const team = readEntry('teams', TEAM, root);
  assert.ok(team, `team introuvable : ${TEAM}`);
  const map = new Map();
  for (const pid of toArray(team.data.personas)) {
    const p = readEntry('personas', pid, root);
    assert.ok(p, `persona du casting introuvable : ${pid}`);
    const key = p.data.roleKey;
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(pid);
  }
  return map;
}

test('G-SURV / CA-2 + CA-3 : aucun role de la methode n est absorbe par le coordinateur', () => {
  const r = assemble(METHOD, TEAM, null, REPO);
  assert.equal(r.ok, true, 'assemble doit reussir sur la vraie bibliotheque');
  // CA-2 : on asserte `coveredByCoordinator`, JAMAIS `orphans` (structurellement vide ici).
  assert.deepEqual(r.coveredByCoordinator, [],
    'un roleKey de la methode est absorbe en silence par le coordinateur — le casting ne le porte pas');
  // CA-3 : les deux autres compteurs, pour que le constat soit complet.
  assert.deepEqual(r.orphans, []);
  assert.deepEqual(r.unknownPersonas ?? [], [], 'persona du casting inconnue de library/personas/');
});

test('G-SURV / CA-4 : le squad prod est SCINDE — `deploiement` et `surveillance` ont chacun UN persona DEDIE', () => {
  const casting = castingByRoleKey();

  // Les deux roles existent dans le casting...
  assert.ok(casting.has('deploiement'),
    'aucun persona du casting ne porte roleKey `deploiement` (le passeur manque)');
  assert.ok(casting.has('surveillance'),
    'aucun persona du casting ne porte roleKey `surveillance` (le veilleur manque)');

  // ... chacun porte par UN SEUL persona (pas de fusion residuelle, pas de doublon).
  assert.deepEqual(casting.get('deploiement'), ['charon'],
    '`deploiement` doit etre porte par charon, et par lui seul');
  assert.deepEqual(casting.get('surveillance'), ['helm'],
    '`surveillance` doit etre porte par helm, et par lui seul');

  // ... et ce ne sont PAS le meme persona : la scission est reelle.
  assert.notEqual(casting.get('deploiement')[0], casting.get('surveillance')[0],
    'un seul persona porte les deux missions : la fusion n est pas defaite');
});

// CA-2, verifie MECANIQUEMENT et non « par lecture du test ». On reproduit le piege F30 sur une
// racine jetable : un roleKey de la methode que le casting NE PORTE PAS. Si cette garde s'etait
// contentee de `orphans == []`, elle serait passee VERTE sur ce cas — c'est ce que ce test prouve.
test('G-SURV / CA-2 : le piege F30 est REEL — `orphans` reste vide la ou `coveredByCoordinator` mord', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-gsurv-'));
  try {
    fs.symlinkSync(path.join(REPO, 'library'), path.join(tmp, 'library'));
    fs.mkdirSync(path.join(tmp, 'methods'));
    fs.mkdirSync(path.join(tmp, 'teams'));
    // Methode jetable qui declare un roleKey EXISTANT en library/roles/ mais que le casting
    // ci-dessous ne porte pas (`design`, incarne par loki, absent de la team).
    fs.writeFileSync(path.join(tmp, 'methods', 'gsurv-piege.md'),
      '---\nid: gsurv-piege\nworkflowId: iakaframe-3phases\n' +
      'roleKeys: [cadrage, design]\n---\n# methode jetable (garde G-SURV)\n');
    fs.writeFileSync(path.join(tmp, 'teams', 'gsurv-team.md'),
      '---\nid: gsurv-team\nname: Casting incomplet\n' +
      'personas: [aragorn, gandalf]\ncoordinator: aragorn\n---\n# casting sans persona `design`\n');

    const r = assemble('gsurv-piege', 'gsurv-team', null, tmp);
    // Le filet MENT dans le bon sens : ok:true, orphans vide...
    assert.equal(r.ok, true, 'F30 : un casting incomplet rend pourtant ok:true');
    assert.deepEqual(r.orphans, [],
      'F30 : `orphans` est structurellement vide des qu un coordinateur existe — asserter dessus ne prouve RIEN');
    // ... alors que le role n est porte par PERSONNE.
    assert.deepEqual(r.coveredByCoordinator, ['design'],
      'seul `coveredByCoordinator` revele le role non caste : c est lui que G-SURV asserte');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('G-SURV : la methode DECLARE `surveillance`, et ce roleKey a son fichier de role (F22)', () => {
  const method = readEntry('methods', METHOD, REPO);
  assert.ok(method, 'methode introuvable');
  const roleKeys = toArray(method.data.roleKeys);
  assert.ok(roleKeys.includes('deploiement'), 'la methode doit declarer `deploiement`');
  assert.ok(roleKeys.includes('surveillance'), 'la methode doit declarer `surveillance`');

  // Un roleKey declare EXIGE un fichier de role (needEach('roleKeys', …, 'roles')).
  const role = readEntry('roles', 'surveillance', REPO);
  assert.ok(role, 'library/roles/surveillance.md doit exister');
  assert.equal(role.data.key, 'surveillance');
  assert.equal(Number(role.data.roleIndex), 10, 'roleIndex 10 (9 est pris par `frame`)');
});
