// Resolution TRANSITIVE des skills d'une persona (R8, deploiement-skills-runtime.md § 5.1, D1).
//
// Le canon declare l'information a DEUX niveaux : la persona porte `skills:` (niveau declare) ;
// chaque skill porte `subskills:` (composition). Le runtime doit precharger la liste RESOLUE
// (fermeture transitive) : le geste OBLIGATOIRE `jalon` est un subskill (d'aragorn/cadrage/
// fabrication/frame) — ne precharger que le niveau declare le laisserait dependre d'une invocation
// probabiliste. Le prechargement de la liste resolue est le seul mecanisme deterministe.
//
// PURETE relative : lit le disque (personas + skills) mais ne fait AUCUNE ecriture. Deterministe :
// ordre de parcours en PROFONDEUR, dedoublonnage a la PREMIERE occurrence (stabilite du golden).
import fs from 'node:fs';
import { readEntry, pathFor, toArray, libraryRoot } from './library.js';

// resolveSkills(personaId, { root }) -> string[] (ids resolus, ordre normatif, dedoublonnes).
//   - parcours en PROFONDEUR a partir de chaque skill de `persona.skills`, dans l'ordre ;
//   - emet la skill PUIS descend recursivement dans ses `subskills` ;
//   - dedoublonne en conservant la PREMIERE occurrence ;
//   - CYCLE (A -> ... -> A) => ERREUR explicite nommant le cycle (jamais de boucle infinie) ;
//   - skill referencee mais absente de library/skills/ => ERREUR (jamais un skip silencieux).
export function resolveSkills(personaId, { root = libraryRoot() } = {}) {
  const persona = readEntry('personas', personaId, root);
  if (!persona) throw new Error(`persona introuvable : ${personaId}`);

  const out = [];
  const emitted = new Set();  // dedoublonnage global (1re occurrence)
  const path = [];            // chemin DFS courant (detection de cycle)

  const visit = (skillId) => {
    // 1. Cycle : la skill est deja sur le chemin courant.
    if (path.includes(skillId)) {
      throw new Error(`cycle de skills detecte : ${[...path, skillId].join(' -> ')}`);
    }
    // 2. Existence : la skill doit exister sur le disque (jamais un skip silencieux).
    const file = pathFor('skills', skillId, root);
    if (!file || !fs.existsSync(file)) {
      throw new Error(`skill referencee introuvable : ${skillId} (persona ${personaId})`);
    }
    // 3. Emission (pre-ordre) : 1re occurrence seulement.
    if (!emitted.has(skillId)) {
      emitted.add(skillId);
      out.push(skillId);
    }
    // 4. Descente dans les subskills declares.
    path.push(skillId);
    const entry = readEntry('skills', skillId, root);
    for (const sub of toArray(entry.data.subskills)) visit(sub);
    path.pop();
  };

  for (const s of toArray(persona.data.skills)) visit(s);
  return out;
}
