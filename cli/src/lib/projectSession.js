// Lot A - MARQUEUR DE SESSION NON CLOSE + RATTRAPAGE + cloture du canon PROJET
// (instruction specs/instructions/canon-projet-connaissance-produit.md § 3.4, § 6.1, arbitrage AR-2).
//
// « CAPTURER A LA REPRISE » N'EST PAS « RATTRAPER UNE CLOTURE MANQUEE ». Ce n'est pas une
// contradiction, et la distinction commande toute la conception de ce fichier :
//   - CAPTURER A LA REPRISE = analyser la session QUI COMMENCE. C'est absurde (elle n'a rien
//     produit) et cadence.js:3-4 a RAISON de le refuser. On ne touche pas a cette regle :
//     `cadence.close_on` reste ['pause','version'] et N'ACCUEILLE JAMAIS `reprise`.
//   - RATTRAPER UNE CLOTURE MANQUEE = executer, au moment de la reprise, la cloture de la session
//     PRECEDENTE, restee ouverte. L'objet analyse n'est pas la session qui s'ouvre : c'est une
//     session PASSEE, close en retard.
// Deux gestes differents sur deux objets differents. Le rattrapage est donc un geste DISTINCT qui
// NE FAIT STRICTEMENT RIEN s'il n'y a pas de marqueur pendant : un `reprise` sans dette de cloture
// reste EXACTEMENT ce qu'il est aujourd'hui (verrouille par test).
//
// OU VIT LE MARQUEUR (AR-2 : LOCAL, NON VERSIONNE) : sous le canon global (~/.iaka/memory/sessions/),
// jamais dans le depot. Un fichier d'etat VERSIONNE, mute a chaque session, produirait du conflit de
// merge et du bruit de diff A PERPETUITE — pour une information qui ne concerne que la machine
// courante. Le contre (une dette de cloture ne suit pas un `git clone`) est BENIN : une dette de
// cloture EST un fait local a une machine et a une session.
//
// GARANTIE NON-BLOQUANTE (cadence.js:8, « la cadence ne doit JAMAIS casser le rituel ») : aucune
// fonction de ce module ne leve. Marqueur illisible/corrompu -> traite comme ABSENT.
// Zero dependance runtime (Node core uniquement).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { selectTranscripts, readEntries, normalizeKey, slugify, writeProposalDir, pendingExists, stamp, proposalsDir } from './close.js';
import { projectCanonHome, projectCanonExists } from './projectCanon.js';

// --- Emplacement du marqueur ----------------------------------------------------------------------
export function sessionsDir(memoryHome) { return path.join(memoryHome, 'sessions'); }

// CLE DE PROJET : chemin absolu NORMALISE et HACHE — jamais le nom nu. Deux `iakaHub` sur deux
// chemins existent (cf. /Users/sjupin/work/IakaProject/projects/iakaHub/) : keyer sur le basename
// les confondrait. Le basename est conserve en PREFIXE LISIBLE (confort d'inspection), le hash
// porte l'identite. Casse repliee sur les systemes insensibles (darwin/win32).
export function sessionKey(projectPath) {
  const abs = path.resolve(projectPath);
  const canonical = (process.platform === 'win32' || process.platform === 'darwin') ? abs.toLowerCase() : abs;
  const hash = crypto.createHash('sha1').update(canonical).digest('hex').slice(0, 12);
  const base = slugify(path.basename(abs)) || 'projet';
  return `${base}-${hash}`;
}

export function sessionPath(memoryHome, projectPath) {
  return path.join(sessionsDir(memoryHome), `${sessionKey(projectPath)}.json`);
}

// --- Lecture / ecriture du marqueur ----------------------------------------------------------------
// Contenu (§ 6.1) : { projectPath, openedAt, lastCloseAt, lastCloseReason, pending }.
// Marqueur absent, illisible ou corrompu -> `null`, TRAITE COMME ABSENT (§ 6.3-13). Jamais de crash.
export function readMarker(memoryHome, projectPath) {
  const p = sessionPath(memoryHome, projectPath);
  try {
    const raw = fs.readFileSync(p, 'utf8');
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    return data;
  } catch { return null; }
}

// Ecriture best-effort : un marqueur qu'on ne peut pas ecrire (disque plein, droits) ne doit JAMAIS
// casser le rituel. On rend false, l'appelant journalise.
function writeMarker(memoryHome, projectPath, data) {
  try {
    fs.mkdirSync(sessionsDir(memoryHome), { recursive: true });
    fs.writeFileSync(sessionPath(memoryHome, projectPath), JSON.stringify(data, null, 2) + '\n', 'utf8');
    return true;
  } catch { return false; }
}

// Vrai s'il existe une DETTE de cloture sur ce projet.
export function hasPendingSession(memoryHome, projectPath) {
  const m = readMarker(memoryHome, projectPath);
  return !!(m && m.pending === true);
}

// ARMEMENT du marqueur : une session de travail s'ouvre sur ce projet.
//
// LE MARQUEUR NE S'EMPILE PAS (§ 6.1) : `openedAt` est ECRASE, `pending` reste `true`. Motif : le
// close REJOUE les transcripts (close.js:265-267), qui sont CUMULATIFS — un rattrapage couvre donc
// TOUTE la periode non close en une passe, quel que soit le nombre de sessions enchainees. Empiler
// N marqueurs produirait N rattrapages redondants sur le MEME corpus, et `pendingExists` les
// dedupliquerait de toute facon. UN SEUL MARQUEUR, UNE SEULE DETTE.
export function openProjectSession(memoryHome, projectPath, opts = {}) {
  const now = opts.now instanceof Date ? opts.now : new Date();
  const prev = readMarker(memoryHome, projectPath) || {};
  const data = {
    projectPath: path.resolve(projectPath),
    openedAt: now.toISOString(),          // ECRASE : le marqueur ne s'empile pas
    lastCloseAt: prev.lastCloseAt || null,
    lastCloseReason: prev.lastCloseReason || null,
    pending: true,
  };
  const written = writeMarker(memoryHome, projectPath, data);
  return { ok: written, marker: data, path: sessionPath(memoryHome, projectPath) };
}

// DESARMEMENT : la cloture a eu lieu (rituel normal OU rattrapage). `pending` -> false.
export function closeProjectSession(memoryHome, projectPath, reason, opts = {}) {
  const now = opts.now instanceof Date ? opts.now : new Date();
  const prev = readMarker(memoryHome, projectPath) || {};
  const data = {
    projectPath: path.resolve(projectPath),
    openedAt: prev.openedAt || null,
    lastCloseAt: now.toISOString(),
    lastCloseReason: reason || null,
    pending: false,
  };
  const written = writeMarker(memoryHome, projectPath, data);
  return { ok: written, marker: data, path: sessionPath(memoryHome, projectPath) };
}

// --- Analyseur du canon PROJET : DETERMINISTE, ZERO HEURISTIQUE DE LANGAGE ------------------------
//
// POURQUOI ON NE REUTILISE PAS `rulesAnalyzer` / `looksLikeCorrection` (§ 4.2, § 7.1) — et c'est le
// point le plus important de ce fichier. Un defaut CONSTATE SUR DONNEES REELLES le 17/07 :
// `CORRECTION_CUES` contient /\bnon[,\s]/i, qui matche « non code », « non planifie », « non
// bloquant »… -> 2 propositions parasites. Une detection produit batie sur des heuristiques de
// langage produirait le meme bruit EN PIRE. Et UN GATE BRUYANT FINIT DESACTIVE — c'est-a-dire que le
// mecanisme entier meurt. Le risque n'est pas « quelques faux positifs » : c'est LA PERTE DU LOT.
// D'ou : SIGNAUX EXPLICITES UNIQUEMENT, greppables, emis deliberement. Rien n'est infere du francais.
//
//   @produit <cle> :: <constat sur le produit>              -> proposition d'AJOUT
//   @produit-revise <ancien contenu> :: <nouveau contenu>   -> proposition de REVISION EN PLACE
//
// SEUIL N = 1, ET C'EST DELIBERE (divergence assumee d'avec le canon global, ou N=2). Le seuil N
// existe pour filtrer le bruit d'une detection INFEREE ; ici le signal est EXPLICITE et deliberement
// pose par un humain ou un agent. Exiger deux occurrences d'un marqueur volontaire ne filtrerait
// aucun bruit — il n'y en a pas — et perdrait des constats legitimes.
const RE_PRODUIT_REVISE = /@produit-revise\s+(.+?)\s*::\s*(.+)$/i;
const RE_PRODUIT = /@produit\s+(.+?)\s*::\s*(.+)$/i;

export function projectAnalyzer(entries) {
  const adds = new Map();
  const revisions = new Map();

  const bump = (map, key, payload, ev) => {
    let occ = map.get(key);
    if (!occ) { occ = { key, ...payload, evidence: [] }; map.set(key, occ); }
    occ.evidence.push(ev);
    return occ;
  };

  for (const e of entries) {
    const ev = { rel: e.rel, line: e.line, text: e.text.trim() };

    // La REVISION est testee EN PREMIER : `@produit-revise` contient `@produit` en prefixe, l'ordre
    // inverse capterait toute revision comme un simple ajout et perdrait la promesse du lot.
    const mr = e.text.match(RE_PRODUIT_REVISE);
    if (mr) {
      const oldContent = mr[1].trim();
      bump(revisions, `r:${normalizeKey(oldContent)}`, { oldContent, label: mr[2].trim() }, ev);
      continue;
    }
    const ma = e.text.match(RE_PRODUIT);
    if (ma) {
      bump(adds, `a:${normalizeKey(ma[1])}`, { label: ma[2].trim() }, ev);
    }
  }
  return { adds, revisions };
}

// --- Cloture du canon PROJET : depose des PROPOSITIONS, N'ECRIT JAMAIS DANS LE CANON --------------
//
// GARDE DE CONSENTEMENT PLUS STRICTE QUE CELLE DU CANON GLOBAL (AR-4) : ce canon est VERSIONNE ET
// POUSSE sur Forgejo. Une entree auto-ecrite ne serait pas seulement fausse, ELLE SERAIT PUBLIEE.
// Une entree erronee n'y est pas une ligne a corriger, c'est une LIGNE D'HISTORIQUE PUBLIC. Donc :
// JAMAIS D'AUTO-ECRITURE, sans exception — tout passe par la file de revue (review.js `classify`
// rend auto:false pour la cible `produit`, verrouille par test). C'est ce qui rend l'exposition du
// § 4.1 tenable : RIEN N'ATTEINT LE DEPOT SANS QUE LE DECIDEUR L'AIT LU.
//
// Les propositions vont dans le reservoir GLOBAL (§ 4.2) : on ne fabrique pas un second reservoir.
// `projectPath` est porte PAR L'ARTEFACT — c'est lui qui permet a review.js de router l'ecriture
// vers le bon depot au moment de l'application.
export function closeProjectCanon(memoryHome, projectPath, opts = {}) {
  const now = opts.now instanceof Date ? opts.now : new Date();
  const ts = stamp(now);
  const createdIso = now.toISOString();
  const analyze = typeof opts.analyze === 'function' ? opts.analyze : projectAnalyzer;
  const home = projectCanonHome(projectPath);

  const files = selectTranscripts(memoryHome, opts.session);
  const entries = readEntries(memoryHome, files);
  const { adds, revisions } = analyze(entries);

  fs.mkdirSync(proposalsDir(memoryHome), { recursive: true });
  const emitted = [];
  const skipped = [];

  const emit = (occ, op) => {
    const slug = slugify(occ.key.replace(/^[ar]:/, '') || occ.label);
    const type = 'memory';
    if (pendingExists(memoryHome, type, slug)) {
      skipped.push({ type, slug, reason: 'deja-en-attente' });
      return;
    }
    const spec = { op, target: 'produit', content: occ.label, projectPath: path.resolve(projectPath) };
    if (op === 'replace') spec.old = occ.oldContent;
    const artifact = {
      files: [
        ['memory.json', JSON.stringify(spec, null, 2) + '\n'],
        ['entry.md', `- ${occ.label}\n`],
      ],
      applyHint: op === 'replace'
        ? `produit replace "${occ.oldContent}" "${occ.label}" --project ${path.resolve(projectPath)}`
        : `produit add "${occ.label}" --project ${path.resolve(projectPath)}`,
    };
    const meta = {
      type, target: 'produit', slug, ts, created: createdIso,
      threshold: 1, occurrences: occ.evidence.length, label: occ.label,
      what: op === 'replace'
        ? `RÉVISER EN PLACE l'entrée « ${occ.oldContent} » -> « ${occ.label} ».`
        : `Ajouter au canon produit : « ${occ.label} ».`,
      where: `${produitRel(home)} (canon PROJET, versionné — revue humaine obligatoire)`,
      evidence: occ.evidence, applyHint: artifact.applyHint,
    };
    const dir = writeProposalDir(memoryHome, meta, artifact);
    emitted.push({ type, slug, target: 'produit', op, occurrences: occ.evidence.length, dir });
  };

  // Les REVISIONS d'abord : ce sont elles qui portent la promesse « incrementale modifiee ».
  for (const occ of revisions.values()) emit(occ, 'replace');
  for (const occ of adds.values()) emit(occ, 'add');

  return {
    ok: true, memoryHome, projectPath: path.resolve(projectPath), canonHome: home,
    proposalsDir: proposalsDir(memoryHome),
    analyzed: { files: files.length, adds: adds.size, revisions: revisions.size },
    emitted, skipped,
  };
}

function produitRel(home) { return path.join(home, 'PRODUIT.md'); }

// Re-export de commodite pour la cadence (lisibilite du point d'appel).
export { projectCanonExists };
