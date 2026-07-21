// Lot A - CANON PROJET : la connaissance INCREMENTALE du produit (instruction
// specs/instructions/canon-projet-connaissance-produit.md, § 4 a § 6, arbitrages AR-1/AR-3/AR-4).
//
// DEUXIEME AXE du meme moteur : le canon GLOBAL apprend *qui est le decideur* (lib/memory.js), le
// canon PROJET apprend *ce qu'est le produit*. Ce n'est pas un moteur neuf.
//
// LE CRITERE QUI SEPARE CE MODULE DE TOUT L'EXISTANT (§ 2) : « incrementale MODIFIEE, pas une main
// courante ». specs/etat-des-lieux.md est un INSTANTANE (il ecrase) ; ~/work/BACKLOG.md est une MAIN
// COURANTE (il empile). AUCUN DES DEUX NE REVISE. `produitReplace` est la fonction qui porte la
// promesse du lot : elle corrige une entree EN PLACE et la re-date, de sorte que la formulation
// anterieure N'EST PLUS dans le fichier (verrouille par test). Un module qui ne ferait qu'ajouter
// des lignes raterait le besoin.
//
// POURQUOI UN MODULE A PART, ET PAS UN ELARGISSEMENT DE `TARGETS` DANS memory.js (§ 3.3, option
// ECARTEE, motif trace) : elargir TARGETS rendrait `memoryAdd(home, 'produit', ...)` legal sur le
// canon GLOBAL, donc rendrait possible d'ecrire de la connaissance produit dans ~/.iaka/memory/ —
// l'exact inverse de l'etancheite gravee en § 4.3. LA SEPARATION DES MODULES *EST* LE GARDE-FOU.
// memory.js n'est ni importe pour ses cibles ni modifie : on ne lui reprend que son mini-YAML (pur).
//
// La couche reellement reutilisable est lib/bullet.js (puce datee idempotente), pas memory.js.
// Zero dependance runtime (Node core uniquement).
import fs from 'node:fs';
import path from 'node:path';
import { today, isEntryLine, entryContent, appendBullet, measure, serializeLines } from './bullet.js';
// Mini-YAML PUR (aucune notion de cible globale) : seule chose empruntee a memory.js, qui reste
// INCHANGE. Emprunter un parseur ne couple pas les vocabulaires.
import { parseYaml } from './memory.js';

export { measure };

// --- Invariants de contenu (§ 4.3), graves ici pour etre lus au bon endroit -----------------------
// 1. Le canon projet ne parle QUE du produit. Un fait sur le DECIDEUR va au canon GLOBAL, jamais
//    ici : c'est ce qui empeche le canon projet d'etre un silo (§ 3.1) et ce qui borne l'exposition
//    sur Forgejo (§ 4.1) — ce fichier est VERSIONNE ET POUSSE.
// 2. Le canon projet ne reecrit JAMAIS specs/PROJET.md ni specs/etat-des-lieux.md. En cas de
//    desaccord : PROJET.md fait foi sur l'INTENTION, le canon fait foi sur le CONSTAT, et un
//    desaccord persistant n'est pas tranche par la machine — il remonte au decideur.
// 3. Substrat NEUTRE : Markdown plat, zero dependance, aucun couplage runner.

// --- Resolution du chemin (§ 4.1, AR-1 : specs/canon/PRODUIT.md) ----------------------------------
// AUCUN chemin en dur : tout se derive de `projectPath`. Fonctionne sur un projet SANS
// specs/PROJET.md — cas mesure d'iakaframe lui-meme (§ 3.2) : le canon ne depend jamais de PROJET.md.
export function projectCanonHome(projectPath) {
  if (!projectPath) throw new Error('projectPath requis : le canon projet vit DANS le projet.');
  return path.join(path.resolve(projectPath), 'specs', 'canon');
}

const PRODUIT_FILE = 'PRODUIT.md';
const CONFIG_FILE = 'config.yaml';

export function produitPath(home) { return path.join(home, PRODUIT_FILE); }
export function projectConfigPath(home) { return path.join(home, CONFIG_FILE); }

// --- Config (§ 6.3-5 : le plafond est LU DEPUIS LA CONFIG, JAMAIS `undefined`) --------------------
// LE PIEGE QU'ON EVITE ICI, ET C'EST LE MOTIF CENTRAL DU LOT : dans memory.js, `caps` est indexe par
// cible (memory.js:145) — une cible inconnue donne `cap === undefined`, et le plafond DUR (le
// garde-fou central) CESSE SILENCIEUSEMENT DE S'APPLIQUER. Une garde qui se trompe en silence est
// pire qu'une garde absente. Ici le plafond est resolu par une fonction qui ne peut PAS rendre
// undefined : toute valeur non finie/non positive retombe sur le defaut (verrouille par test).
export function defaultProjectConfig() {
  return {
    caps: { produit: 4000 },        // plafond DUR en caracteres (approx tokens*4)
    consolidation_threshold: 0.8,   // consolidation conseillee a ~80 % du plafond
  };
}

// Le fichier config.yaml est OPTIONNEL et n'est JAMAIS cree (§ 6.3-2 : `ensureProjectCanon` cree
// PRODUIT.md ET RIEN D'AUTRE). Absent ou illisible -> defauts, sans jamais lever.
export function loadProjectConfig(home) {
  const d = defaultProjectConfig();
  const p = projectConfigPath(home);
  if (!fs.existsSync(p)) return d;
  let parsed;
  try { parsed = parseYaml(fs.readFileSync(p, 'utf8')); }
  catch { return d; }
  return {
    caps: { ...d.caps, ...((parsed && parsed.caps) || {}) },
    consolidation_threshold: (parsed && parsed.consolidation_threshold) ?? d.consolidation_threshold,
  };
}

// Plafond effectif : TOTALEMENT immunise contre `undefined` (cf. piege ci-dessus).
export function produitCap(cfg) {
  const raw = cfg && cfg.caps ? cfg.caps.produit : undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : defaultProjectConfig().caps.produit;
}

function consolidationThreshold(cfg) {
  const n = Number(cfg && cfg.consolidation_threshold);
  return Number.isFinite(n) && n > 0 && n <= 1 ? n : defaultProjectConfig().consolidation_threshold;
}

// --- Layout MINIMAL (§ 6.3-2) ---------------------------------------------------------------------
// Cree specs/canon/PRODUIT.md avec son en-tete, ET RIEN D'AUTRE. En particulier : NI transcripts/,
// NI proposals/, NI PROFIL.md, NI REGISTRE.md. `ensureLayout` du canon global (memory.js:108-121)
// deverserait cette structure machine dans un depot VERSIONNE, ou elle n'a rien a faire : c'est
// justement pourquoi on ne le reutilise pas. Idempotent : n'ecrase JAMAIS un fichier existant.
export const PRODUIT_HEAD = '# PRODUIT — ce qu\'on a appris du produit\n\n' +
  '<!-- Canon PROJET (iakaframe). Connaissance INCRÉMENTALE et RÉVISÉE du produit : les entrées\n' +
  '     sont corrigées EN PLACE, ce n\'est pas une main courante. Constat (terrain), pas intention\n' +
  '     (specs/PROJET.md) ni situation (specs/etat-des-lieux.md).\n' +
  '     Ne parle QUE du produit — jamais du décideur (→ canon global), jamais des personnes.\n' +
  '     Fichier VERSIONNÉ et POUSSÉ : rien n\'y entre sans l\'accord du décideur (garde de\n' +
  '     consentement : `iakaframe review`). Plafond dur : specs/canon/config.yaml caps.produit. -->\n';

export function ensureProjectCanon(home) {
  const created = [];
  if (!fs.existsSync(home)) { fs.mkdirSync(home, { recursive: true }); created.push(home); }
  const p = produitPath(home);
  if (!fs.existsSync(p)) { fs.writeFileSync(p, PRODUIT_HEAD, 'utf8'); created.push(p); }
  return created;
}

// Le canon projet « existe » s'il porte PRODUIT.md. Sert a la degradation gracieuse : un projet qui
// n'a jamais pose de canon ne doit PAS voir specs/canon/ apparaitre par effet de bord d'une pause
// (parite stricte avec `canonExists` de cadence.js:26-28).
export function projectCanonExists(home) { return fs.existsSync(produitPath(home)); }

// --- Mutations : add / replace / remove (parite stricte avec memoryAdd/Replace/Remove) ------------
// Une entree = une puce datee `- YYYY-MM-DD — <contenu>`. Les operations sont IDEMPOTENTES et
// KEYEES SUR LE CONTENU (le prefixe date est ignore a l'appariement).

function readLines(home) {
  const p = produitPath(home);
  const text = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : PRODUIT_HEAD;
  return text.replace(/\n+$/, '').split('\n');
}

function writeLines(home, lines) {
  fs.writeFileSync(produitPath(home), serializeLines(lines), 'utf8');
}

// Cœur commun : transforme les lignes, controle le plafond DUR, ecrit si OK. Ne rend jamais un
// rapport sans `cap` chiffre.
function apply(home, mutate, action, opts = {}) {
  ensureProjectCanon(home);
  const cfg = opts.config || loadProjectConfig(home);
  const cap = produitCap(cfg);
  const soft = Math.floor(cap * consolidationThreshold(cfg));
  const before = readLines(home);
  const { lines, changed } = mutate(before);
  const candidate = serializeLines(lines);
  const length = measure(candidate);

  // Plafond DUR : une CROISSANCE au-dela du plafond est REFUSEE -> il faut consolider. C'est le
  // plafond qui FORCE la revision : sans lui, on retombe mecaniquement sur la main courante que le
  // decideur refuse (§ 4.3-5). Un retrait qui reduit le fichier reste toujours possible.
  if (length > cap && candidate.length > serializeLines(before).length) {
    return {
      ok: false, action, target: 'produit', changed: false,
      length, cap, consolidationNeeded: true, reason: 'cap-exceeded',
    };
  }
  if (changed) writeLines(home, lines);
  return {
    ok: true, action, target: 'produit', changed,
    length, cap, consolidationNeeded: length >= soft,
  };
}

// add : ajoute une entree datee si son contenu n'existe pas deja (idempotent).
export function produitAdd(home, content, opts = {}) {
  const text = String(content).trim();
  if (!text) throw new Error('Contenu vide : rien a ajouter.');
  return apply(home, (lines) => appendBullet(lines, text, opts.now), 'add', opts);
}

// replace : LA FONCTION QUI PORTE LA PROMESSE DU LOT (§ 6.3-4). Corrige une entree EN PLACE et
// RE-DATE la ligne : apres revision, la formulation anterieure N'EST PLUS presente dans le fichier.
// C'est la difference TESTABLE d'avec une main courante, ou l'ancienne formulation coexisterait pour
// toujours avec la nouvelle sans que rien ne dise laquelle fait foi. Erreur si l'entree est absente
// (on ne transforme JAMAIS un replace rate en add silencieux : ce serait re-fabriquer la main courante).
export function produitReplace(home, oldContent, newContent, opts = {}) {
  const oldText = String(oldContent).trim();
  const newText = String(newContent).trim();
  if (!newText) throw new Error('Nouveau contenu vide.');
  let found = false;
  const res = apply(home, (lines) => {
    const out = lines.map((l) => {
      if (isEntryLine(l) && entryContent(l) === oldText) {
        found = true;
        return `- ${today(opts.now)} — ${newText}`;
      }
      return l;
    });
    return { lines: out, changed: found && oldText !== newText };
  }, 'replace', opts);
  if (!found) {
    return { ok: false, action: 'replace', target: 'produit', changed: false, reason: 'not-found', match: oldText };
  }
  return res;
}

// remove : le `-` symetrique de `produitAdd` (symetrie ajout/suppression, § 8). Idempotent.
export function produitRemove(home, content, opts = {}) {
  const text = String(content).trim();
  return apply(home, (lines) => {
    const out = lines.filter((l) => !(isEntryLine(l) && entryContent(l) === text));
    return { lines: out, changed: out.length !== lines.length };
  }, 'remove', opts);
}

// Liste les entrees (contenu seul), pour inspection.
export function produitList(home) {
  return readLines(home).filter(isEntryLine).map(entryContent);
}

// --- Rendu pour l'ouverture de session (§ 6.3-10) --------------------------------------------------
// Le canon projet S'AJOUTE au canon global, il ne le REMPLACE JAMAIS. Lecture seule : ne cree rien.
export function loadProjectCanon(projectPath) {
  const home = projectCanonHome(projectPath);
  const p = produitPath(home);
  const exists = fs.existsSync(p);
  const content = exists ? fs.readFileSync(p, 'utf8') : '';
  const cfg = loadProjectConfig(home);
  return {
    ok: true, home, projectPath: path.resolve(projectPath), path: p, exists,
    content, chars: content.length, cap: produitCap(cfg),
    empty: !/^\s*-\s/m.test(content),
  };
}

export function renderProjectCanon(canon) {
  if (!canon || !canon.exists) return '';
  const lines = [];
  lines.push(`--- PRODUIT — ce qu'on a appris du produit (<= ${canon.cap} car.) ---`);
  lines.push(`Source : ${canon.path} (canon PROJET, en PLUS du canon portefeuille — jamais a la place)`);
  lines.push(canon.empty ? '(vide)' : canon.content.replace(/\n+$/, ''));
  lines.push('');
  return lines.join('\n');
}
