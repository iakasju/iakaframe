// T2 - `recall` : rappel BON MARCHE sur l'historique brut du canon (instruction
// boucle-apprentissage-incrementale.md § 5.2). Recherche plein-texte sur `transcripts/` du canon :
// on retrouve un passage SANS le charger dans le prompt. Moteur MVP = ripgrep (rg) en sous-process
// (zero infra, deja present, cross-OS) ; REPLI lecture-fichiers en Node pur si rg est absent (jamais
// de crash opaque). Zero dependance npm. La RESOLUTION du chemin du canon reste propriete de T1
// (lib/memory.js) : ici on ne fait QUE la recherche, a partir d'un `home` deja resolu.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { hasCmd } from './which.js';

// Dossier de l'historique brut (§ 4.2). Source unique du rappel plein-texte.
export function transcriptsDir(home) { return path.join(home, 'transcripts'); }

// Vrai si ripgrep est joignable dans le PATH (moteur MVP prefere).
export function rgAvailable() { return hasCmd('rg'); }

// Horodatage d'un transcript : prefixe date YYYY-MM-DD du nom de fichier (§ 4.2), sinon null.
export function dateFromName(file) {
  const m = path.basename(file).match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

// Appariement LITTERAL a semantique smart-case (parite avec `rg --fixed-strings --smart-case`) :
// insensible a la casse si la requete est tout en minuscules, sensible sinon. On cherche des
// PASSAGES (phrases), pas des regex : le litteral est le bon defaut au MVP.
function makeMatcher(query) {
  if (/[A-Z]/.test(query)) return (line) => line.includes(query);
  const q = query.toLowerCase();
  return (line) => line.toLowerCase().includes(q);
}

// Parcours recursif des fichiers de `dir` (transcripts + sous-dossiers, ex. odin/).
function walkFiles(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkFiles(full));
    else if (ent.isFile()) out.push(full);
  }
  return out;
}

// Recherche via ripgrep (--json = sortie structuree, robuste aux `:` dans le texte). Retourne la
// liste brute { path, line, text }, ou `null` si rg n'est pas lancable (ENOENT -> repli Node).
// Leve une erreur seulement en cas d'echec REEL de rg (status 2).
function searchRg(dir, query) {
  const res = spawnSync(
    'rg',
    ['--json', '--fixed-strings', '--smart-case', '--', query, dir],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  if (res.error) return null;               // rg absent/injoignable -> le caller bascule en Node
  if (res.status === 2) {                   // 0 = matches, 1 = aucun match, 2 = erreur reelle
    throw new Error(`ripgrep a echoue : ${(res.stderr || '').trim() || 'erreur inconnue'}`);
  }
  const out = [];
  for (const raw of (res.stdout || '').split('\n')) {
    if (!raw) continue;
    let obj;
    try { obj = JSON.parse(raw); } catch { continue; }
    if (obj.type !== 'match' || !obj.data) continue;
    const p = obj.data.path && obj.data.path.text;
    if (!p) continue;                       // chemin non-UTF8 (path.bytes) : ignore au MVP
    const text = (obj.data.lines && obj.data.lines.text ? obj.data.lines.text : '').replace(/\r?\n$/, '');
    out.push({ path: p, line: obj.data.line_number, text });
  }
  return out;
}

// Repli Node pur : lit chaque fichier ligne a ligne (memes semantiques litterales smart-case).
// Plus lent que rg mais AUTONOME (aucune dependance systeme) : le rappel marche partout.
function searchNode(dir, query) {
  const match = makeMatcher(query);
  const out = [];
  for (const file of walkFiles(dir)) {
    let content;
    try { content = fs.readFileSync(file, 'utf8'); } catch { continue; }
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (match(lines[i])) out.push({ path: file, line: i + 1, text: lines[i] });
    }
  }
  return out;
}

// Enrichit + classe les resultats : RECENCE (date du fichier desc, sinon mtime desc) PUIS pertinence
// (au MVP : ordre de ligne ; le classement fin est [post-MVP] SQLite+FTS5 derriere la meme interface).
function rankResults(home, matches) {
  const mtimeCache = new Map();
  const enriched = matches.map((m) => {
    const abs = path.resolve(m.path);
    let mtime = mtimeCache.get(abs);
    if (mtime === undefined) {
      try { mtime = fs.statSync(abs).mtimeMs; } catch { mtime = 0; }
      mtimeCache.set(abs, mtime);
    }
    return {
      file: path.relative(home, abs),
      path: abs,
      line: m.line,
      text: String(m.text).trim(),
      date: dateFromName(abs),
      _mtime: mtime,
    };
  });
  enriched.sort((a, b) => {
    const da = a.date || '', db = b.date || '';
    if (da !== db) return db.localeCompare(da);          // date de fichier : recent d'abord
    if (a._mtime !== b._mtime) return b._mtime - a._mtime; // sinon mtime : recent d'abord
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    return a.line - b.line;                               // au sein d'un fichier : ordre de lecture
  });
  return enriched.map(({ _mtime, ...r }) => r);            // mtime interne, hors sortie publique
}

// Geste `recall` (§ 5.2). Entree : un `home` de canon DEJA RESOLU (T1) + une requete + options.
// Sortie : { ok, engine, degraded, query, dir, count, results[] } ; `results` = objets structures
// { file, path, line, text, date }, classes recence puis pertinence. `--json` sert `results` tel quel.
// Degradation gracieuse : si rg est absent (ou echoue au lancement), on retombe sur le scan Node et
// on marque `degraded: true` (+ `fallback: true` si rg etait attendu mais a echoue) — jamais de crash.
export function recall(home, query, opts = {}) {
  const q = String(query ?? '');
  const dir = transcriptsDir(home);
  if (!q.trim()) return { ok: false, reason: 'empty-query', query: q, dir, count: 0, results: [] };

  const wantEngine = opts.engine || (rgAvailable() ? 'rg' : 'node');

  if (!fs.existsSync(dir)) {
    // Canon jamais initialise / aucun historique : rappel vide, pas une erreur.
    return { ok: true, engine: wantEngine, degraded: wantEngine === 'node', query: q, dir, count: 0, results: [] };
  }

  let engine = wantEngine, fallback = false, matches;
  if (engine === 'rg') {
    matches = searchRg(dir, q);
    if (matches === null) { engine = 'node'; fallback = true; matches = searchNode(dir, q); }
  } else {
    matches = searchNode(dir, q);
  }

  const results = rankResults(home, matches);
  const report = { ok: true, engine, degraded: engine === 'node', query: q, dir, count: results.length, results };
  if (fallback) report.fallback = true;
  return report;
}
