// Localisation et copie des kits iakaframe (kit / kit-codex / kit-ollama).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Racine des assets iakaframe (kit/, agents/, skills/, design-*).
// 1) paquet publie : <pkg>/_bundled (genere par scripts/bundle.js au prepack)
// 2) dev in-repo : 1er parent contenant un dossier 'kit'.
export function frameworkRoot() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const pkgRoot = path.resolve(here, '..', '..');          // cli/src/lib -> cli/
  const bundled = path.join(pkgRoot, '_bundled');
  if (fs.existsSync(path.join(bundled, 'kit'))) return bundled;
  let d = here;
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(d, 'kit'))) return d;
    const up = path.dirname(d);
    if (up === d) break;
    d = up;
  }
  return null;
}

export function kitName(target) {
  return target === 'codex' ? 'kit-codex' : target === 'ollama' ? 'kit-ollama' : 'kit';
}
export function contractFile(target) {
  return target === 'claude' ? 'CLAUDE.md' : 'AGENTS.md';
}

// Version iakaframe : etat-des-lieux (dev) > _bundled/VERSION (publie) > package.json.
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
