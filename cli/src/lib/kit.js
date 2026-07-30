// Localisation et copie des kits iakaframe (kit-claude / kit-codex / kit-ollama).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  normalizeNode,
  kitNameForNode as _kitNameForNode,
  contractFileForNode as _contractFileForNode,
} from './vocab.js';

// Racine des assets iakaframe (bibliotheque library/ + methods/ + kits/, ou anciens kit-*).
// 1) paquet publie : <pkg>/_bundled (genere par scripts/bundle.js au prepack)
// 2) dev in-repo : 1er parent portant un marqueur valide.
//
// Q-1 : le rangement « pool + assemblages » a deplace `kit-*` -> `kits/`, ce qui CASSAIT le
// marqueur historique `kit-claude`. On bascule sur un marqueur robuste au rangement : double
// marqueur `library/` + `methods/` a la racine du depot, ou `kits/` (les deux issus du
// rangement). Le legacy `kit-claude` reste accepte pour les depots non encore ranges.
function hasFrameworkMarker(d) {
  if (fs.existsSync(path.join(d, 'library')) && fs.existsSync(path.join(d, 'methods'))) return true;
  if (fs.existsSync(path.join(d, 'kits'))) return true;
  return fs.existsSync(path.join(d, 'kit-claude'));
}

export function frameworkRoot() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const pkgRoot = path.resolve(here, '..', '..');          // cli/src/lib -> cli/
  const bundled = path.join(pkgRoot, '_bundled');
  if (fs.existsSync(bundled) && hasFrameworkMarker(bundled)) return bundled;
  let d = here;
  for (let i = 0; i < 8; i++) {
    if (hasFrameworkMarker(d)) return d;
    const up = path.dirname(d);
    if (up === d) break;
    d = up;
  }
  return null;
}

// Nom du dossier de kit / fichier-contrat pour un NŒUD canonique (NodeKind). Le FORMAT
// (claude-md/agents-md) porte le fichier-contrat, distinct du nœud (cf. vocab.js).
export function kitNameForNode(node) { return _kitNameForNode(node); }
export function contractFileForNode(node) { return _contractFileForNode(node); }

// Basename DISQUE du dossier de kit deployable, derive du nom canonique par echange de
// prefixe `kit-` -> `iakaframe-` (kit-claude -> iakaframe-claude). Le nom canonique est un
// jeton d'IDENTITE (cf. vocab.js, verrouille par parite core) ; le basename disque est un
// concept distinct porte ici, dans la couche de resolution de chemin.
function kitBasenameForNode(node) {
  const canonical = _kitNameForNode(node);              // ex. 'kit-claude'
  return canonical.replace(/^kit-/, 'iakaframe-');       // ex. 'iakaframe-claude'
}

// Resout le CHEMIN ABSOLU du dossier de kit deployable pour un nœud, sous une racine `root`.
// Reproduit la convention de install.mjs (kits/iakaframe-<famille>) avec fallback legacy vers
// l'ancien rangement <root>/kit-<famille> (depots non ranges / anciens bundles). Si aucun des
// deux candidats n'existe, retourne le candidat PRIMAIRE (kits/iakaframe-<famille>) pour que le
// message d'erreur d'init pointe le chemin ATTENDU.
export function kitDirForNode(root, node) {
  const basename = kitBasenameForNode(node);
  const primary = path.join(root, 'kits', basename);     // rangement courant (aligne install.mjs)
  const legacy = path.join(root, _kitNameForNode(node));  // fallback legacy <root>/kit-<famille>
  for (const cand of [primary, legacy]) {
    if (fs.existsSync(cand)) return cand;
  }
  return primary;
}

// --- Alias DEPRECIES (retro-compat, conserves >= 1 version mineure - P2 Q-3) ---
// Ancienne signature basee sur "target" (claude|codex|ollama) : normalise le target legacy
// en nœud canonique (ollama -> ollama-localhost) puis delegue. Les appelants valident deja
// la valeur en amont ; le repli 'claude' ne sert que de garde defensive.
export function kitName(target) {
  return kitNameForNode(normalizeNode(target).node || 'claude');
}
export function contractFile(target) {
  return contractFileForNode(normalizeNode(target).node || 'claude');
}

// Version iakaframe : etat-des-lieux (dev) > <root>/VERSION > package.json.
export function frameworkVersion(root) {
  try {
    const md = fs.readFileSync(path.join(root, 'specs', 'etat-des-lieux.md'), 'utf8');
    const m = md.match(/^\|\s*Version\s*\|\s*(.+?)\s*\|/m);
    if (m) return m[1].trim();
  } catch { /* ignore */ }
  try { return fs.readFileSync(path.join(root, 'VERSION'), 'utf8').trim() || 'inconnue'; } catch { /* ignore */ }
  try {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'package.json'), 'utf8'));
    if (pkg.version) return 'v' + pkg.version;
  } catch { /* ignore */ }
  return 'inconnue';
}

// Copie recursive du kit, en ignorant le README.md racine (doc du kit, pas du projet).
export function copyKit(kitDir, dest, { force = false } = {}) {
  let copied = 0, skipped = 0;
  const walk = (srcDir, rel) => {
    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
      const relPath = rel ? path.join(rel, entry.name) : entry.name;
      const src = path.join(srcDir, entry.name);
      if (entry.isDirectory()) { walk(src, relPath); continue; }
      if (relPath.toLowerCase() === 'readme.md') continue;
      const out = path.join(dest, relPath);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      if (fs.existsSync(out) && !force) { skipped++; continue; }
      fs.copyFileSync(src, out);
      copied++;
    }
  };
  walk(kitDir, '');
  return { copied, skipped };
}
