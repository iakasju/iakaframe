// iakaframe review - REVUE du RESERVOIR de propositions (T5, « garde de consentement », § 8 / Q-4).
// Liste / montre / applique / rejette les propositions deposees par `close` (T4) dans proposals/.
// « Appliquer » materialise l'artefact selon son type via les couches existantes (memory de T1,
// bibliotheque pour skill). Politique par defaut : PROFIL en file, REGISTRE auto (selon
// write_approval), STRUCTUREL toujours en file (jamais auto). Resolution du canon = celle de T1
// (--home > IAKA_MEMORY_HOME > ~/.iaka/memory/). Zero dep. Reference : instruction
// specs/instructions/boucle-apprentissage-incrementale.md.
import { parseArgs } from 'node:util';
import { resolveMemoryHome, ensureLayout, loadConfig } from '../lib/memory.js';
import {
  listProposals, resolveProposal, readProposalText,
  applyProposal, rejectProposal, autoApply, classify, STATUS,
} from '../lib/review.js';
import { collection, emit, fail, ok } from '../lib/output.js';

const USAGE = `Usage : iakaframe review <action> [options]

Revue du réservoir de propositions (produit par \`close\`, T4) — garde de consentement (§ 8).

Actions :
  list [--status <s>]      Liste les propositions (s ∈ en-attente|applique|rejete)
  show <id>                Détail d'une proposition (proposal.md complet)
  apply <id>               Applique (geste humain) : matérialise l'artefact + statut applique
  reject <id>              Rejette : statut rejete, sans rien matérialiser
  auto                     Passe automatique : applique le SEUL auto-applicable (REGISTRE si
                           write_approval:auto). PROFIL et STRUCTUREL restent toujours en file.

<id> = nom du dossier de proposition (horodatage--type--slug) ou un préfixe non ambigu.

Options :
  --library <dir>  Racine de bibliothèque cible pour matérialiser un skill (sinon auto-résolue)
  --home <dir>     Force le chemin du canon (sinon IAKA_MEMORY_HOME, sinon ~/.iaka/memory/)
  --json           Sortie machine`;

export function runReview(argv) {
  const { values, positionals } = parseArgs({
    args: argv, allowPositionals: true,
    options: {
      home: { type: 'string' },
      library: { type: 'string' },
      status: { type: 'string' },
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });
  const json = values.json;
  if (values.help) { console.log(USAGE); return; }

  const [action, id] = positionals;

  let home;
  try { home = resolveMemoryHome(values.home); }
  catch (e) { return fail(json, e.message); }
  ensureLayout(home);

  const opts = { libraryRoot: values.library };

  switch (action) {
    case 'list':   return doList(home, values.status, json);
    case 'show':   return doShow(home, id, json);
    case 'apply':  return doApply(home, id, opts, json);
    case 'reject': return doReject(home, id, json);
    case 'auto':   return doAuto(home, opts, json);
    default:       return fail(USAGE, json);
  }
}

function doList(home, status, json) {
  const cfg = loadConfig(home);
  const items = listProposals(home, status ? { status } : {}).map((p) => ({
    ...p, policy: classify(p.type, p.target, cfg).auto ? 'auto' : 'file',
  }));
  emit(json, collection('proposals', items, { home }), () => {
    if (items.length === 0) { console.log('Aucune proposition dans le réservoir.'); return; }
    console.log(`${items.length} proposition(s) — canon ${home}\n`);
    for (const p of items) {
      const tgt = p.target ? ` → ${p.target}` : '';
      const pol = p.status === STATUS.PENDING ? `  [${p.policy}]` : '';
      console.log(`  ${mark(p.status)} [${p.type}]${tgt}${pol}  ${p.id}`);
    }
    console.log('\napply/reject <id> pour trancher ; auto pour appliquer le auto-applicable.');
  });
}

function doShow(home, id, json) {
  const res = resolveProposal(home, id);
  if (!res.ok) return fail(json, resolveMsg(res));
  const text = readProposalText(res.proposal);
  emit(json, ok({ proposal: res.proposal, text }), () => {
    console.log(`# ${res.proposal.id}\n`);
    console.log(text);
  });
}

function doApply(home, id, opts, json) {
  const r = applyProposal(home, id, opts);
  emit(json, r, () => {
    if (r.ok) {
      const where = r.materialize.kind === 'skill' ? r.materialize.dest
        : `${r.materialize.target} (${r.materialize.length}/${r.materialize.cap} car.)`;
      console.log(`Appliquée : [${r.type}] ${r.id} → ${where} (statut : applique).`);
    } else {
      console.error(`Refus : ${explain(r)}`);
    }
  });
  if (!r.ok) process.exitCode = 1;
}

function doReject(home, id, json) {
  const r = rejectProposal(home, id);
  emit(json, r, () => {
    if (r.ok) console.log(`Rejetée : [${r.type}] ${r.id} (statut : rejete ; rien matérialisé).`);
    else console.error(`Refus : ${explain(r)}`);
  });
  if (!r.ok) process.exitCode = 1;
}

function doAuto(home, opts, json) {
  const r = autoApply(home, opts);
  emit(json, r, () => {
    console.log(`Passe automatique : ${r.applied.length} appliquée(s), ${r.kept.length} laissée(s) en file.`);
    for (const a of r.applied) console.log(`  ✓ [${a.type} → ${a.target}] ${a.id}`);
    for (const k of r.kept) console.log(`  · en file (${k.reason}) : [${k.type}${k.target ? ' → ' + k.target : ''}] ${k.id}`);
    console.log('\nStructurel (skill/hook/config) et PROFIL restent toujours en file : geste humain requis (apply <id>).');
  });
}

// --- Rendu -----------------------------------------------------------------------------------------
function mark(status) {
  if (status === STATUS.APPLIED) return '✓';
  if (status === STATUS.REJECTED) return '✗';
  return '•';
}

function resolveMsg(res) {
  if (res.reason === 'introuvable') return `Proposition introuvable : ${res.id}`;
  if (res.reason === 'ambigu') return `Préfixe ambigu (${res.id}) : ${res.matches.join(', ')}`;
  if (res.reason === 'id-manquant') return 'Identifiant de proposition manquant.';
  return `Proposition non résolue : ${res.reason}`;
}

function explain(r) {
  if (r.reason === 'deja-traitee') return `proposition déjà ${r.status} (une proposition ne s'applique/rejette pas deux fois).`;
  if (r.reason === 'introuvable' || r.reason === 'ambigu' || r.reason === 'id-manquant') return resolveMsg(r);
  if (r.reason === 'materialisation-echouee') {
    const m = r.materialize || {};
    if (m.reason === 'cap-exceeded') return `plafond dur dépassé sur ${m.target} (${m.length}/${m.cap} car.) — consolidation requise (close).`;
    if (m.reason === 'type-non-materialisable-mvp') return `type « ${m.type} » non matérialisable au MVP (close ne le produit pas encore).`;
    if (m.reason === 'skill-existe-deja') return `un skill « ${m.id} » existe déjà (${m.dest}) — non écrasé.`;
    return `matérialisation échouée (${m.reason || 'raison inconnue'}).`;
  }
  return r.reason || 'raison inconnue';
}
