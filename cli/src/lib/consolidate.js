// T8 - « Consolidation initiale » : fondre les fiches memoire existantes du portefeuille dans
// PROFIL.md / REGISTRE.md du canon, SOUS PLAFOND, sans perte de fait structurant (CURATION, pas
// copie), avec GATE HUMAIN sur le diff. Reference : instruction
// specs/instructions/boucle-apprentissage-incrementale.md (§ 9, critere d'acceptation 10, T8).
//
// CONTRAINTE CAPITALE : cette couche N'ECRIT JAMAIS dans le canon reel (PROFIL.md / REGISTRE.md).
// Elle produit une PROPOSITION DE CONSOLIDATION (option (b) de l'instruction) : un APERCU capé
// `consolidation/PROFIL.proposed.md` + `consolidation/REGISTRE.proposed.md` dans un dossier de
// STAGING du canon, plus un DIFF lisible et un RAPPORT. L'application (recopier l'apercu sur le
// canon) reste un GESTE HUMAIN gate. Aucune mutation du canon reel n'a lieu ici.
//
// CHOIX D'IMPLEMENTATION (documente) : option (b) « apercu staging + diff », retenue plutot que
// (a) « propositions type memory dans proposals/ », parce que la consolidation est une CURATION
// DE DOCUMENT ENTIER sous plafond dur (fondre N fiches en un PROFIL/REGISTRE dense), et que le
// critere 10 demande explicitement une « revue humaine du DIFF de consolidation ». Le diff d'un
// document propose complet est l'objet de gate le plus direct.
//
// DETERMINISME (testable SANS LLM) : le curateur MVP est PUR (heuristiques, zero reseau/modele).
// Il prend l'ESSENCE deja curée de chaque fiche (son champ `description`, une phrase dense) comme
// entree du canon — c'est une curation, pas une copie du corps. Le point d'extension pour une
// SYNTHESE SEMANTIQUE (fusion d'entrees par un LLM, sans rien perdre) est isole derriere le contrat
// `curate(fiches, cfg) -> { profil: entry[], registre: entry[] }` (meme esprit que l'`analyze()` de
// close.js / le `provider` de memory.js) : on branche un curateur LLM plus tard sans toucher au reste.
// Zero dependance runtime (Node core uniquement).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveMemoryHome, ensureLayout, loadConfig, measure, statePath } from './memory.js';
import { parseFrontmatter } from './frontmatter.js';

// --- Source des fiches (§ 9) ----------------------------------------------------------------------
// Defaut : la memoire portefeuille du runner Claude Code au scope ~/work. PARAMETRABLE (--source)
// pour les tests et pour tout autre scope. La source est LUE seulement (jamais mutée).
// Surchargeable par `IAKAFRAME_MEMORY_SOURCE` (remontee du miroir vers le canon, Lot 0 —
// specs/instructions/outillage-scrub-miroir-frame.md § 2.5). Le defaut est INCHANGE : le scope
// portefeuille du poste courant reste resolu tel quel, l'env var n'est qu'une porte de sortie
// pour tout autre scope (autre poste, autre runner, CI) sans forker le fichier.
export function defaultSourceDir() {
  const override = process.env.IAKAFRAME_MEMORY_SOURCE;
  if (override) return path.resolve(override);
  return path.join(os.homedir(), '.claude', 'projects', '-Users-sjupin-work', 'memory');
}

// --- Lecture d'une fiche typée --------------------------------------------------------------------
// Le frontmatter reel imbrique le type sous `metadata:` (map), forme que le mini-parseur partagé
// n'aplatit pas ; on extrait donc le type par un balayage cible du bloc frontmatter. Ordre de
// resolution : `metadata.type` (classe semantique user|feedback|project|reference), sinon
// `metadata.node_type` s'il porte la classe (certaines fiches n'ont que node_type).
function extractType(raw) {
  const lines = String(raw).split(/\r?\n/);
  if (lines[0] !== '---') return '';
  let end = -1;
  for (let i = 1; i < lines.length; i++) { if (lines[i] === '---') { end = i; break; } }
  if (end < 0) return '';
  let type = '';
  let nodeType = '';
  for (const l of lines.slice(1, end)) {
    const mt = l.match(/^\s+type:\s*(\S+)/);
    if (mt) type = mt[1];
    const mn = l.match(/^\s+node_type:\s*(\S+)/);
    if (mn) nodeType = mn[1];
  }
  if (type) return type.toLowerCase();
  if (nodeType && nodeType !== 'memory') return nodeType.toLowerCase();
  return '';
}

// readFiche(file) -> { file, name, description, type, mtime, body }. `description` = essence curée
// (frontmatter) ; c'est ELLE qui alimente le canon (curation), pas le corps.
export function readFiche(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const { data, body } = parseFrontmatter(raw);
  const name = (data.name || path.basename(file, '.md')).toString();
  const description = (data.description ? String(data.description) : '').trim();
  const type = extractType(raw);
  let mtime = 0;
  try { mtime = fs.statSync(file).mtimeMs; } catch { /* garde 0 */ }
  return { file, name, description, type, mtime, body };
}

// loadFiches(sourceDir) -> { fiches, skipped, missing? }. Ignore MEMORY.md (index, pas une fiche)
// et les fichiers sans description (rien a curer — on N'INVENTE pas). Tri stable par nom.
export function loadFiches(sourceDir) {
  const fiches = [];
  const skipped = [];
  let names;
  try { names = fs.readdirSync(sourceDir); }
  catch { return { fiches, skipped, missing: true }; }
  for (const n of [...names].sort((a, b) => a.localeCompare(b))) {
    if (!n.endsWith('.md') || n === 'MEMORY.md') continue;
    const file = path.join(sourceDir, n);
    try {
      if (!fs.statSync(file).isFile()) continue;
      const fiche = readFiche(file);
      if (!fiche.description) { skipped.push({ file: n, reason: 'sans-description' }); continue; }
      fiches.push(fiche);
    } catch { skipped.push({ file: n, reason: 'illisible' }); }
  }
  return { fiches, skipped };
}

// --- Routage type -> cible (§ 9) ------------------------------------------------------------------
// user/feedback  -> PROFIL (qui est le decideur / comment il travaille).
// project/reference -> REGISTRE (faits durables d'environnement / conventions).
// type inconnu -> REGISTRE (defaut conservateur : fait d'environnement, pas trait du decideur).
const PROFIL_TYPES = new Set(['user', 'feedback']);
const REGISTRE_TYPES = new Set(['project', 'reference']);

export function routeTarget(type) {
  if (PROFIL_TYPES.has(type)) return 'profil';
  if (REGISTRE_TYPES.has(type)) return 'registre';
  return 'registre';
}

// --- Prefixe de fiche prioritaire pour PROFIL (CONFIG-DRIVEN, plus de prenom en dur) --------------
// Le palier prioritaire du PROFIL cible les fiches « qui est le decideur ». Le prefixe qui les
// designe est PILOTE PAR CONFIG (env `IAKAFRAME_PROFILE_PREFIX` ou `config.profilePrefix`) — plus
// aucun prenom code en dur dans une regex (meme doctrine que IAKAFRAME_HOSTS, Lot 0 —
// specs/instructions/outillage-scrub-miroir-frame.md § 2.5). NEUTRE par defaut : sans prefixe
// renseigne, le palier est simplement inactif ; le decideur le renseigne dans `~/work/.env`.
export function resolveProfilePrefix(cfg) {
  const raw = process.env.IAKAFRAME_PROFILE_PREFIX || (cfg && cfg.profilePrefix) || '';
  return String(raw).trim();
}

// --- Priorite de curation (selection sous plafond) ------------------------------------------------
// Determine QUELLES entrees survivent quand la matiere depasse le plafond dur (« refus propre »).
// PROFIL : les fiches explicitement « qui est le decideur » priment (prefixe configure puis type
// user), puis le reste des feedbacks. REGISTRE : les invariants durables (reference) avant les faits
// projet.
export function fichePriority(fiche, target, prefix = resolveProfilePrefix()) {
  if (target === 'profil') {
    if (prefix && new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '-').test(fiche.name)) return 3;
    if (fiche.type === 'user') return 2;
    return 1;
  }
  if (fiche.type === 'reference') return 2;
  return 1;
}

// Ordre de selection : priorite desc, puis recence (mtime desc), puis nom asc (stabilite).
function byPriority(a, b) {
  if (b.priority !== a.priority) return b.priority - a.priority;
  if (b.mtime !== a.mtime) return b.mtime - a.mtime;
  return a.source.localeCompare(b.source);
}

// --- Curateur MVP (point d'extension LLM = meme signature) ----------------------------------------
// Contrat : curate(fiches, cfg) -> { profil: entry[], registre: entry[] }
//   entry = { text, source, type, mtime, priority }
// MVP deterministe : essence = description de la fiche ; routage par type ; priorite calculee.
export function rulesCurator(fiches, cfg) {
  const prefix = resolveProfilePrefix(cfg);
  const buckets = { profil: [], registre: [] };
  for (const f of fiches) {
    if (!f.description) continue;
    const target = routeTarget(f.type);
    buckets[target].push({
      text: f.description,
      source: f.name,
      type: f.type,
      mtime: f.mtime,
      priority: fichePriority(f, target, prefix),
    });
  }
  return buckets;
}

// --- Rendu de l'apercu capé -----------------------------------------------------------------------
function today(now) {
  const d = now instanceof Date ? now : new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Isole le header (tout ce qui precede la 1re puce d'entree) d'un etat du canon, pour reconstruire
// l'apercu avec le MEME entete que le canon reel (diff lisible, apercu directement applicable).
function headerOf(text) {
  const lines = String(text).replace(/\n+$/, '').split('\n');
  const idx = lines.findIndex((l) => /^\s*-\s/.test(l));
  return (idx < 0 ? lines : lines.slice(0, idx)).join('\n') + '\n';
}

function renderProposed(header, entries, dateStr) {
  const head = header.replace(/\n+$/, '');
  if (entries.length === 0) return head + '\n';
  const bullets = entries.map((e) => `- ${dateStr} — ${e.text}`);
  return head + '\n' + bullets.join('\n') + '\n';
}

// Selection greedy sous plafond DUR (§ 4.3) : on ajoute par ordre de priorite tant que le fichier
// rendu reste <= cap ; toute entree qui ferait depasser est ECARTEE (jamais tronquee, jamais de
// depassement). Les ecartées sont RAPPORTEES (rien n'est perdu de la source ; gate humain / LLM).
function fitUnderCap(header, entries, cap, dateStr) {
  const sorted = [...entries].sort(byPriority);
  const kept = [];
  const dropped = [];
  for (const e of sorted) {
    if (measure(renderProposed(header, [...kept, e], dateStr)) <= cap) kept.push(e);
    else dropped.push(e);
  }
  return { kept, dropped };
}

// --- Diff lisible (line-based, zero-dep) ----------------------------------------------------------
// Suffisant pour le gate : on montre ce qui serait retiré (-) et ajouté (+) par rapport au canon
// courant. Sur une consolidation initiale (canon vide) le diff est fait d'ajouts.
function lineDiff(before, after) {
  const b = String(before).replace(/\n+$/, '').split('\n');
  const a = String(after).replace(/\n+$/, '').split('\n');
  const bSet = new Set(b);
  const aSet = new Set(a);
  return {
    removed: b.filter((l) => !aSet.has(l) && l !== ''),
    added: a.filter((l) => !bSet.has(l) && l !== ''),
  };
}

// --- Artefacts de gate (DIFF.md + RAPPORT.md) -----------------------------------------------------
function renderDiffDoc(result) {
  const block = (title, d) => {
    const lines = [`## ${title}`, '```diff'];
    for (const l of d.removed) lines.push(`- ${l}`);
    for (const l of d.added) lines.push(`+ ${l}`);
    lines.push('```', '');
    return lines.join('\n');
  };
  return `# Diff de consolidation (gate humain — critere 10)

> Apercu vs canon courant. RIEN n'est appliqué : recopier un apercu sur le canon reel est un
> geste humain gate. Le canon reel (PROFIL.md / REGISTRE.md) n'a PAS été muté par cette commande.

${block('PROFIL.md', result.profil.diff)}
${block('REGISTRE.md', result.registre.diff)}`;
}

function renderReportDoc(report) {
  const section = (target, r) => {
    const kept = r.kept.map((e) => `- [garde] (${e.type}) \`${e.source}\` — ${e.text}`).join('\n') || '- (aucune)';
    const dropped = r.dropped.map((e) => `- [ecarté-plafond] (${e.type}) \`${e.source}\` — ${e.text}`).join('\n') || '- (aucune)';
    return `## ${target.toUpperCase()} — ${r.chars}/${r.cap} chars (${r.kept.length} retenue(s), ${r.dropped.length} écartée(s))

### Faits structurants RETENUS
${kept}

### Écartés sous plafond (restent dans la source ; à synthétiser — gate/LLM)
${dropped}`;
  };
  const skipped = report.skipped.length
    ? report.skipped.map((s) => `- \`${s.file}\` (${s.reason})`).join('\n')
    : '- (aucune)';
  return `# Rapport de consolidation initiale (T8, § 9 / critere 10)

- Source : \`${report.sourceDir}\`${report.missing ? ' — INTROUVABLE' : ''}
- Canon (staging) : \`${report.home}\`
- Fiches lues : ${report.fiches} · ignorées : ${report.skipped.length}
- Curation : essence = \`description\` de chaque fiche (curation, pas copie). Routage :
  user/feedback → PROFIL ; project/reference → REGISTRE.
- Plafonds durs (config.yaml) : PROFIL ${report.profil.cap} · REGISTRE ${report.registre.cap} chars.
- INVARIANT : le canon reel n'est PAS muté ; l'apercu doit être validé sur diff puis appliqué à la main.

${section('profil', report.profil)}

${section('registre', report.registre)}

## Fiches ignorées (sans description / illisibles)
${skipped}`;
}

// --- Geste `consolidate` (§ 9, T8) ----------------------------------------------------------------
// Entree : opts { home, source, config, now, curate }.
//   - home   : canon (STAGING) — resolu comme T1 (--home > IAKA_MEMORY_HOME > ~/.iaka/memory/).
//              POUR NE PAS MUTER LE CANON REEL, appeler avec un --home de staging temporaire.
//   - source : dossier des fiches (defaut = memoire portefeuille ~/work) ; LU seulement.
//   - now    : horloge injectable (date des entrees) pour un rendu deterministe en test.
//   - curate : POINT D'EXTENSION (defaut = rulesCurator) ; un curateur LLM se branche ici.
// Sortie : rapport { ok, home, sourceDir, stagingDir, fiches, skipped, missing, profil, registre }.
// Ecritures : UNIQUEMENT sous <home>/consolidation/ (apercus + DIFF.md + RAPPORT.md). Le canon reel
// PROFIL.md / REGISTRE.md n'est JAMAIS touché (invariant central de T8).
export function consolidate(opts = {}) {
  const home = resolveMemoryHome(opts.home);
  ensureLayout(home);
  const cfg = opts.config || loadConfig(home);
  const sourceDir = opts.source ? path.resolve(opts.source) : defaultSourceDir();
  const dateStr = today(opts.now);
  const curate = typeof opts.curate === 'function' ? opts.curate : rulesCurator;

  const { fiches, skipped, missing } = loadFiches(sourceDir);
  const buckets = curate(fiches, cfg);

  const stagingDir = path.join(home, 'consolidation');
  fs.mkdirSync(stagingDir, { recursive: true });

  const report = { ok: true, home, sourceDir, stagingDir, fiches: fiches.length, skipped, missing: !!missing };

  for (const target of ['profil', 'registre']) {
    const cap = cfg.caps[target];
    const before = fs.readFileSync(statePath(home, target), 'utf8');
    const header = headerOf(before);
    const { kept, dropped } = fitUnderCap(header, buckets[target] || [], cap, dateStr);
    const proposed = renderProposed(header, kept, dateStr);
    const fileName = target === 'profil' ? 'PROFIL.proposed.md' : 'REGISTRE.proposed.md';
    const proposedPath = path.join(stagingDir, fileName);
    fs.writeFileSync(proposedPath, proposed, 'utf8');
    report[target] = {
      cap, chars: measure(proposed), kept, dropped, proposedPath,
      overCap: measure(proposed) > cap, diff: lineDiff(before, proposed), proposed,
    };
  }

  fs.writeFileSync(path.join(stagingDir, 'DIFF.md'), renderDiffDoc(report), 'utf8');
  fs.writeFileSync(path.join(stagingDir, 'RAPPORT.md'), renderReportDoc(report), 'utf8');
  return report;
}
