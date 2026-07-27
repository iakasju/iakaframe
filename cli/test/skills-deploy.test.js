// skills deploy [--check] : union resolue, copie non destructive/idempotente, orphelines signalees,
// --check sans ecriture (R8 § 5.4, C10-C14). TOUT se passe en DOSSIER TEMPORAIRE : le vrai
// ~/.claude n'est JAMAIS touche (project = tmpdir ; jamais --global contre le home reel).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unionSkills, deploySkills, skillStatus } from '../src/lib/skills-deploy.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..'); // depot iakaframe (vraie bibliotheque)

const UNION_19 = [
  'iakaframe-odin', 'iakastart', 'iakaframe-aragorn', 'iakaframe-jalon', 'iakaframe-cadrage',
  'iakaframe-lecture-maquettes', 'iakaframe-fabrication', 'iakaframe-gestion-de-source',
  'iakaframe-git', 'iakaframe-forgejo', 'iakaframe-conteneurisation', 'iakaframe-docker',
  'iakaframe-qualite', 'iakaframe-deploiement', 'iakaframe-naonedge', 'iakaframe-nathalie',
  'iakaframe-memoire-humaine', 'iakaframe-appflowy-doc', 'iakaframe-frame',
];

function tmpProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-skills-'));
}

// --- 1. Union (C10) -----------------------------------------------------------------------------

test('C10 unionSkills : exactement l union 19 (jalon/fabrication/frame/lecture-maquettes incluses)', () => {
  const u = unionSkills({ root: REPO, project: null });
  assert.equal(u.length, 19, 'union de taille 19');
  assert.deepEqual([...u].sort(), [...UNION_19].sort());
  for (const s of ['iakaframe-jalon', 'iakaframe-fabrication', 'iakaframe-frame', 'iakaframe-lecture-maquettes']) {
    assert.ok(u.includes(s), `union doit contenir ${s}`);
  }
});

test('union deterministe : ordre stable sur deux appels', () => {
  assert.deepEqual(unionSkills({ root: REPO, project: null }), unionSkills({ root: REPO, project: null }));
});

// --- 2. Deploiement en dossier temporaire (C11, C12) --------------------------------------------

test('C11 deploy (ecriture) : copie recursive fidele + count 19 + fichiers annexes', () => {
  const proj = tmpProject();
  const rep = deploySkills({ root: REPO, project: proj, global: false, check: false });
  assert.equal(rep.count, 19);
  const skillsDir = path.join(proj, '.claude', 'skills');
  // chaque skill de l'union est un dossier avec au moins SKILL.md, byte-identique au canon
  for (const id of UNION_19) {
    const dst = path.join(skillsDir, id, 'SKILL.md');
    assert.ok(fs.existsSync(dst), `${id}/SKILL.md deploye`);
    assert.equal(skillStatus(path.join(REPO, 'library', 'skills', id), path.join(skillsDir, id)), 'ok', `${id} fidele`);
  }
  fs.rmSync(proj, { recursive: true, force: true });
});

test('C12 --check exit 0 (ok:true) quand tout est a jour (idempotence)', () => {
  const proj = tmpProject();
  deploySkills({ root: REPO, project: proj, check: false });               // 1er deploiement
  const rep1 = deploySkills({ root: REPO, project: proj, check: false });  // idempotent : tout unchanged
  assert.ok(rep1.skills.every((r) => r.status === 'unchanged'), 'second deploy = tout unchanged');
  const chk = deploySkills({ root: REPO, project: proj, check: true });
  assert.equal(chk.drift, 0);
  assert.equal(chk.ok, true);
  assert.ok(chk.skills.every((r) => r.status === 'ok'));
  fs.rmSync(proj, { recursive: true, force: true });
});

// --- 3. Derive detectee : drift / absent (C13) --------------------------------------------------

test('C13 alterer une skill deployee => --check drift ; en supprimer une => absent', () => {
  const proj = tmpProject();
  deploySkills({ root: REPO, project: proj, check: false });
  const skillsDir = path.join(proj, '.claude', 'skills');
  // altere le contenu d'une skill
  fs.appendFileSync(path.join(skillsDir, 'iakaframe-jalon', 'SKILL.md'), '\nDRIFT\n');
  // en supprime une autre entierement
  fs.rmSync(path.join(skillsDir, 'iakaframe-docker'), { recursive: true, force: true });
  const chk = deploySkills({ root: REPO, project: proj, check: true });
  assert.equal(chk.ok, false);
  assert.ok(chk.drift >= 2);
  assert.equal(chk.skills.find((r) => r.skill === 'iakaframe-jalon').status, 'drift');
  assert.equal(chk.skills.find((r) => r.skill === 'iakaframe-docker').status, 'absent');
  // re-deploy repare (non destructif ailleurs) puis --check redevient vert
  deploySkills({ root: REPO, project: proj, check: false });
  assert.equal(deploySkills({ root: REPO, project: proj, check: true }).drift, 0);
  fs.rmSync(proj, { recursive: true, force: true });
});

// --- 4. Orphelines : signalees, jamais supprimees, ne cassent pas --check (C14) ------------------

test('C14 skill hors union => orphan, JAMAIS supprimee, FS inchange, --check ne casse pas dessus', () => {
  const proj = tmpProject();
  deploySkills({ root: REPO, project: proj, check: false });
  const skillsDir = path.join(proj, '.claude', 'skills');
  // depose une skill orpheline (hors union) au runtime
  const orphanDir = path.join(skillsDir, 'iakaframe-orpheline-test');
  fs.mkdirSync(orphanDir, { recursive: true });
  fs.writeFileSync(path.join(orphanDir, 'SKILL.md'), '---\nname: iakaframe-orpheline-test\n---\n# orpheline\n');

  const chk = deploySkills({ root: REPO, project: proj, check: true });
  // signalee orphan
  assert.ok(chk.orphans.some((o) => o.skill === 'iakaframe-orpheline-test' && o.status === 'orphan'));
  // count reste l'union (jamais gonfle par l'orpheline)
  assert.equal(chk.count, 19);
  // --check ne casse pas sur orphan seul (drift issu des seules union skills, ici 0)
  assert.equal(chk.drift, 0);
  assert.equal(chk.ok, true);

  // deploy (ecriture) NE SUPPRIME PAS l'orpheline
  deploySkills({ root: REPO, project: proj, check: false });
  assert.ok(fs.existsSync(orphanDir), 'orpheline conservee apres un deploy');
  assert.ok(fs.existsSync(path.join(orphanDir, 'SKILL.md')), 'contenu orphelin intact');
  fs.rmSync(proj, { recursive: true, force: true });
});

// --- 5. Preuve de non-ecriture : --check n'ecrit RIEN -------------------------------------------

test('--check n ecrit RIEN sur une cible vierge (aucun dossier cree)', () => {
  const proj = tmpProject();
  const chk = deploySkills({ root: REPO, project: proj, check: true });
  // tout absent, mais AUCUNE ecriture
  assert.ok(chk.skills.every((r) => r.status === 'absent'));
  assert.equal(fs.existsSync(path.join(proj, '.claude')), false, 'aucun .claude cree en --check');
  fs.rmSync(proj, { recursive: true, force: true });
});
