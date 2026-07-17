// Socle « retrait sûr » (instruction symetrie-ajout-suppression.md, S1). Trois briques mutualisees
// par tous les gestes `-` (remove, detach, de-materialisation) :
//   1) findReferrers(type, id, root) : l'INVERSE de checkRefs (I1) — « qui pointe vers moi ? » ;
//      base du garde RESTRICT (Q-2 : refus par defaut si l'element est encore reference).
//   2) corbeille horodatee <root>/.trash-<horodatage>/ restaurable (Q-6, patron `.bak-*` de switch) :
//      tout retrait de fichier/dossier DEPLACE vers la corbeille (jamais de suppression seche) + trace.
//   3) mutation chirurgicale du SEUL `skills:[]` d'un persona (Q-1 = Option 1 : le frontmatter reste
//      la source unique de verite ; on ne touche a AUCUN autre champ du fichier).
// Zero dependance runtime.
import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter, needsListQuote, _internal } from './frontmatter.js';
import { scan, readEntry, pathFor, toArray } from './library.js';

const { balance } = _internal;

// --- 1) Integrite referentielle INVERSE (RESTRICT) ------------------------------------------
// Table des « qui reference quoi », miroir de checkRefs. Pour une collection cible donnee, liste
// les collections referentes et le champ (mono ou multi-valeur) par lequel elles pointent.
const REFERRERS = {
  skills:   [{ from: 'personas', field: 'skills',    many: true }],
  personas: [{ from: 'teams',    field: 'personas',  many: true },
             { from: 'teams',    field: 'coordinator' }],
  teams:    [{ from: 'bindings', field: 'teamId' },
             { from: 'kits',     field: 'teamId' }],
  methods:  [{ from: 'bindings', field: 'methodId' },
             { from: 'kits',     field: 'methodId' }],
  bindings: [{ from: 'kits',     field: 'bindingId' }],
};

// findReferrers(type, id, root) -> [{ type, id, field }] : toutes les entrees qui referencent
// encore (type, id). Vide = orphelin, retrait sur. Non vide = RESTRICT par defaut (Q-2).
export function findReferrers(type, id, root) {
  const specs = REFERRERS[type] || [];
  const out = [];
  for (const spec of specs) {
    for (const e of scan(spec.from, root)) {
      const entry = readEntry(spec.from, e.id, root);
      if (!entry) continue;
      const val = entry.data[spec.field];
      const arr = spec.many ? toArray(val) : (val == null || val === '' ? [] : [val]);
      if (arr.includes(id)) out.push({ type: spec.from, id: e.id, field: spec.field });
    }
  }
  return out;
}

// --- 2) Corbeille horodatee restaurable (Q-6) -----------------------------------------------
// Horodatage compatible nom de dossier (calque de switch.js timestamp()).
export function trashStamp(d = new Date()) {
  return d.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
}

// Cree (idempotent) et retourne le dossier corbeille <root>/.trash-<ts>/.
export function makeTrash(root, ts = trashStamp()) {
  const dir = path.join(root, `.trash-${ts}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Deplace un fichier/dossier vers la corbeille en PRESERVANT son chemin relatif a la racine
// (=> restaurable a l'identique). Renommage sur le meme volume ; repli copie+suppression (EXDEV).
export function moveToTrash(root, absPath, trashDir) {
  const rel = path.relative(root, absPath);
  const dest = path.join(trashDir, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  try {
    fs.renameSync(absPath, dest);
  } catch (e) {
    if (e && e.code === 'EXDEV') { copyRecursive(absPath, dest); fs.rmSync(absPath, { recursive: true, force: true }); }
    else throw e;
  }
  return { from: absPath, rel, to: dest };
}

// Ecrit/complete la trace de corbeille (manifest.json) : quoi, d'ou, quand, restaurable ?.
export function writeTrashManifest(trashDir, entry) {
  const file = path.join(trashDir, 'manifest.json');
  let manifest = { removedAt: new Date().toISOString(), items: [] };
  if (fs.existsSync(file)) {
    try { manifest = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* trace illisible : on repart propre */ }
  }
  manifest.items.push(entry);
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + '\n');
  return file;
}

// Restaure un item depuis la corbeille vers la racine (retrait = reversible). Support de la
// restauration (le CLI de purge/restore est un geste humain ulterieur, hors de ce lot).
export function restoreFromTrash(root, trashDir, rel) {
  const src = path.join(trashDir, rel);
  const dest = path.join(root, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.renameSync(src, dest);
  return dest;
}

function copyRecursive(src, dst) {
  const st = fs.statSync(src);
  if (st.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const e of fs.readdirSync(src)) copyRecursive(path.join(src, e), path.join(dst, e));
  } else {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
}

// --- 3) Mutation chirurgicale du SEUL `skills:[]` d'un persona (Q-1 = Option 1) --------------
// Reecrit UNIQUEMENT la ligne `skills:` du frontmatter, en preservant a l'octet pres tout le reste
// du fichier (autres champs, quoting, corps). NE cree PAS de section de corps (le `-` au titre du
// skill est une affordance de VUE, hors CLI). Retourne le nouveau texte.
export function rewriteSkillsLine(text, newSkills) {
  const lines = String(text).replace(/^﻿/, '').split('\n');
  if (lines[0].replace(/\r$/, '') !== '---') throw new Error('frontmatter absent (--- attendu en tete)');
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    const t = lines[i].replace(/\r$/, '');
    if (t === '---' || t === '...') { end = i; break; }
  }
  if (end < 0) throw new Error('frontmatter non clos');

  const rendered = `skills: [${newSkills.map((s) => (needsListQuote(s) ? `"${s}"` : String(s))).join(', ')}]`;

  let idx = -1;
  for (let i = 1; i < end; i++) {
    if (/^skills\s*:/.test(lines[i].replace(/\r$/, ''))) { idx = i; break; }
  }
  if (idx < 0) { lines.splice(end, 0, rendered); return lines.join('\n'); }

  // Consomme une eventuelle liste flow multi-ligne (crochets non equilibres sur la 1re ligne).
  let j = idx;
  let acc = lines[idx].replace(/\r$/, '').replace(/^skills\s*:\s*/, '');
  while (balance(acc) > 0 && j + 1 < end) { j++; acc += ' ' + lines[j].replace(/\r$/, ''); }
  lines.splice(idx, j - idx + 1, rendered);
  return lines.join('\n');
}

// Applique une nouvelle liste de skills a un fichier persona (lecture + reecriture chirurgicale).
export function setPersonaSkills(personaFile, newSkills) {
  const text = fs.readFileSync(personaFile, 'utf8');
  fs.writeFileSync(personaFile, rewriteSkillsLine(text, newSkills));
}

// Lit la liste `skills:[]` courante d'un persona (source unique de verite).
export function readPersonaSkills(personaFile) {
  const { data } = parseFrontmatter(fs.readFileSync(personaFile, 'utf8'));
  return toArray(data.skills).map(String);
}
