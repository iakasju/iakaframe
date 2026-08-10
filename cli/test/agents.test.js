// A-3 : une persona resout RÔLE puis SKILL (fin de la conflation code-nom = rôle = skill).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROLE_OF, PORTFOLIO_PERSONAS, PORTFOLIO_AGENTS, EXPLICIT_ACTIVATION_PERSONAS, NON_DISPATCH_PERSONAS, listAgents, listPersonas, frameTeamPersonas, assignedPersonas, fullteam } from '../src/lib/agents.js';
import { resolveSkills } from '../src/lib/resolve-skills.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..');
function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-agents-')); }
// Racine synthetique (library/methods reels + team reduite + frame trio) pour eprouver A7/A8.
function synthRoot() {
  const root = tmp();
  fs.symlinkSync(path.join(REPO, 'library'), path.join(root, 'library'));
  fs.symlinkSync(path.join(REPO, 'methods'), path.join(root, 'methods'));
  fs.mkdirSync(path.join(root, 'teams'));
  fs.mkdirSync(path.join(root, 'frames'));
  fs.writeFileSync(path.join(root, 'teams', 'trio.md'),
    '---\nid: trio\nname: Trio\npersonas: [odin, aragorn, gimli]\ncoordinator: aragorn\n---\n# trio\n');
  fs.writeFileSync(path.join(root, 'frames', 'trio.md'),
    '---\nid: trio\nname: Frame trio\nversion: v9.9.9\nmethodId: iakaframe\nteamId: trio\n---\n# frame\n');
  fs.copyFileSync(path.join(REPO, 'frames', 'iakaframe.md'), path.join(root, 'frames', 'iakaframe.md'));
  // Team du DEFAULT : indispensable au repli frame-scope (frameTeamPersonas retombe sur la team
  // du default, JAMAIS sur la library entiere). On copie la vraie team iakaframe-8 (roster canon 9).
  fs.copyFileSync(path.join(REPO, 'teams', 'iakaframe-8.md'), path.join(root, 'teams', 'iakaframe-8.md'));
  return root;
}
function withHome(root, fn) {
  const old = process.env.IAKAFRAME_HOME;
  process.env.IAKAFRAME_HOME = root;
  try { return fn(); }
  finally { if (old === undefined) delete process.env.IAKAFRAME_HOME; else process.env.IAKAFRAME_HOME = old; }
}

test('ROLE_OF mappe chaque persona vers un rôle canonique', () => {
  assert.equal(ROLE_OF.aragorn, 'coordination');
  assert.equal(ROLE_OF.gandalf, 'architecture');
  assert.equal(ROLE_OF.gimli, 'fabrication');
  assert.equal(ROLE_OF.legolas, 'tests');
  assert.equal(ROLE_OF.loki, 'graphisme');
  assert.equal(ROLE_OF.nathalie, 'doc');
  assert.equal(ROLE_OF.odin, 'portefeuille');
});

// R8 D5/C18 : les tables codees SKILL_OF/SKILL_OVERRIDE_OF sont SUPPRIMEES. La skill d'une persona
// se resout par le frontmatter canon (resolveSkills), source unique. Anti-regression du kit deploye :
// les 1res skills resolues valent les anciennes valeurs de table, gimli n'est plus « sans skill ».
test('C18 skills : plus de table codee, resolution par le frontmatter canon (source unique)', () => {
  assert.equal(resolveSkills('odin', { root: REPO })[0], 'iakaframe-odin');
  assert.equal(resolveSkills('aragorn', { root: REPO })[0], 'iakaframe-aragorn');
  assert.equal(resolveSkills('gandalf', { root: REPO })[0], 'iakaframe-cadrage');
  assert.equal(resolveSkills('legolas', { root: REPO })[0], 'iakaframe-qualite');
  assert.equal(resolveSkills('loki', { root: REPO })[0], 'iakaframe-naonedge');
  assert.equal(resolveSkills('nathalie', { root: REPO })[0], 'iakaframe-nathalie');
  // gimli PORTE bien une skill (fin de « pas de skill ») : chaine fabrication (7).
  assert.deepEqual(resolveSkills('gimli', { root: REPO })[0], 'iakaframe-fabrication');
  assert.equal(resolveSkills('gimli', { root: REPO }).length, 7);
});

// SCISSION DU SQUAD PROD (2026-08-08) : la skill de DEPLOIEMENT est passee a `charon` ; `helm`
// porte desormais `iakaframe-surveillance`. Les deux sont asseres ensemble, exprès : c'est le
// couple qui prouve la scission, aucun des deux ne la prouve seul.
test('squad prod : charon porte le deploiement, helm la surveillance (frontmatter, plus de table)', () => {
  assert.deepEqual(resolveSkills('charon', { root: REPO }), ['iakaframe-deploiement']);
  assert.deepEqual(resolveSkills('helm', { root: REPO }), ['iakaframe-surveillance']);
  assert.equal(ROLE_OF.charon, 'deploiement');           // vocabulaire CANON (entree neuve)
  // 🛑 DETTE ASSUMEE, ASSEREE POUR QU'ELLE NE SE CORRIGE PAS EN SILENCE : apres la scission,
  // ROLE_OF.helm dit 'coordination', ce qui est FAUX (il surveille). La reconciliation de cette
  // table est hors perimetre declare (poste B3 de vocabulaire-roles-agnostique.md). Le jour ou
  // ce poste sera traite, CE TEST DOIT ROUGIR — c'est son role.
  assert.equal(ROLE_OF.helm, 'coordination');
});

test('aliases retro-compat conserves (PORTFOLIO_AGENTS, listAgents)', () => {
  assert.deepEqual(PORTFOLIO_PERSONAS, ['odin']);
  assert.equal(PORTFOLIO_AGENTS, PORTFOLIO_PERSONAS);
  assert.equal(listAgents, listPersonas);
});

// --- Activation explicite (D-G / A23) : feanor est MEMBRE du roster mais hors dispatch auto -----
test('activation explicite : EXPLICIT_ACTIVATION_PERSONAS === [feanor], DISTINCTE de PORTFOLIO', () => {
  assert.deepEqual(EXPLICIT_ACTIVATION_PERSONAS, ['feanor']);
  // Constante DISTINCTE : meme comportement (exclusion dispatch), raison differente (R13).
  assert.ok(!PORTFOLIO_PERSONAS.includes('feanor'), 'feanor ne doit PAS etre dans PORTFOLIO_PERSONAS');
  assert.deepEqual(NON_DISPATCH_PERSONAS, ['odin', 'feanor']); // union exclue du dispatch auto
});

test('activation explicite : feanor caste dans iakaframe-8 mais EXCLU de frameTeamPersonas (A23-ii)', () => {
  withHome(synthRoot(), () => {
    // Sans pointeur -> team du default iakaframe (roster 9 dont feanor). L'union portefeuille +
    // activation explicite est retiree : ni odin ni feanor ne sont dispatches automatiquement.
    const team = frameTeamPersonas(tmp());
    assert.ok(!team.includes('feanor'), 'feanor ne doit PAS etre dispatche automatiquement');
    assert.ok(!team.includes('odin'), 'odin (portefeuille) reste hors dispatch');
    assert.deepEqual(team, ['aragorn', 'charon', 'gandalf', 'gimli', 'helm', 'legolas', 'loki', 'nathalie']);
  });
});

test('activation explicite : fullteam ne DEPLOIE pas feanor (A23-ii, test dedie)', () => {
  withHome(synthRoot(), () => {
    const proj = tmp();
    fullteam({ project: proj });
    const deployed = fs.readdirSync(path.join(proj, '.claude', 'agents'))
      .filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, '')).sort();
    assert.ok(!deployed.includes('feanor'), 'fullteam ne doit jamais deployer feanor');
    assert.ok(!deployed.includes('odin'), 'fullteam ne deploie pas le portefeuille');
  });
});

// --- Reservoir de frames : lecture de la team de la frame active (D-E) --------------------
test('frameTeamPersonas : team de la frame active, MOINS le portefeuille (A7)', () => {
  withHome(synthRoot(), () => {
    const proj = tmp();
    fs.writeFileSync(path.join(proj, '.iakaframe'), 'frame=trio\n');
    // team trio = [odin, aragorn, gimli] -> odin (portefeuille) retire -> exactement 2, PAS les 8
    assert.deepEqual(frameTeamPersonas(proj), ['aragorn', 'gimli']);
  });
});

test('frameTeamPersonas : pointeur absent -> team du default (repli, zero regression A11)', () => {
  withHome(synthRoot(), () => {
    // hors projet -> frame default iakaframe -> team iakaframe-8 -> 8 (odin et feanor hors dispatch)
    assert.deepEqual(frameTeamPersonas(tmp()),
      ['aragorn', 'charon', 'gandalf', 'gimli', 'helm', 'legolas', 'loki', 'nathalie']);
  });
});

// ANTI-FUITE (frame-scoping) : la library est PARTAGEE entre frames et contient les personas de
// scrum (carter/gregan/meads). Un projet iakaframe SANS pointeur ne doit JAMAIS les recevoir : le
// repli est la team du DEFAULT, pas la library entiere. Ce test garde la fuite de perimetre fermee.
test('frameTeamPersonas : projet sans pointeur -> team du default, ZERO fuite d\'autres frames', () => {
  withHome(synthRoot(), () => {
    const team = frameTeamPersonas(tmp());
    // exactement le roster dispatchable du default (10 - odin - feanor = 8)
    assert.deepEqual(team, ['aragorn', 'charon', 'gandalf', 'gimli', 'helm', 'legolas', 'loki', 'nathalie']);
    // AUCUNE persona d'une autre frame (scrum) ne fuit, meme si elle existe dans la library partagee
    for (const foreign of ['carter', 'gregan', 'meads']) {
      assert.ok(!team.includes(foreign), `fuite : ${foreign} (frame scrum) ne doit PAS apparaitre`);
    }
  });
});

test('assignedPersonas : empreinte .claude/agents PRIORITAIRE, sinon team de la frame active (A8)', () => {
  withHome(synthRoot(), () => {
    const proj = tmp();
    fs.writeFileSync(path.join(proj, '.iakaframe'), 'frame=trio\n');
    // sans empreinte deployee -> repli = team de la frame active
    assert.deepEqual(assignedPersonas(proj), ['aragorn', 'gimli']);
    // avec empreinte deployee -> priorite a l'empreinte (ignore la frame)
    const dep = path.join(proj, '.claude', 'agents');
    fs.mkdirSync(dep, { recursive: true });
    fs.writeFileSync(path.join(dep, 'gandalf.md'), '# gandalf\n');
    assert.deepEqual(assignedPersonas(proj), ['gandalf']);
  });
});
