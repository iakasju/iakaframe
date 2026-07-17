// Lecture defensive de l'etat des lieux (specs/etat-des-lieux.md) et du backlog (CLAUDE.md).
// Toute source absente / non conforme -> valeur de repli, jamais d'exception.
import fs from 'node:fs';
import path from 'node:path';

function readSafe(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } }

// Parse la table "## Etat courant" (| Champ | Valeur |) -> { champ: valeur }.
export function readEtat(projectDir) {
  const md = readSafe(path.join(projectDir, 'specs', 'etat-des-lieux.md'));
  if (!md) return null;
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex(l => /^##\s+Etat courant/i.test(l));
  if (start < 0) return null;
  const fields = {};
  for (let i = start + 1; i < lines.length && !/^##\s/.test(lines[i]); i++) {
    const m = lines[i].match(/^\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*$/);
    if (m && !/^-+$/.test(m[1]) && m[1].toLowerCase() !== 'champ') fields[m[1]] = m[2];
  }
  return Object.keys(fields).length ? fields : null;
}

// Resume court de la derniere etape (Note de reprise, sinon dernier commit).
export function lastStep(projectDir) {
  const e = readEtat(projectDir);
  if (!e) return '(etat des lieux introuvable)';
  return e['Note'] || e['Dernier commit'] || '(etat courant sans note)';
}

// Items de backlog depuis CLAUDE.md (section contenant "backlog").
export function backlog(projectDir) {
  const md = readSafe(path.join(projectDir, 'CLAUDE.md'));
  if (!md) return ['(CLAUDE.md introuvable)'];
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex(l => /^#{1,6}.*backlog/i.test(l));
  if (start < 0) return ['(section backlog introuvable)'];
  const items = [];
  for (let i = start + 1; i < lines.length && !/^#{1,6}\s/.test(lines[i]); i++) {
    const m = lines[i].match(/^\s*[-*]\s+(.+)$/);
    if (m) items.push(m[1].trim());
  }
  return items.length ? items : ['(backlog vide)'];
}
