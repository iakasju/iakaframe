// T4 - `close` : revue de cloture CADENCEE -> RESERVOIR de propositions d'amendements TYPEES
// (instruction boucle-apprentissage-incrementale.md § 5.3, § 7, § 8, decision Q-2). `close`
// N'ECRIT JAMAIS dans le systeme : il REJOUE le(s) transcript(s) du canon et depose des
// PROPOSITIONS (type `memory` | `skill` | `hook` | `config`) dans `proposals/`, chacune avec
// quoi / ou / POURQUOI (preuves = extraits horodates du transcript) + un ARTEFACT PRET A APPLIQUER.
// RIEN ne s'applique tout seul (PROFIL/REGISTRE, skills, hooks, config restent inchanges) : c'est
// l'invariant central. Zero dependance runtime (Node core uniquement).
//
// DETERMINISME (testable SANS LLM) : l'analyse est faite par un ANALYSEUR PAR REGLES (heuristiques
// pures, sans reseau ni modele). Le point d'extension LLM (equivalent du `analyze()` de Hermes) est
// ISOLE derriere le contrat `analyze(entries, cfg) -> { corrections, procedures }` : on peut brancher
// un analyseur LLM plus tard SANS toucher au reste (meme esprit que le `provider` de T1). Au MVP,
// l'analyseur par regles lit le FORMAT NEUTRE DU CANON (voir « Signaux » ci-dessous) — aucun couplage
// a un format proprietaire de runner.
//
// Signaux du format neutre (greppables, emittables par n'importe quel binding OU a la main) :
//   @correction[(profil|registre)] <cle> :: <texte du redressement>   (defaut cible : registre)
//   @procedure <cle> :: <description de la procedure recurrente>
// Une CORRECTION repetee >= N fois (config.repeat_threshold, defaut 2, keyee par <cle> normalisee)
// -> proposition `memory`. Une PROCEDURE recurrente >= N fois -> proposition `skill`. En complement,
// un detecteur HEURISTIQUE de tournures de redressement (francais) alimente aussi le comptage des
// corrections (keyees par texte normalise). En dessous de N : AUCUNE proposition.
import fs from 'node:fs';
import path from 'node:path';
import { loadConfig } from './memory.js';

// --- Emplacements du canon (§ 4.2) ----------------------------------------------------------------
export function transcriptsDir(home) { return path.join(home, 'transcripts'); }
export function proposalsDir(home) { return path.join(home, 'proposals'); }

// --- Lecture des transcripts (substrat neutre : de simples fichiers Markdown/texte) ---------------
// Parcours recursif (inclut transcripts/odin/). Renvoie des entrees { file, rel, line, text } ou
// `file` est absolu, `rel` relatif au home (parite avec recall), `line` en base 1.
function walkFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkFiles(full));
    else if (ent.isFile()) out.push(full);
  }
  return out;
}

export function readEntries(home, files) {
  const entries = [];
  for (const file of files) {
    let content;
    try { content = fs.readFileSync(file, 'utf8'); } catch { continue; }
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      entries.push({ file, rel: path.relative(home, file), line: i + 1, text: lines[i] });
    }
  }
  return entries;
}

// Selectionne les transcripts a rejouer : un seul si `session` est fourni (chemin relatif a
// transcripts/ ou absolu), sinon tout l'arbre transcripts/.
export function selectTranscripts(home, session) {
  const dir = transcriptsDir(home);
  if (session) {
    const abs = path.isAbsolute(session) ? session : path.join(dir, session);
    return fs.existsSync(abs) && fs.statSync(abs).isFile() ? [abs] : [];
  }
  return walkFiles(dir);
}

// --- Normalisation (cle de regroupement des occurrences) ------------------------------------------
// Deux occurrences comptent comme « la meme » si leur cle normalisee est identique : minuscule,
// accents replies, ponctuation gommee, espaces compactes. C'est ce qui fait le seuil >= N.
export function normalizeKey(s) {
  return String(s)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // deplie les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Slug ASCII pour les noms de dossier de proposition (<horodatage>--<type>--<slug>).
export function slugify(s) {
  const base = normalizeKey(s).replace(/\s+/g, '-').replace(/^-+|-+$/g, '');
  return (base || 'entree').slice(0, 48);
}

// --- Detecteur heuristique de redressement (francais), pur et deterministe ------------------------
// Tournures typiques par lesquelles le decideur redresse l'agent. Conservateur (evite le bruit) :
// on ne compte que des lignes portant clairement une reprise. La cle = texte normalise de la ligne
// (deux redressements identiques se regroupent). Complementaire des signaux @correction explicites.
const CORRECTION_CUES = [
  /\bnon[,\s]/i, /\bpas comme (ca|cela)\b/i, /\bje t'?ai deja dit\b/i, /\bdeja dit\b/i,
  /\bje te (l'?ai )?ai deja (dit|demande)\b/i, /\bcorrige\b/i, /\bplut(o|ô)t\b/i,
  /\bencore une fois\b/i, /\btoujours pas\b/i, /\barr(e|ê)te de\b/i, /\bce n'?est pas (ce|ca|cela)\b/i,
];

export function looksLikeCorrection(text) {
  const t = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return CORRECTION_CUES.some((re) => re.test(t));
}

// --- Analyseur par regles (le MVP deterministe ; point d'extension LLM = meme signature) ----------
// Contrat : (entries, cfg) -> { corrections: Map<key,Occ>, procedures: Map<key,Occ> }
//   Occ = { key, target, label, evidence: [{ rel, line, text }] }
// `target` (corrections) ∈ 'profil' | 'registre'. `label` = 1er texte lisible rencontre.
const RE_CORRECTION = /@correction(?:\((profil|registre)\))?\s+(.+?)\s*::\s*(.+)$/i;
const RE_PROCEDURE = /@procedure\s+(.+?)\s*::\s*(.+)$/i;

export function rulesAnalyzer(entries) {
  const corrections = new Map();
  const procedures = new Map();

  const bump = (map, key, target, label, ev) => {
    let occ = map.get(key);
    if (!occ) { occ = { key, target, label, evidence: [] }; map.set(key, occ); }
    // Une cible `profil` (trait du decideur) prime sur `registre` si l'une des occurrences la porte.
    if (target === 'profil') occ.target = 'profil';
    occ.evidence.push(ev);
    return occ;
  };

  for (const e of entries) {
    const ev = { rel: e.rel, line: e.line, text: e.text.trim() };

    const mc = e.text.match(RE_CORRECTION);
    if (mc) {
      const target = (mc[1] || 'registre').toLowerCase();
      const key = normalizeKey(mc[2]);
      bump(corrections, `k:${key}`, target, mc[3].trim(), ev);
      continue;
    }
    const mp = e.text.match(RE_PROCEDURE);
    if (mp) {
      const key = normalizeKey(mp[1]);
      bump(procedures, `k:${key}`, 'registre', mp[2].trim(), ev);
      continue;
    }
    // Heuristique complementaire (redressement en prose) : keyee par la ligne normalisee.
    if (looksLikeCorrection(e.text)) {
      const key = normalizeKey(e.text);
      if (key) bump(corrections, `h:${key}`, 'registre', e.text.trim(), ev);
    }
  }
  return { corrections, procedures };
}

// --- Rendu des ARTEFACTS prets a appliquer --------------------------------------------------------
// memory : descripteur JSON applicable par l'outil `memory` (T5) + apercu Markdown.
function memoryArtifact(occ) {
  const content = occ.label;
  return {
    files: [
      ['memory.json', JSON.stringify({ op: 'add', target: occ.target, content }, null, 2) + '\n'],
      ['entry.md', `- ${content}\n`],
    ],
    applyHint: `memory add ${occ.target} "${content}"`,
  };
}

// skill : SKILL.md REDIGE (frontmatter id/name/description + corps), pret a `add` en bibliotheque.
function skillArtifact(occ, slug) {
  const id = `iakaframe-${slug}`;
  const steps = occ.evidence.map((ev) => `- (${ev.rel}:${ev.line}) ${ev.text}`).join('\n');
  const md = `---
id: ${id}
name: ${id}
description: Procédure récurrente détectée par la boucle d'apprentissage (close). ${occ.label}
---

# ${occ.label}

> Proposition de skill générée par \`close\` (T4). NON promue : reste hors de \`library/skills/\`
> tant que le geste humain d'\`add\` (gate de consentement, § 8) n'a pas eu lieu.

## Quand l'utiliser

Procédure vue ${occ.evidence.length} fois dans les transcripts (récurrence ≥ seuil).

## Étapes (extraites des sessions)

${steps}
`;
  return { files: [['SKILL.md', md]], applyHint: `add skill ${id}` };
}

// --- Ecriture d'une proposition dans le RESERVOIR (§ 4.2) ------------------------------------------
// Structure : proposals/<horodatage>--<type>--<slug>/{ proposal.md, artifact/... }.
// proposal.md porte quoi / ou / POURQUOI (preuves) + statut initial `en-attente`.
// EXPORTE (lot A « canon projet ») : le canon PROJET depose ses propositions dans le MEME reservoir
// (§ 4.2 — « le reservoir global accueille les propositions produit »). On EXPORTE la plomberie
// d'ecriture plutot que de la dupliquer ; l'ANALYSEUR, lui, n'est pas reutilise (cf. § 7.1 :
// `rulesAnalyzer` / `looksLikeCorrection` restent HORS du chemin d'execution du canon projet).
export function stamp(now) {
  const p = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}` +
    `T${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`;
}

function proposalName(ts, type, slug) { return `${ts}--${type}--${slug}`; }

// Vrai si une proposition EN-ATTENTE de meme type+slug existe deja (anti-doublon sur re-run).
// EXPORTE : c'est cette deduplication qui garantit qu'un rattrapage couvrant N sessions enchainees
// n'emet pas N propositions redondantes sur le meme corpus (§ 6.1).
export function pendingExists(home, type, slug) {
  const dir = proposalsDir(home);
  if (!fs.existsSync(dir)) return false;
  const suffix = `--${type}--${slug}`;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(suffix)) continue;
    const pm = path.join(dir, name, 'proposal.md');
    try {
      if (/^status:\s*en-attente\s*$/mi.test(fs.readFileSync(pm, 'utf8'))) return true;
    } catch { /* ignore */ }
  }
  return false;
}

function renderProposal(meta) {
  const why = meta.evidence.map((ev) => `- \`${ev.rel}:${ev.line}\` — « ${ev.text} »`).join('\n');
  return `---
type: ${meta.type}
target: ${meta.target}
slug: ${meta.slug}
status: en-attente
created: ${meta.created}
threshold: ${meta.threshold}
occurrences: ${meta.occurrences}
---

# Proposition (${meta.type}) — ${meta.label}

## Quoi
${meta.what}

## Où
${meta.where}

## Pourquoi (preuves tirées des sessions)
${why}

## Artefact prêt à appliquer
Voir \`artifact/\`. Application (geste humain gated, § 8) : \`${meta.applyHint}\`
`;
}

export function writeProposalDir(home, meta, artifact) {
  const dir = path.join(proposalsDir(home), proposalName(meta.ts, meta.type, meta.slug));
  fs.mkdirSync(path.join(dir, 'artifact'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'proposal.md'), renderProposal(meta), 'utf8');
  for (const [name, content] of artifact.files) {
    fs.writeFileSync(path.join(dir, 'artifact', name), content, 'utf8');
  }
  return dir;
}

// --- Geste `close` (§ 5.3) ------------------------------------------------------------------------
// Entree : `home` (canon deja resolu, T1), options { session, now, analyze }.
//   - session : limite le rejeu a un transcript (sinon tout transcripts/).
//   - now     : horloge injectable (Date) pour un horodatage deterministe en test.
//   - analyze : POINT D'EXTENSION (defaut = rulesAnalyzer). Toute fonction (entries) -> { corrections,
//               procedures } est acceptee (un analyseur LLM se branche ici sans rien changer d'autre).
// Sortie : { ok, home, proposalsDir, analyzed, emitted[], skipped[] }. Aucune ecriture hors
//   proposals/ : PROFIL/REGISTRE, skills, hooks et config restent INCHANGES (invariant central).
export function close(home, opts = {}) {
  const now = opts.now instanceof Date ? opts.now : new Date();
  const analyze = typeof opts.analyze === 'function' ? opts.analyze : rulesAnalyzer;
  const cfg = opts.config || loadConfig(home);
  const N = cfg.repeat_threshold;
  const ts = stamp(now);
  const createdIso = now.toISOString();

  const files = selectTranscripts(home, opts.session);
  const entries = readEntries(home, files);
  const { corrections, procedures } = analyze(entries, cfg);

  fs.mkdirSync(proposalsDir(home), { recursive: true });
  const emitted = [];
  const skipped = [];

  // Corrections repetees (>= N) -> propositions `memory`.
  for (const occ of corrections.values()) {
    if (occ.evidence.length < N) continue;
    const slug = slugify(occ.key.replace(/^[kh]:/, '') || occ.label);
    const type = 'memory';
    if (pendingExists(home, type, slug)) { skipped.push({ type, slug, reason: 'deja-en-attente' }); continue; }
    const artifact = memoryArtifact(occ);
    const meta = {
      type, target: occ.target, slug, ts, created: createdIso,
      threshold: N, occurrences: occ.evidence.length, label: occ.label,
      what: `Ajouter une entrée mémoire : « ${occ.label} » (correction redressée ${occ.evidence.length} fois).`,
      where: occ.target === 'profil' ? 'PROFIL.md (entrée `add`)' : 'REGISTRE.md (entrée `add`)',
      evidence: occ.evidence, applyHint: artifact.applyHint,
    };
    const dir = writeProposalDir(home, meta, artifact);
    emitted.push({ type, slug, target: occ.target, occurrences: occ.evidence.length, dir });
  }

  // Procedures recurrentes (>= N) -> propositions `skill`.
  for (const occ of procedures.values()) {
    if (occ.evidence.length < N) continue;
    const slug = slugify(occ.key.replace(/^[kh]:/, '') || occ.label);
    const type = 'skill';
    if (pendingExists(home, type, slug)) { skipped.push({ type, slug, reason: 'deja-en-attente' }); continue; }
    const artifact = skillArtifact(occ, slug);
    const meta = {
      type, target: 'library/skills', slug, ts, created: createdIso,
      threshold: N, occurrences: occ.evidence.length, label: occ.label,
      what: `Créer un nouveau skill : « ${occ.label} » (procédure vue ${occ.evidence.length} fois).`,
      where: 'library/skills/ (promotion humaine gated — jamais auto, § 7/§ 8)',
      evidence: occ.evidence, applyHint: artifact.applyHint,
    };
    const dir = writeProposalDir(home, meta, artifact);
    emitted.push({ type, slug, occurrences: occ.evidence.length, dir });
  }

  return {
    ok: true, home, proposalsDir: proposalsDir(home),
    analyzed: { files: files.length, corrections: corrections.size, procedures: procedures.size },
    emitted, skipped,
  };
}
