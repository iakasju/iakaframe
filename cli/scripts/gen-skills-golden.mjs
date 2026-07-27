#!/usr/bin/env node
// Producteur UNIQUE du golden de manifeste des skills (R8, deploiement-skills-runtime.md § 5.7).
// Calque de gen-agents-golden.mjs : fige un artefact deterministe que parite-skills.test.js relit
// pour rougir a TOUTE derive non regeneree (un `subskills:`/`layer:` de skill OU un `skills:` de
// persona modifie sans regenerer ce golden casse le test).
//
// Contenu (§ 5.7) :
//   - inventaire : pour chaque skill du DOMAINE iakaframe (26) -> id, sha256(SKILL.md), subskills
//     declares, layer (ou null explicite) ;
//   - resolution : pour chaque persona du roster (9) -> liste ORDONNEE de resolveSkills ;
//   - compteurs  : nombre de skills, nombre de personas.
//
// Regenerer : node cli/scripts/gen-skills-golden.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { scan, readEntry, pathFor } from '../src/lib/library.js';
import { resolveSkills } from '../src/lib/resolve-skills.js';
import { personasForTarget } from '../src/lib/generate-agents.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..'); // depot iakaframe (vraie bibliotheque)
const OUT = path.join(HERE, '..', 'test', 'fixtures', 'skills-golden', 'manifest.json');

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

// Domaine iakaframe : les skills de la methode (prefixe iakaframe- ou iakastart), a l'exclusion
// des skills d'autres frames (dt-*, gtd-*, scrum-*, ...). Compte canon attendu = 26.
export function iakaframeSkillIds(root) {
  return scan('skills', root)
    .map((e) => e.id)
    .filter((id) => id.startsWith('iakaframe-') || id === 'iakastart')
    .sort();
}

export function buildManifest(root = REPO) {
  const skillIds = iakaframeSkillIds(root);
  const skills = skillIds.map((id) => {
    const entry = readEntry('skills', id, root);
    const raw = fs.readFileSync(pathFor('skills', id, root), 'utf8');
    const subskills = Array.isArray(entry.data.subskills)
      ? entry.data.subskills
      : (entry.data.subskills ? [entry.data.subskills] : []);
    return {
      id,
      sha256: sha256(raw),
      subskills,
      layer: entry.data.layer != null ? String(entry.data.layer) : null,
    };
  });

  const personas = personasForTarget({ root, project: null }).slice().sort();
  const resolution = {};
  for (const p of personas) resolution[p] = resolveSkills(p, { root });

  return {
    _provenance: 'iakaframe:skills-manifest-golden — NE PAS EDITER A LA MAIN. Reference : '
      + 'cli/src/lib/resolve-skills.js resolveSkills. Regenerer : node cli/scripts/gen-skills-golden.mjs',
    counts: { skills: skills.length, personas: personas.length },
    skills,
    resolution,
  };
}

export function serializeManifest(m) {
  return JSON.stringify(m, null, 2) + '\n';
}

function main() {
  const m = buildManifest(REPO);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, serializeManifest(m));
  process.stdout.write(`golden skills : ${m.counts.skills} skills / ${m.counts.personas} personas -> ${OUT}\n`);
}

// Execute uniquement en direct (import par le test = pas d'ecriture).
if (import.meta.url === `file://${process.argv[1]}`) main();
