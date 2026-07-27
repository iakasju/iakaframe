// Generateur persona -> contrat Claude Code (fix de cause racine de la derive deploye<->source).
//
// Cause racine (cf. specs/instructions/generateur-persona-contrat.md) : AUCUN generateur ne
// produisait les contrats deployes `~/.claude/agents/<id>.md` a partir du canon
// `library/personas/<id>.md` ; les contrats etaient entretenus a la main -> derive garantie.
//
// Ce module est le SEUL rendu correct (transform frontmatter + corps verbatim) execute au
// deploiement live. Il PROJETTE le canon : persona (couche 1) + tools du binding -> contrat
// deploye (couche 2). Il ne CHOISIT rien (pas de table codee) : `description`/`guardrails`
// viennent de la persona, `tools` vient du binding (I3 : facette d'execution hors persona).
//
// Pureté : `renderAgentContract` et `toolsForPersona` sont PURS (sans I/O), verrouillables par
// golden. `generateAgent`/`generateAll` lisent le disque (persona + binding).
import fs from 'node:fs';
import { buildDocument, parseFrontmatter } from './frontmatter.js';
import { scan, pathFor, readEntry, bindingRows, toArray, libraryRoot } from './library.js';
import { activeTeamId } from './frame-active.js';
import { resolveSkills } from './resolve-skills.js';

// Id du binding defaut (MVP : un seul binding claude ; cf. bindings/iakaframe-claude-default.md).
export const DEFAULT_BINDING_ID = 'iakaframe-claude-default';

// --- Corps VERBATIM ---------------------------------------------------------------------------
// Extrait le corps d'un fichier persona en preservant EXACTEMENT ce qui suit le delimiteur
// fermant `---` (y compris la ligne blanche de tete et le `\n` final). On NE reutilise PAS
// `parseFrontmatter().body` qui STRIPPE les `\n` de tete (`replace(/^\n+/, '')`) : le contrat
// deploye conserve cette ligne blanche, la parite byte-a-byte l'exige.
export function verbatimBody(text) {
  const norm = String(text).replace(/^﻿/, '');
  const lines = norm.split(/\r?\n/);
  if (lines[0] !== '---') return norm;
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---' || lines[i] === '...') { end = i; break; }
  }
  if (end < 0) return norm;
  return lines.slice(end + 1).join('\n');
}

// --- tools : resolution DEPUIS LE BINDING (miroir de modelForPersona) --------------------------
// Lit `bindingRows(binding.data)` (schema converge assignments|bindings) et renvoie le `tools`
// de l'assignment homonyme, `[]` si absent. I3 : `tools` est une facette d'execution, elle vit
// dans le binding, jamais dans la persona.
export function toolsForPersona(binding, personaId) {
  if (!binding || !binding.data) return [];
  for (const row of bindingRows(binding.data)) {
    if (row && row.personaId === personaId) return toArray(row.tools);
  }
  return [];
}

// --- Rendu PUR du contrat ---------------------------------------------------------------------
// Assemble le contrat Claude Code : frontmatter ORDRE FIXE `name, description, tools?, skills?,
// guardrails` + corps verbatim. `tools` non vide -> scalaire virgule `Read, Grep, Glob` (PAS une
// flow-list `[...]`) ; `tools` vide -> ligne OMISE (heritage de tous les outils, docs Claude Code).
// `skills` = liste RESOLUE (resolveSkills) rendue en flow-list `[a, b]` (une SEULE forme stable,
// alignee sur guardrails ; l'ordre est verbatim -> tout flottement casse le golden), APRES `tools`
// et AVANT `guardrails`, OMISE si vide (R8 § 5.2, Fait 1 : le runner precharge ce champ).
export function renderAgentContract({ id, description, tools, skills, guardrails, body }) {
  const toolsList = toArray(tools);
  const skillsList = toArray(skills);
  const fields = [
    { key: 'name', kind: 'scalar', value: id },
    { key: 'description', kind: 'scalar', value: description == null ? '' : String(description) },
    // Scalaire virgule : renderScalar ne quote pas `Read, Grep, Glob` (aucune regle de quoting
    // ne s'y applique). Ligne omise si liste vide (undefined -> ignore par buildDocument).
    (toolsList.length ? { key: 'tools', kind: 'scalar', value: toolsList.join(', ') } : undefined),
    (skillsList.length ? { key: 'skills', kind: 'list', value: skillsList } : undefined),
    { key: 'guardrails', kind: 'list', value: toArray(guardrails) },
  ];
  return buildDocument(fields, body == null ? '' : String(body));
}

// --- Generation d'un contrat depuis persona + binding -----------------------------------------
export function generateAgent(id, { root, binding }) {
  const file = pathFor('personas', id, root);
  if (!file || !fs.existsSync(file)) throw new Error(`persona introuvable : ${id}`);
  const raw = fs.readFileSync(file, 'utf8');
  const { data } = parseFrontmatter(raw);
  return renderAgentContract({
    id,
    description: data.description,
    tools: toolsForPersona(binding, id),
    skills: resolveSkills(id, { root }),
    guardrails: data.guardrails,
    body: verbatimBody(raw),
  });
}

// Charge le binding defaut (id connu, repli sur l'unique binding scanne).
export function loadDefaultBinding(root) {
  const named = readEntry('bindings', DEFAULT_BINDING_ID, root);
  if (named) return named;
  const all = scan('bindings', root);
  return all.length ? readEntry('bindings', all[0].id, root) : null;
}

// --- Generation des contrats de la TEAM D'UNE FRAME (Map<id, contenu>) -------------------------
// FRAME-SCOPING (correctif de fuite) : on ne genere plus « tout ce qui traine dans la library »
// (partagee entre frames, elle contient carter/gregan/meads de scrum) mais EXACTEMENT les personas
// de la team d'une frame :
//   - `project` fourni -> team de la frame ACTIVE de ce projet (repli: team du default) ;
//   - sinon           -> team du DEFAULT (`iakaframe` -> `iakaframe-8`, roster canon 9).
// Un id de team absent de la library est ignore silencieusement (team > library, garde defensive).
export function generateAll({ root = libraryRoot(), binding, project } = {}) {
  const b = binding || loadDefaultBinding(root);
  const out = new Map();
  for (const id of personasForTarget({ root, project })) {
    out.set(id, generateAgent(id, { root, binding: b }));
  }
  return out;
}

// --- Personas dont le CONTRAT est deploye sur une cible (definition PARTAGEE) -------------------
// Team de la frame (global -> team du default ; projet -> team de la frame active), FILTREE aux
// personas presentes sur le disque, ordre de la team preserve. C'est la MEME definition que
// `generateAll` (contrats) et que `skills deploy` (union des skills) : l'invariant « contrat deploye
// => skills resolues deployees » (R8 § 5.5) exige une source unique. Portefeuille (odin) et
// activation explicite (feanor) sont INCLUS ici (leur contrat EST materialise par agents generate,
// contrairement a `fullteam` qui ne deploie que le dispatch automatique).
export function personasForTarget({ root = libraryRoot(), project } = {}) {
  const teamId = activeTeamId(project == null ? null : project, root);
  const team = teamId ? readEntry('teams', teamId, root) : null;
  const ids = team ? toArray(team.data.personas) : [];
  return ids.filter((id) => { const f = pathFor('personas', id, root); return f && fs.existsSync(f); });
}
