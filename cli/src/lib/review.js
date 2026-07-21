// T5 - « Garde de consentement » : REVUE du RESERVOIR de propositions produit par `close` (T4).
// Instruction boucle-apprentissage-incrementale.md § 8 (garde de consentement) + Q-4 (politique de
// consentement par defaut). On lit les propositions deposees dans proposals/ (§ 4.2), on les LISTE,
// on les MONTRE, et on les APPLIQUE ou REJETTE. « Appliquer » = materialiser l'artefact selon son
// type via les couches existantes (memory de T1 pour PROFIL/REGISTRE ; bibliotheque pour skill) —
// jamais de reimplementation du plafond. Zero dependance runtime (Node core uniquement).
//
// POLITIQUE DE CONSENTEMENT PAR DEFAUT (Q-4, gravee) :
//   - memory / target `profil`  -> EN FILE : exige une approbation explicite (geste humain) ;
//   - memory / target `registre`-> AUTO-APPLICABLE si write_approval == 'auto' (sinon en file) ;
//   - amendements STRUCTURELS (`skill` | `hook` | `config`) -> TOUJOURS EN FILE, JAMAIS auto,
//     QUELLE QUE SOIT la valeur de write_approval. Le commutateur `write_approval: queue` peut mettre
//     AUSSI le REGISTRE en file, mais ne peut JAMAIS rendre un structurel automatique (garde-fou dur).
//
// Distinction cle : `applyProposal` = GESTE HUMAIN EXPLICITE (la revue elle-meme) -> materialise
// n'importe quel type (c'est l'exercice du gate). `autoApply` = passe AUTOMATIQUE (branchable sur la
// cadence, T6) -> ne materialise QUE le auto-applicable selon la politique ci-dessus. Le garde-fou
// structurel-jamais-auto vit dans `classify()` et est verrouille par les tests.
import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter } from './frontmatter.js';
import { loadConfig, memoryAdd, memoryReplace, memoryRemove } from './memory.js';
import { proposalsDir } from './close.js';
import { libraryRoot } from './library.js';
import { projectCanonHome, produitAdd, produitReplace, produitRemove } from './projectCanon.js';

// Types d'amendements STRUCTURELS : gate humain par nature (jamais auto, § 8 / Q-4).
export const STRUCTURAL_TYPES = new Set(['skill', 'hook', 'config']);

// Statuts d'une proposition dans le reservoir (miroir du frontmatter de proposal.md, T4).
export const STATUS = { PENDING: 'en-attente', APPLIED: 'applique', REJECTED: 'rejete' };

// --- Lecture du reservoir -------------------------------------------------------------------------
// Une proposition = un dossier proposals/<horodatage>--<type>--<slug>/ portant proposal.md (§ 4.2).
export function proposalPath(dir) { return path.join(dir, 'proposal.md'); }

function readProposalDir(baseDir, name) {
  const dir = path.join(baseDir, name);
  const pm = proposalPath(dir);
  if (!fs.existsSync(pm)) return null;
  let data;
  try { ({ data } = parseFrontmatter(fs.readFileSync(pm, 'utf8'))); }
  catch { return null; }
  return {
    id: name,
    dir,
    type: data.type,
    target: data.target,
    slug: data.slug,
    status: data.status || STATUS.PENDING,
    created: data.created,
    occurrences: data.occurrences,
  };
}

// Liste toutes les propositions du reservoir (triees par id = horodatage croissant). `status`
// (optionnel) filtre sur un statut precis.
export function listProposals(home, { status } = {}) {
  const base = proposalsDir(home);
  if (!fs.existsSync(base)) return [];
  const out = [];
  for (const name of fs.readdirSync(base).sort()) {
    if (!fs.statSync(path.join(base, name)).isDirectory()) continue;
    const p = readProposalDir(base, name);
    if (!p) continue;
    if (status && p.status !== status) continue;
    out.push(p);
  }
  return out;
}

// Resout une proposition par id EXACT ou par PREFIXE non ambigu (confort CLI : l'horodatage suffit
// souvent). Retourne { ok, proposal } | { ok:false, reason }.
export function resolveProposal(home, idOrPrefix) {
  if (!idOrPrefix) return { ok: false, reason: 'id-manquant' };
  const all = listProposals(home);
  const exact = all.find((p) => p.id === idOrPrefix);
  if (exact) return { ok: true, proposal: exact };
  const matches = all.filter((p) => p.id.startsWith(idOrPrefix));
  if (matches.length === 1) return { ok: true, proposal: matches[0] };
  if (matches.length === 0) return { ok: false, reason: 'introuvable', id: idOrPrefix };
  return { ok: false, reason: 'ambigu', id: idOrPrefix, matches: matches.map((p) => p.id) };
}

// Lit le corps rendu (proposal.md complet) d'une proposition, pour `show`.
export function readProposalText(proposal) {
  return fs.readFileSync(proposalPath(proposal.dir), 'utf8');
}

// --- Politique de consentement (Q-4) --------------------------------------------------------------
// classify(type, target, cfg) -> { auto: boolean, reason }. C'est LE garde-fou : les structurels
// renvoient TOUJOURS auto:false, quel que soit write_approval. Fonction pure, testee directement.
export function classify(type, target, cfg) {
  if (STRUCTURAL_TYPES.has(type)) {
    // Garantie dure : aucun reglage ne rend un structurel automatique (§ 8, Q-4).
    return { auto: false, reason: 'structurel-toujours-gate' };
  }
  if (type === 'memory') {
    if (target === 'profil') return { auto: false, reason: 'profil-en-file' };
    // CANON PROJET (AR-4) : garde PLUS STRICTE que celle du canon global, et la difference est
    // MATERIELLE, pas doctrinale. Le canon global est un fichier LOCAL dans ~/.iaka/ ; le canon
    // projet est VERSIONNE ET POUSSE sur Forgejo. Une entree erronee n'y est pas une ligne a
    // corriger, c'est une LIGNE D'HISTORIQUE PUBLIC. Donc TOUJOURS EN FILE, SANS EXCEPTION —
    // `write_approval: auto` ne peut PAS la rendre automatique (verrouille par test, au meme titre
    // que le garde-fou structurel). C'est ce qui rend l'exposition du depot tenable.
    if (target === 'produit') return { auto: false, reason: 'produit-toujours-en-file' };
    if (target === 'registre') {
      return cfg.write_approval === 'auto'
        ? { auto: true, reason: 'registre-auto' }
        : { auto: false, reason: 'write_approval-queue' };
    }
    return { auto: false, reason: 'cible-inconnue-en-file' };
  }
  // Type non reconnu : conservateur (en file).
  return { auto: false, reason: 'type-inconnu-en-file' };
}

// --- Materialisation d'un artefact selon son type -------------------------------------------------
// Renvoie un rapport { ok, ... }. Ne change PAS le statut (c'est l'appelant qui le fait si ok).

// memory : rejoue l'`op` de artifact/memory.json (add/replace/remove) via la couche T1 -> le plafond
// DUR de T1 s'applique tel quel (aucune reimplementation ici). op inconnue / plafond depasse -> ok:false.
function materializeMemory(home, proposal) {
  const jsonPath = path.join(proposal.dir, 'artifact', 'memory.json');
  if (!fs.existsSync(jsonPath)) return { ok: false, reason: 'artefact-memory-absent' };
  let spec;
  try { spec = JSON.parse(fs.readFileSync(jsonPath, 'utf8')); }
  catch { return { ok: false, reason: 'artefact-memory-illisible' }; }
  const { op, target, content } = spec;

  // ROUTAGE VERS LE CANON PROJET : la cible `produit` n'ecrit PAS dans ~/.iaka/memory/ mais dans
  // <projet>/specs/canon/PRODUIT.md. Le depot cible est porte par l'ARTEFACT (`projectPath`, pose a
  // la cloture) : sans lui, on ne saurait pas quel depot amender, et deviner serait pire que refuser.
  if (target === 'produit') return materializeProduit(spec, op, content);

  let r;
  if (op === 'add') r = memoryAdd(home, target, content);
  else if (op === 'replace') r = memoryReplace(home, target, spec.old ?? spec.oldContent, content);
  else if (op === 'remove') r = memoryRemove(home, target, content);
  else return { ok: false, reason: 'op-inconnue', op };
  return { ...r, kind: 'memory' };
}

// produit : rejoue l'op sur le canon PROJET (lib/projectCanon.js) — plafond DUR de ce canon-la,
// AUCUNE reimplementation ici, et strictement AUCUNE ecriture hors <projet>/specs/canon/.
// `replace` porte la promesse du lot : l'entree est corrigee EN PLACE, pas empilee.
function materializeProduit(spec, op, content) {
  const projectPath = spec.projectPath;
  if (!projectPath) return { ok: false, reason: 'artefact-produit-sans-projet' };
  let home;
  try { home = projectCanonHome(projectPath); }
  catch (e) { return { ok: false, reason: 'projet-non-resolu', detail: e.message }; }
  let r;
  if (op === 'add') r = produitAdd(home, content);
  else if (op === 'replace') r = produitReplace(home, spec.old ?? spec.oldContent, content);
  else if (op === 'remove') r = produitRemove(home, content);
  else return { ok: false, reason: 'op-inconnue', op };
  return { ...r, kind: 'produit', canonHome: home, projectPath };
}

// skill : materialise le SKILL.md de l'artefact a l'emplacement des skills de la bibliotheque
// (library/skills/<id>/SKILL.md, cf. lib/library.js COLLECTIONS). L'id est lu dans le frontmatter de
// l'artefact (a defaut, le slug). N'ECRASE JAMAIS un skill existant (garde non destructif).
function materializeSkill(proposal, opts) {
  const skillPath = path.join(proposal.dir, 'artifact', 'SKILL.md');
  if (!fs.existsSync(skillPath)) return { ok: false, reason: 'artefact-skill-absent' };
  const content = fs.readFileSync(skillPath, 'utf8');
  const { data } = parseFrontmatter(content);
  const id = data.id || proposal.slug;
  const root = opts.libraryRoot ? path.resolve(opts.libraryRoot) : libraryRoot(opts.root);
  const dest = path.join(root, 'library', 'skills', id, 'SKILL.md');
  if (fs.existsSync(dest)) return { ok: false, reason: 'skill-existe-deja', dest, id };
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content, 'utf8');
  return { ok: true, kind: 'skill', dest, id };
}

// Dispatch de materialisation. hook/config : NON produits au MVP par close -> branchement generique
// present mais non materialise (renvoie ok:false ; le geste correspondant viendra plus tard).
function materialize(home, proposal, opts) {
  switch (proposal.type) {
    case 'memory': return materializeMemory(home, proposal);
    case 'skill':  return materializeSkill(proposal, opts);
    case 'hook':
    case 'config': return { ok: false, reason: 'type-non-materialisable-mvp', type: proposal.type };
    default:       return { ok: false, reason: 'type-inconnu', type: proposal.type };
  }
}

// --- Ecriture du statut dans proposal.md (frontmatter) --------------------------------------------
// Remplace la ligne `status:` du frontmatter et pose/rafraichit une ligne `resolved:`. On opere par
// substitution ciblee (le reste de proposal.md — quoi/ou/pourquoi/artefact — est preserve verbatim).
function setStatus(proposal, status, whenIso) {
  const pm = proposalPath(proposal.dir);
  let text = fs.readFileSync(pm, 'utf8');
  text = text.replace(/^status:[ \t]*.*$/m, `status: ${status}`);
  if (/^resolved:[ \t]*.*$/m.test(text)) {
    text = text.replace(/^resolved:[ \t]*.*$/m, `resolved: ${whenIso}`);
  } else {
    text = text.replace(/^status: .*$/m, (m) => `${m}\nresolved: ${whenIso}`);
  }
  fs.writeFileSync(pm, text, 'utf8');
  proposal.status = status;
}

function nowIso(opts) { return (opts.now instanceof Date ? opts.now : new Date()).toISOString(); }

// --- Appliquer (geste humain explicite) -----------------------------------------------------------
// applyProposal(home, id, opts) : materialise l'artefact et passe le statut a `applique`. C'est le
// GESTE HUMAIN de consentement : il s'applique a n'importe quel type (y compris structurel — c'est
// l'exercice du gate). Refus si deja traitee (pas deux fois) ou si la materialisation echoue (ex.
// plafond dur T1 depasse) -> dans ce cas le statut reste `en-attente` (rien n'est perdu).
export function applyProposal(home, idOrPrefix, opts = {}) {
  const res = resolveProposal(home, idOrPrefix);
  if (!res.ok) return { ok: false, ...res };
  const p = res.proposal;
  if (p.status !== STATUS.PENDING) {
    return { ok: false, reason: 'deja-traitee', id: p.id, status: p.status };
  }
  const mat = materialize(home, p, opts);
  if (!mat.ok) {
    // Pas de mutation de statut : la proposition reste en attente (echec non destructif).
    return { ok: false, reason: 'materialisation-echouee', id: p.id, type: p.type, materialize: mat };
  }
  setStatus(p, STATUS.APPLIED, nowIso(opts));
  return { ok: true, id: p.id, type: p.type, status: p.status, materialize: mat };
}

// --- Rejeter --------------------------------------------------------------------------------------
// rejectProposal(home, id) : passe le statut a `rejete` SANS rien materialiser. Rien n'est perdu :
// le reservoir garde la trace + le « pourquoi ». Refus si deja traitee.
export function rejectProposal(home, idOrPrefix, opts = {}) {
  const res = resolveProposal(home, idOrPrefix);
  if (!res.ok) return { ok: false, ...res };
  const p = res.proposal;
  if (p.status !== STATUS.PENDING) {
    return { ok: false, reason: 'deja-traitee', id: p.id, status: p.status };
  }
  setStatus(p, STATUS.REJECTED, nowIso(opts));
  return { ok: true, id: p.id, type: p.type, status: p.status };
}

// --- Passe AUTOMATIQUE (branchable sur la cadence, T6) --------------------------------------------
// autoApply(home, opts) : parcourt les propositions EN-ATTENTE et n'applique QUE celles que la
// politique (classify) autorise en auto (registre + write_approval:auto). Les structurels et le
// profil restent en file, quoi qu'il arrive. Retourne { applied[], kept[] }.
export function autoApply(home, opts = {}) {
  const cfg = opts.config || loadConfig(home);
  const applied = [];
  const kept = [];
  for (const p of listProposals(home, { status: STATUS.PENDING })) {
    const policy = classify(p.type, p.target, cfg);
    if (!policy.auto) { kept.push({ id: p.id, type: p.type, target: p.target, reason: policy.reason }); continue; }
    const r = applyProposal(home, p.id, opts);
    if (r.ok) applied.push({ id: p.id, type: p.type, target: p.target });
    else kept.push({ id: p.id, type: p.type, target: p.target, reason: r.reason });
  }
  return { ok: true, applied, kept };
}
