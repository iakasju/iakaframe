// Canon du portefeuille (T1 - « Fondations du canon ») : substrat de fichiers NEUTRE, propriete
// de personne, JAMAIS sous ~/.claude/. Resolution du chemin, layout, config.yaml, et l'outil
// `memory` (add/replace/remove) avec controle de plafond DUR + declenchement de consolidation a
// ~80 %. Zero dependance runtime (Node core uniquement). Reference : instruction
// specs/instructions/boucle-apprentissage-incrementale.md (§ 4.1 a 4.4, decisions Q-1..Q-6 § 13).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// --- Resolution du chemin du canon (§ 4.1, Q-1) ---------------------------------------------------
// Priorite : opt (param) > IAKA_MEMORY_HOME (env) > defaut ~/.iaka/memory/. Le canon vit au niveau
// *home* (un seul canon quel que soit le projet : fin de la fragmentation par scope). Il ne DOIT
// jamais vivre sous ~/.claude/ (ce serait coupler la donnee a Claude Code) : on refuse ce cas.
export function defaultMemoryHome() {
  return path.join(os.homedir(), '.iaka', 'memory');
}

// Vrai si `p` est situe sous ~/.claude/ (comparaison sur chemins resolus, insensible a la casse
// sur Windows/macOS). Le canon y est INTERDIT (substrat neutre, § 3 invariant de frontiere).
export function isUnderClaudeHome(p) {
  const claude = path.resolve(path.join(os.homedir(), '.claude'));
  const target = path.resolve(p);
  const rel = path.relative(claude, target);
  const inside = rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
  if (process.platform === 'win32' || process.platform === 'darwin') {
    const relLower = path.relative(claude.toLowerCase(), target.toLowerCase());
    return relLower === '' || (!relLower.startsWith('..') && !path.isAbsolute(relLower));
  }
  return inside;
}

export function resolveMemoryHome(opt) {
  const raw = opt || process.env.IAKA_MEMORY_HOME || defaultMemoryHome();
  const resolved = path.resolve(raw);
  if (isUnderClaudeHome(resolved)) {
    throw new Error(
      `Canon interdit sous ~/.claude/ : ${resolved}. Le canon est un substrat NEUTRE ` +
      `(defaut ~/.iaka/memory/ ou IAKA_MEMORY_HOME) ; il ne doit pas etre couple a un runner.`,
    );
  }
  return resolved;
}

// --- Config du canon (§ 4.3-4.4, Q-3/Q-4/Q-5) -----------------------------------------------------
// Plafonds maison parametrables (Q-3), seuil de consolidation ~80 %, politique de consentement
// (Q-4 : PROFIL en file / REGISTRE auto), cadence de cloture pour `close` (Q-2/§ 6), seuil N=2 (Q-5).
export function defaultConfig() {
  return {
    caps: { profil: 2000, registre: 3200 },   // Q-3 : plafonds DURS en caracteres (approx tokens*4)
    consolidation_threshold: 0.8,             // § 4.3 : consolidation declenchee a ~80 % du plafond
    repeat_threshold: 2,                      // Q-5 : N corrections/procedures repetees avant capture
    write_approval: 'auto',                   // Q-4 : auto = REGISTRE auto + PROFIL en file ; queue = tout en file
    cadence: { close_on: ['pause', 'version'] }, // § 6 : `close` branche sur pause|version (pas reprise)
    provider: { kind: 'none' },               // invariant 6 : provider externe nul par defaut
  };
}

const CONFIG_FILE = 'config.yaml';

export function configPath(home) { return path.join(home, CONFIG_FILE); }

export function loadConfig(home) {
  const p = configPath(home);
  if (!fs.existsSync(p)) return defaultConfig();
  const parsed = parseYaml(fs.readFileSync(p, 'utf8'));
  // Fusion superficielle sur les defauts (tolere un fichier partiel).
  const d = defaultConfig();
  return {
    caps: { ...d.caps, ...(parsed.caps || {}) },
    consolidation_threshold: parsed.consolidation_threshold ?? d.consolidation_threshold,
    repeat_threshold: parsed.repeat_threshold ?? d.repeat_threshold,
    write_approval: parsed.write_approval ?? d.write_approval,
    cadence: { ...d.cadence, ...(parsed.cadence || {}) },
    provider: { ...d.provider, ...(parsed.provider || {}) },
  };
}

export function writeConfig(home, cfg) {
  fs.mkdirSync(home, { recursive: true });
  fs.writeFileSync(configPath(home), serializeYaml(cfg), 'utf8');
}

// --- Layout du canon (§ 4.2) ----------------------------------------------------------------------
// Cree la disposition si absente (non destructif : n'ecrase jamais un fichier existant). Les stubs
// [post-MVP] provider.json / index/ ne sont PAS crees ici (releve de T9) : on reste dans T1.
const PROFIL_FILE = 'PROFIL.md';
const REGISTRE_FILE = 'REGISTRE.md';

const HEAD = {
  profil: '# PROFIL — qui est le décideur\n\n' +
    '<!-- Canon iakaframe (substrat neutre). Plafond dur : config.yaml caps.profil. ' +
    'Entrées = puces datées, gérées par l\'outil `memory`. -->\n',
  registre: '# REGISTRE — ce que l\'agent a appris\n\n' +
    '<!-- Canon iakaframe (substrat neutre). Plafond dur : config.yaml caps.registre. ' +
    'Entrées = puces datées, gérées par l\'outil `memory`. -->\n',
};

export function statePath(home, target) {
  return path.join(home, target === 'profil' ? PROFIL_FILE : REGISTRE_FILE);
}

export function ensureLayout(home) {
  const created = [];
  const mkdir = (d) => { if (!fs.existsSync(d)) { fs.mkdirSync(d, { recursive: true }); created.push(d); } };
  const mkfile = (f, content) => { if (!fs.existsSync(f)) { fs.writeFileSync(f, content, 'utf8'); created.push(f); } };

  mkdir(home);
  mkdir(path.join(home, 'transcripts'));
  mkdir(path.join(home, 'transcripts', 'odin')); // miroir horodate & attribue de #odin (§ 4.2, T7)
  mkdir(path.join(home, 'proposals'));            // RESERVOIR de propositions typees (Q-2)
  mkfile(statePath(home, 'profil'), HEAD.profil);
  mkfile(statePath(home, 'registre'), HEAD.registre);
  if (!fs.existsSync(configPath(home))) { writeConfig(home, defaultConfig()); created.push(configPath(home)); }
  return created;
}

// --- Outil `memory` : add / replace / remove (§ 4.4) ----------------------------------------------
// Une entree = une puce datee `- YYYY-MM-DD — <contenu>`. Les operations sont IDEMPOTENTES et
// keyees sur le <contenu> (le prefixe date est ignore pour l'appariement). Pas d'ecriture libre :
// les deltas restent inspectables (base de la file de consentement, T5).
const TARGETS = ['profil', 'registre'];

export function isTarget(t) { return TARGETS.includes(t); }

function today() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Extrait le <contenu> d'une ligne de puce (strippe `- ` puis un prefixe date `YYYY-MM-DD — `).
function entryContent(line) {
  const body = line.replace(/^\s*-\s?/, '');
  const m = body.match(/^\d{4}-\d{2}-\d{2}\s+—\s+([\s\S]*)$/);
  return (m ? m[1] : body).trim();
}

function isEntryLine(line) { return /^\s*-\s/.test(line); }

// Mesure agnostique du plafond : en CARACTERES (§ 4.3, approx tokens ≈ chars/4). On mesure le
// FICHIER ENTIER (parite avec `wc` de l'invariant 1), header compris.
export function measure(content) { return content.length; }

// Rend le contenu du fichier a partir des lignes (header + entries), en preservant le header.
function readFileLines(home, target) {
  const p = statePath(home, target);
  const text = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : HEAD[target];
  return text.replace(/\n+$/, '').split('\n');
}

// Ecrit le fichier a partir des lignes, avec un unique saut de ligne final.
function writeFileLines(home, target, lines) {
  fs.writeFileSync(statePath(home, target), lines.join('\n').replace(/\n+$/, '') + '\n', 'utf8');
}

// Evalue le plafond pour un contenu candidat. Retourne { length, cap, soft, overCap, consolidationNeeded }.
function evalCap(cfg, target, candidate) {
  const cap = cfg.caps[target];
  const soft = Math.floor(cap * cfg.consolidation_threshold);
  const length = measure(candidate);
  return { length, cap, soft, overCap: length > cap, consolidationNeeded: length >= soft };
}

// Cœur commun : applique une transformation de la liste de lignes, controle le plafond, ecrit si OK.
// Retourne un rapport { ok, action, target, changed, length, cap, consolidationNeeded, reason? }.
function apply(home, target, mutate, action) {
  if (!isTarget(target)) throw new Error(`Cible invalide : ${target} (attendu : ${TARGETS.join('|')})`);
  ensureLayout(home);
  const cfg = loadConfig(home);
  const before = readFileLines(home, target);
  const { lines, changed } = mutate(before);
  const candidate = lines.join('\n').replace(/\n+$/, '') + '\n';
  const cap = evalCap(cfg, target, candidate);

  // Plafond DUR : une croissance qui depasse le plafond est REFUSEE -> il faut consolider (T4/close).
  if (cap.overCap && candidate.length > (before.join('\n') + '\n').length) {
    return {
      ok: false, action, target, changed: false,
      length: cap.length, cap: cap.cap, consolidationNeeded: true,
      reason: 'cap-exceeded',
    };
  }
  if (changed) writeFileLines(home, target, lines);
  return {
    ok: true, action, target, changed,
    length: cap.length, cap: cap.cap, consolidationNeeded: cap.consolidationNeeded,
  };
}

// add : ajoute une entree datee si son contenu n'existe pas deja (idempotent).
export function memoryAdd(home, target, content) {
  const text = String(content).trim();
  if (!text) throw new Error('Contenu vide : rien a ajouter.');
  return apply(home, target, (lines) => {
    if (lines.some((l) => isEntryLine(l) && entryContent(l) === text)) return { lines, changed: false };
    return { lines: [...lines, `- ${today()} — ${text}`], changed: true };
  }, 'add');
}

// replace : remplace le contenu d'une entree existante (apparie sur l'ancien contenu). Erreur si absente.
export function memoryReplace(home, target, oldContent, newContent) {
  const oldText = String(oldContent).trim();
  const newText = String(newContent).trim();
  if (!newText) throw new Error('Nouveau contenu vide.');
  let found = false;
  const res = apply(home, target, (lines) => {
    const out = lines.map((l) => {
      if (isEntryLine(l) && entryContent(l) === oldText) {
        found = true;
        return `- ${today()} — ${newText}`;
      }
      return l;
    });
    return { lines: out, changed: found && oldText !== newText };
  }, 'replace');
  if (!found) {
    return { ok: false, action: 'replace', target, changed: false, reason: 'not-found', match: oldText };
  }
  return res;
}

// remove : retire l'entree dont le contenu correspond (idempotent : no-op si absente).
export function memoryRemove(home, target, content) {
  const text = String(content).trim();
  return apply(home, target, (lines) => {
    const out = lines.filter((l) => !(isEntryLine(l) && entryContent(l) === text));
    return { lines: out, changed: out.length !== lines.length };
  }, 'remove');
}

// Liste les entrees (contenu) d'un etat, pour inspection.
export function memoryList(home, target) {
  if (!isTarget(target)) throw new Error(`Cible invalide : ${target}`);
  return readFileLines(home, target).filter(isEntryLine).map(entryContent);
}

// --- Mini-YAML DEDIE au config.yaml du canon ------------------------------------------------------
// Node n'embarque aucun parseur YAML et le CLI reste ZERO-DEP (cf. lib/frontmatter.js). On couvre
// STRICTEMENT la forme du config.yaml du canon : commentaires `#`, cles `cle: valeur`, un niveau de
// map imbriquee (indent 2), listes flow `[a, b]`, scalaires (int/float/bool/string). Pas YAML complet.
export function parseYaml(text) {
  const root = {};
  const stack = [{ indent: -1, obj: root }];
  for (const rawLine of String(text).replace(/^﻿/, '').split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, '');
    const t = line.trim();
    if (t === '' || t.startsWith('#')) continue;
    const m = t.match(/^([A-Za-z0-9_.-]+):\s*(.*)$/);
    if (!m) continue;
    const indent = line.match(/^ */)[0].length;
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
    const parent = stack[stack.length - 1].obj;
    const [, key, rest] = m;
    if (rest === '') {
      const child = {};
      parent[key] = child;
      stack.push({ indent, obj: child });
    } else {
      parent[key] = parseYamlScalar(rest);
    }
  }
  return root;
}

function parseYamlScalar(raw) {
  const s = raw.trim();
  if (s.startsWith('[') && s.endsWith(']')) {
    const inner = s.slice(1, -1).trim();
    return inner === '' ? [] : inner.split(',').map((x) => parseYamlScalar(x));
  }
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) return s.slice(1, -1);
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'null' || s === '~') return null;
  if (/^-?\d+$/.test(s)) return Number(s);
  if (/^-?\d*\.\d+$/.test(s)) return Number(s);
  return s;
}

function scalarYaml(v) {
  if (Array.isArray(v)) return `[${v.map(scalarYaml).join(', ')}]`;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (v === null) return 'null';
  const s = String(v);
  return /^[A-Za-z0-9_.\-\/ ]+$/.test(s) && s.trim() === s ? s : JSON.stringify(s);
}

export function serializeYaml(cfg) {
  const lines = ['# Canon iakaframe — config (plafonds, seuils, consentement, cadence).',
    '# Genere/gere par l\'outil `memory` ; editable a la main (fichier plat, substrat neutre).'];
  for (const [key, val] of Object.entries(cfg)) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      lines.push(`${key}:`);
      for (const [k, v] of Object.entries(val)) lines.push(`  ${k}: ${scalarYaml(v)}`);
    } else {
      lines.push(`${key}: ${scalarYaml(val)}`);
    }
  }
  return lines.join('\n') + '\n';
}
