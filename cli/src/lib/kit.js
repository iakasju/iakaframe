// Localisation et copie des kits iakaframe (kit / kit-codex / kit-ollama).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Racine du framework = 1er parent contenant un dossier 'kit' (depuis ce module).
export function frameworkRoot() {
  let d = path.dirname(fileURLToPath(import.meta.url));
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

// Version iakaframe lue dans specs/etat-des-lieux.md (ligne | Version | ... |).
export function frameworkVersion(root) {
  try {
    const md = fs.readFileSync(path.join(root, 'specs', 'etat-des-lieux.md'), 'utf8');
    const m = md.match(/^\|\s*Version\s*\|\s*(.+?)\s*\|/m);
    if (m) return m[1].trim();
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
