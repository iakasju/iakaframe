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

// Frame ACTIVE d'un projet (D-E) : cle `frame=` du marqueur <projet>/.iakaframe. Absente ->
// HARDWIRED_DEFAULT_FRAME (repli, zero regression). Hors projet (dir sans .iakaframe) -> default.
export function activeFrameId(projectDir) {
  if (!projectDir) return HARDWIRED_DEFAULT_FRAME;
  const kv = parseKeyValueFile(path.join(path.resolve(projectDir), '.iakaframe'));
  const id = (kv.frame || '').trim();
  return id || HARDWIRED_DEFAULT_FRAME;
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
