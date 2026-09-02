// Generateur persona -> contrat Claude Code (fix de cause racine de la derive deploye<->source).
//
// Cause racine (cf. specs/instructions/generateur-persona-contrat.md) : AUCUN generateur ne
// produisait les contrats deployes `~/.claude/agents/<id>.md` a partir du canon
// `library/personas/<id>.md` ; les contrats etaient entretenus a la main -> derive garantie.
//
// Ce module est le SEUL rendu correct (transform frontmatter + corps verbatim) execute au
// deploiement live. Il PROJETTE le canon : persona (couche 1) + tools du binding -> contrat
// deploye (couche 2). Il ne CHOISIT rien (pas de table codee) : `description`/`guardrails`
// viennent de la persona, `tools` ET `model` viennent du binding (I3 : facettes d'execution hors
// persona ; aucune persona ne porte de champ `model`).
//
// Pureté : `renderAgentContract`, `toolsForPersona` et `modelForPersona` sont PURS (sans I/O),
// verrouillables par golden. `generateAgent`/`generateAll` lisent le disque (persona + binding).
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

// --- tools : resolution DEPUIS LE BINDING (miroir de modelForPersona, ci-dessous) --------------
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

// --- model : resolution DEPUIS LE BINDING (miroir exact de toolsForPersona) --------------------
// Meme lecture, meme schema, meme repli : rend le `model` de l'assignment homonyme, `''` si le
// binding est absent, si la persona n'y figure pas, ou si le champ manque (D1). PURE.
// Elle ne FILTRE rien et ne connait AUCUN runner : elle LIT. Le filtre `runner !== claude-code`
// vit dans `generateAgent` (D4) — le descendre ici rendrait la fonction mal nommee et cesserait
// d'en faire le miroir de `toolsForPersona`.
export function modelForPersona(binding, personaId) {
  if (!binding || !binding.data) return '';
  for (const row of bindingRows(binding.data)) {
    if (row && row.personaId === personaId) return row.model == null ? '' : String(row.model);
  }
  return '';
}

// --- model EFFECTIF : surcharge de projet PUIS defaut de frame (surcharge-modele-par-projet.md,
// D1) --------------------------------------------------------------------------------------------
// Point de resolution UNIQUE de la chaine : surcharge (deja LUE depuis <projet>/iakaframe.json,
// cle `modelOverrides`) ?? modelForPersona (le binding, lot 1) ?? ''. `modelForPersona` n'est PAS
// modifiee : elle reste le DEUXIEME terme, jamais reecrite. `overrides` est un objet simple
// (`{}` si aucune surcharge de projet, ou hors contexte projet) : cette fonction ne lit RIEN sur
// le disque (PURE), la lecture vit dans `project-models.js`.
export function effectiveModel({ overrides, binding, personaId }) {
  const ov = overrides && typeof overrides === 'object' ? overrides[personaId] : undefined;
  if (typeof ov === 'string' && ov.trim() !== '') return ov;
  return modelForPersona(binding, personaId);
}

// --- runner d'un assignment (support du filtre D4) --------------------------------------------
// Lecture BRUTE du champ `runner`, sans normalisation d'alias : D4 tranche par l'ABSTENTION
// (un assignment sans `runner` declare est traite comme non-claude). Le seul sens de defaut est
// donc « ne rien emettre », jamais « supposer claude-code ».
function runnerForPersona(binding, personaId) {
  if (!binding || !binding.data) return '';
  for (const row of bindingRows(binding.data)) {
    if (row && row.personaId === personaId) return row.runner == null ? '' : String(row.runner);
  }
  return '';
}

// --- Rendu PUR du contrat ---------------------------------------------------------------------
// Assemble le contrat Claude Code : frontmatter ORDRE FIXE `name, description, tools?, model?,
// skills?, guardrails` + corps verbatim. `tools` non vide -> scalaire virgule `Read, Grep, Glob`
// (PAS une flow-list `[...]`) ; `tools` vide -> ligne OMISE (heritage de tous les outils, docs
// Claude Code).
// `model` = scalaire, APRES `tools` et AVANT `skills` (D2) : c'est l'ordre de la table officielle
// des champs de frontmatter subagent et de son exemple canonique (F4), et il regroupe `model` avec
// `tools` dans le bloc des facettes d'execution issues du BINDING, avant `skills` (persona) et
// `guardrails` (persona, hors champs Claude Code, volontairement en queue). Vide ou absent ->
// ligne OMISE (D3) : le sous-agent retombe alors sur l'ordre de resolution du runner, c'est-a-dire
// le comportement inchange. On n'ecrit JAMAIS `inherit` en repli — ce serait poser une decision
// (« calque-toi sur la session ») la ou le canon n'en a pris aucune ; `inherit` reste disponible
// comme valeur EXPLICITE du binding. Aucune allowlist de valeurs (D5) : la chaine du binding est
// projetee verbatim, la liste des alias bougeant cote runner.
// `skills` = liste RESOLUE (resolveSkills) rendue en flow-list `[a, b]` (une SEULE forme stable,
// alignee sur guardrails ; l'ordre est verbatim -> tout flottement casse le golden), APRES `model`
// et AVANT `guardrails`, OMISE si vide (R8 § 5.2, Fait 1 : le runner precharge ce champ).
export function renderAgentContract({ id, description, tools, model, skills, guardrails, body }) {
  const toolsList = toArray(tools);
  const modelValue = model == null ? '' : String(model);
  const skillsList = toArray(skills);
  const fields = [
    { key: 'name', kind: 'scalar', value: id },
    { key: 'description', kind: 'scalar', value: description == null ? '' : String(description) },
    // Scalaire virgule : renderScalar ne quote pas `Read, Grep, Glob` (aucune regle de quoting
    // ne s'y applique). Ligne omise si liste vide (undefined -> ignore par buildDocument).
    (toolsList.length ? { key: 'tools', kind: 'scalar', value: toolsList.join(', ') } : undefined),
    // Scalaire simple. `renderScalar` ne re-quote pas un mot plein : le binding ecrit
    // `model: "opus"`, le contrat deploye porte `model: opus` (D6, attendu, pas une derive).
    (modelValue ? { key: 'model', kind: 'scalar', value: modelValue } : undefined),
    (skillsList.length ? { key: 'skills', kind: 'list', value: skillsList } : undefined),
    { key: 'guardrails', kind: 'list', value: toArray(guardrails) },
  ];
  return buildDocument(fields, body == null ? '' : String(body));
}

// --- Generation d'un contrat depuis persona + binding -----------------------------------------
// `overrides` (surcharge-modele-par-projet.md, D1) : objet `modelOverrides` DEJA LU depuis
// <projet>/iakaframe.json par l'appelant ; defaut `{}` (aucune surcharge) — les appelants
// existants (`generateAll`, `agents generate`) ne le passent PAS et gardent donc un comportement
// STRICTEMENT inchange (repli sur `modelForPersona` seul, via `effectiveModel`).
export function generateAgent(id, { root, binding, overrides = {} } = {}) {
  const file = pathFor('personas', id, root);
  if (!file || !fs.existsSync(file)) throw new Error(`persona introuvable : ${id}`);
  const raw = fs.readFileSync(file, 'utf8');
  const { data } = parseFrontmatter(raw);
  // --- COUTURE DE RESOLUTION DU MODELE (D7 du lot 1) — POINT UNIQUE ET NOMME ------------------
  // Le modele est resolu ICI, en UN SEUL endroit, dans une variable locale nommee. Ne PAS inliner
  // cet appel dans l'objet passe au rendu, et ne pas en ajouter un second. Lot 2 (surcharge du
  // modele par projet) : SUBSTITUTION D'UNE SEULE LIGNE — `modelForPersona(binding, id)` devient
  // `effectiveModel({ overrides, binding, personaId: id })`, qui LIT `modelForPersona` en second
  // terme (elle n'est pas modifiee, cf. generateAgents.js). Deux appels, ou un appel inline,
  // obligeraient a rouvrir cette fonction — donc a ecrire deux fois la meme resolution.
  // Filtre de runner (D4) : `generateAgent` est la SEULE fonction qui projette un canon vers un
  // contrat CLAUDE CODE ; le modele n'y est transmis que si l'assignment cible ce runner. Un
  // binding vers un autre runner (ex. `ollama-distant`, dont les modeles `qwen3.5:9b` / `gemma4:e4b`
  // ne sont pas des valeurs valides de ce champ) fabriquerait sinon un contrat FAUX mais d'apparence
  // complete. Un champ absent est plus honnete qu'un champ plausible.
  const model = runnerForPersona(binding, id) === 'claude-code' ? effectiveModel({ overrides, binding, personaId: id }) : '';
  return renderAgentContract({
    id,
    description: data.description,
    tools: toolsForPersona(binding, id),
    model,
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
