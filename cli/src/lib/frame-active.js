// Frame active : resolution du POINTEUR de frame (projet + portefeuille) et de la TEAM de la
// frame active. Zero etat global mutable : la frame est propriete du LIEU (projet), avec repli
// TOUJOURS defini sur le default cable `iakaframe` (jamais d'echec dur). Reservoir de frames :
// cf. specs/instructions/reservoir-de-frames.md (D-C/D-D/D-E, invariants § 8).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readEntry } from './library.js';

// Default cable : le repli ultime quand aucun pointeur n'est trouve. C'est le nom de la frame
// default du reservoir (descripteur frames/iakaframe.md, `default: true`). Jamais d'echec dur.
export const HARDWIRED_DEFAULT_FRAME = 'iakaframe';

// Nom du marqueur de pointeur portefeuille (niveau chapeau, D-D). Texte cle=valeur, lisible par
// le CLI ET la GUI (source unique, comme IAKAFRAME_HOME).
export const PORTFOLIO_MARKER = '.iakaframe-portefeuille';

// Racine du chapeau (calque de library.js/hatRoot, non exporte la-bas) : IAKAFRAME_ROOT si
// defini/non vide, sinon <home>/work, sinon 'work' relatif.
function hatRoot() {
  const env = process.env.IAKAFRAME_ROOT;
  if (env && env.trim() !== '') return env.trim();
  const home = os.homedir();
  return home ? path.join(home, 'work') : 'work';
}

// Nom du fichier de conf PROJET, domicile CANONIQUE du pointeur de frame active (cle `frame`).
// Source unique CLI<->GUI (la GUI y ecrit via project_conf.rs::write_active_frame). Le marqueur
// texte .iakaframe (frame=) devient legacy, lu en REPLI de transition (D-4).
export const PROJECT_CONF = 'iakaframe.json';

// Parse un fichier JSON (iakaframe.json) en objet, defensif : absent / illisible / JSON invalide /
// non-objet -> {} (jamais de jet, calque de parseKeyValueFile). Ne CREE rien.
export function parseJsonFile(file) {
  let raw;
  try { raw = fs.readFileSync(file, 'utf8'); } catch { return {}; }
  let obj;
  try { obj = JSON.parse(raw); } catch { return {}; }
  return (obj && typeof obj === 'object' && !Array.isArray(obj)) ? obj : {};
}

// Pointeur de frame ACTIVE brut d'un projet (chaine, '' si aucun). SOURCE UNIQUE CLI<->GUI, ordre :
//   (1) <projet>/iakaframe.json cle `frame` (canon go-forward, ecrit par GUI / `frame use`) ;
//   (2) <projet>/.iakaframe `frame=` (REPLI de transition, projets deja init) ;
//   (3) '' (l'appelant retombe sur HARDWIRED_DEFAULT_FRAME).
// Jamais de jet ; jamais de repli DUR ici (le cablage default est chez l'appelant).
export function readActiveFramePointer(projectDir) {
  if (!projectDir) return '';
  const proj = path.resolve(projectDir);
  const json = parseJsonFile(path.join(proj, PROJECT_CONF));
  const fromJson = (typeof json.frame === 'string' ? json.frame : '').trim();
  if (fromJson) return fromJson;
  const kv = parseKeyValueFile(path.join(proj, '.iakaframe'));
  return (kv.frame || '').trim();
}

// Ecriture NON DESTRUCTIVE de la cle `frame` dans <projet>/iakaframe.json (miroir exact du
// write_active_frame Rust cote GUI). Relit le JSON, ne touche QUE la cle `frame`, preserve les
// cles du CLI (runner/node/target/note/aiderModel...). REFUSE d'ecrire si le fichier existe mais
// est ILLISIBLE (l'ecraser perdrait les cles du CLI) -> { ok:false, reason:'unreadable' }.
// frameId vide/absent -> RETRAIT de la cle `frame` (repli default). Retourne { ok, path, frame }.
export function writeActiveFramePointer(projectDir, frameId) {
  const file = path.join(path.resolve(projectDir), PROJECT_CONF);
  let cfg = {};
  if (fs.existsSync(file)) {
    let raw;
    try { raw = fs.readFileSync(file, 'utf8'); } catch { return { ok: false, reason: 'unreadable', path: file }; }
    try { cfg = JSON.parse(raw); } catch { return { ok: false, reason: 'unreadable', path: file }; }
    if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) return { ok: false, reason: 'unreadable', path: file };
  }
  const id = (frameId || '').trim();
  if (id) cfg.frame = id; else delete cfg.frame;
  fs.writeFileSync(file, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
  return { ok: true, path: file, frame: id || null };
}

// Parse un fichier texte `cle=valeur` (patron du marqueur .iakaframe) en objet. Lignes vides et
// `#` ignorees ; la 1re occurrence d'une cle gagne. Fichier absent/illisible -> {} (jamais de jet).
export function parseKeyValueFile(file) {
  const out = {};
  let raw;
  try { raw = fs.readFileSync(file, 'utf8'); } catch { return out; }
  for (const line of raw.split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith('#')) continue;
    const eq = s.indexOf('=');
    if (eq < 0) continue;
    const k = s.slice(0, eq).trim();
    const v = s.slice(eq + 1).trim();
    if (k && !(k in out)) out[k] = v;
  }
  return out;
}

// Lit le pointeur PORTEFEUILLE (D-D) : `defaultFrame=<id>` (+ version) dans <hat>/.iakaframe-
// portefeuille. Ordre de recherche : parent du projet (chapeau naturel) puis hatRoot(). Absent ->
// null (l'appelant retombe sur HARDWIRED_DEFAULT_FRAME). `projectDir` optionnel (umbrella direct).
export function readPortfolioDefaultFrame(projectDir) {
  const candidates = [];
  if (projectDir) candidates.push(path.join(path.dirname(path.resolve(projectDir)), PORTFOLIO_MARKER));
  candidates.push(path.join(hatRoot(), PORTFOLIO_MARKER));
  for (const file of candidates) {
    const kv = parseKeyValueFile(file);
    const id = (kv.defaultFrame || '').trim();
    if (id) return { frame: id, frameVersion: (kv.defaultFrameVersion || kv.frameVersion || '').trim() || null, source: file };
  }
  return null;
}

// Descripteur de la frame `frameId` (type `frames`, AR-1). null si introuvable.
export function frameDescriptor(frameId, root) {
  if (!frameId) return null;
  return readEntry('frames', frameId, root);
}

// Version d'une frame (AR-3 : TOUJOURS la `version` du descripteur ; source unique). Repli :
// version outil `fallbackVersion` si le descripteur n'existe pas / ne porte pas de version.
export function frameVersionOf(frameId, root, fallbackVersion) {
  const d = frameDescriptor(frameId, root);
  const v = d && d.data && d.data.version;
  return (typeof v === 'string' && v.trim()) ? v.trim() : (fallbackVersion || null);
}

// Choix de la frame a STAMPER a l'init (D-C/D-D) : pointeur portefeuille s'il existe, sinon le
// default cable. Retourne { frame, frameVersion } (version depuis le descripteur, AR-3).
export function resolveFrameForInit(projectDir, root, fallbackVersion) {
  const pf = readPortfolioDefaultFrame(projectDir);
  const frame = (pf && pf.frame) || HARDWIRED_DEFAULT_FRAME;
  const frameVersion = frameVersionOf(frame, root, fallbackVersion);
  return { frame, frameVersion };
}

// Frame ACTIVE d'un projet (D-E) : pointeur source unique CLI<->GUI (iakaframe.json cle `frame` en
// PRIORITE, repli .iakaframe `frame=`). Absent -> HARDWIRED_DEFAULT_FRAME (repli, zero regression).
// Hors projet (dir sans pointeur) -> default.
export function activeFrameId(projectDir) {
  return readActiveFramePointer(projectDir) || HARDWIRED_DEFAULT_FRAME;
}

// Garde de COHERENCE (A-cohérence, § 7) : le pointeur d'INTENTION `.iakaframe`.frame et la
// MATERIALISATION deployee `.claude/iakaframe-kit.json` (method/team) doivent designer la MEME
// frame quand les DEUX existent. Le descripteur de la frame active porte (methodId, teamId) ; le
// kit.json porte (methodId, teamId) de l'assemblage deploye. Divergence = SIGNALEE (jamais un jet).
// Statuts : 'no-pointer' (pas de frame active) / 'no-kit' (jamais deploye) / 'no-descriptor'
// (frame introuvable) / 'coherent' / 'divergent'. ok=false uniquement sur 'divergent'.
export function frameCoherence(projectDir, root) {
  if (!projectDir) return { ok: true, status: 'no-pointer' };
  const proj = path.resolve(projectDir);
  const frameId = readActiveFramePointer(proj); // iakaframe.json `frame` prioritaire, repli .iakaframe
  if (!frameId) return { ok: true, status: 'no-pointer' };

  let kit = null;
  try { kit = JSON.parse(fs.readFileSync(path.join(proj, '.claude', 'iakaframe-kit.json'), 'utf8')); }
  catch { return { ok: true, status: 'no-kit', frame: frameId }; }

  const desc = frameDescriptor(frameId, root);
  if (!desc || !desc.data) return { ok: true, status: 'no-descriptor', frame: frameId };

  const want = { methodId: desc.data.methodId, teamId: desc.data.teamId };
  const got = { methodId: kit.methodId, teamId: kit.teamId };
  if (want.methodId === got.methodId && want.teamId === got.teamId) {
    return { ok: true, status: 'coherent', frame: frameId, methodId: got.methodId, teamId: got.teamId };
  }
  return {
    ok: false, status: 'divergent', frame: frameId,
    reason: `pointeur de frame active=${frameId} (method ${want.methodId}/team ${want.teamId}) diverge de .claude/iakaframe-kit.json (method ${got.methodId}/team ${got.teamId})`,
    expected: want, actual: got,
  };
}

// TeamId de la frame active d'un projet (D-E) : descripteur de la frame active -> `teamId`. Repli :
// si le descripteur (ou son teamId) est introuvable, retombe sur la team du default, puis null.
export function activeTeamId(projectDir, root) {
  const tryFrame = (fid) => {
    const d = frameDescriptor(fid, root);
    const t = d && d.data && d.data.teamId;
    return (typeof t === 'string' && t.trim()) ? t.trim() : null;
  };
  const fid = activeFrameId(projectDir);
  return tryFrame(fid) || (fid !== HARDWIRED_DEFAULT_FRAME ? tryFrame(HARDWIRED_DEFAULT_FRAME) : null);
}
