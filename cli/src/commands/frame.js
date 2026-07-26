// iakaframe frame verify - constate que le MIROIR (frames/releases/<X>/) est anonymise.
// (specs/instructions/outillage-scrub-miroir-frame.md § 4 / § 5 / § 7)
//
// Calque de `vendor-check` : une garde INVOCABLE a la demande, scriptable (`--json`), qui rend un
// verdict et un code de sortie. Elle CONSTATE et BLOQUE ; elle ne REECRIT jamais le miroir
// (pas de `--fix` : une reecriture automatique sur un livrable destine a des tiers est un risque
// superieur a celui qu'elle previent).
import { parseArgs } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';
import { verifyFrame, GATES, LIMITS } from '../lib/frame.js';
import { libraryRoot } from '../lib/library.js';
import { lintFrame, lintAllFrames } from '../lib/frame-lint.js';
import { scaffoldFrameNew } from '../lib/scaffold.js';
import { emit, fail } from '../lib/output.js';

const DEFAULT_FRAME = path.join('frames', 'releases', 'StefFrame2');

const LINT_HELP = `iakaframe frame lint - validateur de graphe d'une frame

Usage : iakaframe frame lint <id> | --all [--json] [--root <dir>]

Constate l'integrite du GRAPHE tire par un descripteur frames/<id>.md : le couple
(methodId, teamId) resout, les refs de la methode/team/binding(s) resolvent, les refs
sortantes des atomes de pool (persona roleKey/skills/guardrails, workflow agentsRoleKeys,
skill subskills + anti-self-ref) resolvent, le casting couvre les roles de la methode, et
id == nom de fichier partout. NE MODIFIE JAMAIS le disque.

Options :
  <id>            Descripteur a valider (frames/<id>.md).
  --all           Valide chaque descripteur de frames/ (ignore frames/releases/).
  --json          Sortie machine : { ok, frame, checked, findings:[{severity,source,field,id,kind}] }.
  --root <dir>    Racine bibliotheque (defaut : resolution auto, cf. libraryRoot).
  --help          Cette aide.

Severite : BLOQUANT (exit 1) = id pendant, casting orphelin sans coordinateur, binding
incoherent, id != nom de fichier, self-ref de skill, champ CONNU mal type (bad-type) ou requis
manquant (missing-field). AVERTISSEMENT (exit 0, liste) = role couvert par le coordinateur,
workflow catalogue-connu mais pool-absent (ARB-2), id present dans plusieurs collections de pool,
et champ de frontmatter INCONNU (unknown-field). La passe de schema type les champs connus
(table-donnee library/_schema/frontmatter.json, source unique CLI<->GUI) ; l'inconnu est SIGNALE
sans bloquer (Fork A, Finding 3).`;

const HELP = `iakaframe frame verify - garde d'anonymisation du miroir

Usage : iakaframe frame verify [--frame <dir>] [--json] [--verbose]

Options :
  --frame <dir>   Racine du miroir a verifier (defaut : ${DEFAULT_FRAME}).
  --json          Sortie machine : { ok, checked, findings:[{gate,file,line,token}] }.
  --verbose       Affiche aussi les avertissements G6 en detail (bruyants par nature).
  --help          Cette aide.

Gates :
${GATES.map(g => `  ${g.id}  ${g.label.padEnd(38)} ${g.severity === 'blocking' ? '[BLOQUANT]' : '[avertissement]'}`).join('\n')}

Le gate G2 fonctionne par ALLOWLIST : tout token \`iaka*\` hors liste blanche est refuse, y
compris un nom cree APRES l'ecriture de la regle. C'est ce qu'une blacklist ne peut pas faire.

Ce que le gate n'attrape PAS :
${LIMITS.map(l => `  - ${l}`).join('\n')}
`;

export function runFrame(argv) {
  const { values, positionals } = parseArgs({
    args: argv, allowPositionals: true,
    options: {
      frame: { type: 'string' },
      root: { type: 'string' },
      all: { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
      verbose: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });

  const action = positionals[0] || 'verify';

  // Sous-verbe `lint` (Lot 1, outillage-forge-frame.md § 3). Route AVANT le HELP verify pour que
  // `frame lint --help` montre l'aide du lint (AC1.10 : ne pas rejouer le bug `jalon --help`).
  if (action === 'lint') { runLint(values, positionals); return; }

  // Sous-verbe `new` (Lot 2) : ossature d'un frame neuf, lint-clean par construction (ARB-3).
  if (action === 'new') { runNew(values, positionals); return; }

  if (values.help || action === 'help') { console.log(HELP); return; }
  if (action !== 'verify') {
    fail(values.json, `action inconnue : ${action} (attendu : verify, lint, new)`);
    return;
  }

  const root = values.frame
    ? path.resolve(values.frame)
    : path.join(libraryRoot(), DEFAULT_FRAME);

  if (!fs.existsSync(root)) {
    fail(values.json, `miroir introuvable : ${root}`, { root }, () => {
      console.error(`frame verify : miroir introuvable - ${root}`);
      console.error('  --frame <dir> pour cibler un autre miroir.');
    });
    return;
  }

  const res = verifyFrame(root);
  const payload = {
    ok: res.ok,
    checked: res.checked,
    findings: res.findings.map(f => ({ gate: f.gate, file: f.file, line: f.line, token: f.token })),
  };

  emit(values.json, payload, () => render(res, values.verbose));
  if (!res.ok) process.exitCode = 1;
}

// --- Sous-verbe `lint` : validateur de graphe frame (Lot 1). Verbe de CONSTAT : rapporte + exit 1
//     si findings bloquants, n'ecrit JAMAIS (calque de verify). ------------------------------------
function runLint(values, positionals) {
  if (values.help) { console.log(LINT_HELP); return; }
  const root = libraryRoot(values.root);
  const target = positionals[1];

  if (!values.all && !target) {
    return fail(values.json, 'Usage : iakaframe frame lint <id> | --all [--json]');
  }

  if (values.all) {
    const res = lintAllFrames(root);
    // C-JSON : `ok` en tete, findings au PLURIEL + frere `count` (regle 3).
    const payload = { ok: res.ok, checked: res.checked, count: res.findings.length, findings: res.findings };
    emit(values.json, payload, () => renderLintAll(res));
    if (!res.ok) process.exitCode = 1;
    return;
  }

  const res = lintFrame(target, root);
  const payload = { ok: res.ok, frame: res.frame, checked: res.checked, count: res.findings.length, findings: res.findings };
  emit(values.json, payload, () => renderLint(res));
  if (!res.ok) process.exitCode = 1;
}

// --- Sous-verbe `new` : ossature d'un frame neuf (Lot 2). Ecrit descripteur + 4 fichiers
//     d'assemblage, lint-clean par construction (ARB-3, AC2.2). Non destructif (--force). ---------
const NEW_HELP = `iakaframe frame new <id> - ossature d'un frame neuf (lint-clean par construction)

Usage : iakaframe frame new <id> [--force] [--json] [--root <dir>]

Cree, sans forker la library, un assemblage neuf pointant le pool partage :
  frames/<id>.md  methods/<id>.md  teams/<id>-team.md  bindings/<id>-default.md  kits/<id>-claude.md
Chacun au frontmatter typé requis ; l'ossature passe \`frame lint <id>\` a exit 0 (ARB-3).

Options :
  <id>            Id du frame a ossaturer.
  --force         Remplace les cibles existantes (defaut : refus non destructif).
  --json          Sortie machine : { ok, frame, written:[...] }.
  --root <dir>    Racine bibliotheque (defaut : resolution auto).
  --help          Cette aide.`;

function runNew(values, positionals) {
  if (values.help) { console.log(NEW_HELP); return; }
  const id = positionals[1];
  if (!id) return fail(values.json, 'Usage : iakaframe frame new <id> [--force]');
  const root = libraryRoot(values.root);
  const res = scaffoldFrameNew(id, root, { force: values.force });
  if (!res.ok) {
    emit(values.json, { ok: false, error: res.error, ...(res.existing ? { existing: res.existing } : {}) },
      () => console.error(`frame new : refus - ${res.error}`));
    process.exitCode = 1; return;
  }
  emit(values.json, { ok: true, frame: res.frame, count: res.written.length, written: res.written, coordinator: res.coordinator, roleKey: res.roleKey, workflowId: res.workflowId }, () => {
    console.log(`+ frame ${res.frame} ossaturee (${res.written.length} fichiers) :`);
    for (const w of res.written) console.log(`    ${w}`);
    console.log(`  casting : coordinateur ${res.coordinator} (role ${res.roleKey}) ; workflow ${res.workflowId}`);
    console.log(`  verifier : iakaframe frame lint ${res.frame}`);
  });
}

function lintLine(f) {
  const tag = f.severity === 'blocking' ? 'BLOQUANT' : 'avertissement';
  return `  [${tag}] ${f.source} ${f.field} -> ${f.id}  (${f.kind})`;
}

function renderLint(res) {
  if (!res.found) {
    console.error(`frame lint : descripteur introuvable - frames/${res.frame}.md`);
    return;
  }
  const blocking = res.findings.filter(f => f.severity === 'blocking');
  const warnings = res.findings.filter(f => f.severity === 'warning');
  if (res.ok) {
    console.log(`frame lint ${res.frame} : OK - ${res.checked} document(s), 0 finding bloquant.`);
  } else {
    console.log(`frame lint ${res.frame} : ECHEC - ${blocking.length} bloquant(s) sur ${res.checked} document(s).`);
  }
  for (const f of blocking) console.log(lintLine(f));
  if (warnings.length) {
    console.log(`  ${warnings.length} avertissement(s) (non bloquant) :`);
    for (const f of warnings) console.log(lintLine(f));
  }
}

function renderLintAll(res) {
  console.log(`frame lint --all : ${res.ok ? 'OK' : 'ECHEC'} - ${res.checked} frame(s) validee(s).`);
  for (const r of res.results) {
    const blocking = r.findings.filter(f => f.severity === 'blocking').length;
    const warn = r.findings.filter(f => f.severity === 'warning').length;
    const tag = r.ok ? 'ok' : `BLOQUANT (${blocking})`;
    console.log(`  ${r.frame.padEnd(24)} ${tag}${warn ? `  [${warn} avert.]` : ''}`);
  }
  const blocking = res.findings.filter(f => f.severity === 'blocking');
  if (blocking.length) {
    console.log('');
    for (const f of blocking) console.log(`  ${f.frame}: ${lintLine(f).trim()}`);
  }
}

function render(res, verbose) {
  const warnGates = new Set(GATES.filter(g => g.severity === 'warning').map(g => g.id));

  if (res.ok) {
    console.log(`frame verify : OK - ${res.checked} fichiers, 0 fuite bloquante.`);
  } else {
    console.log(`frame verify : FUITE - ${res.blocking} constat(s) bloquant(s) sur ${res.checked} fichiers.`);
  }
  console.log('  miroir : ' + res.root);
  console.log('');

  for (const g of GATES) {
    const n = res.byGate[g.id] || 0;
    const tag = warnGates.has(g.id) ? 'avertissement' : (n ? 'BLOQUANT' : 'ok');
    console.log(`  ${g.id}  ${g.label.padEnd(38)} ${String(n).padStart(4)}  ${tag}`);
  }
  console.log('');

  // Detail des BLOQUANTS, groupes par gate puis par token (le token repete N fois n'apporte rien
  // N fois : on donne le compte et les premiers emplacements).
  for (const g of GATES) {
    const hits = res.findings.filter(f => f.gate === g.id);
    if (!hits.length) continue;
    const isWarn = warnGates.has(g.id);
    if (isWarn && !verbose) {
      const distinct = [...new Set(hits.map(h => h.token))];
      console.log(`  ${g.id} - ${hits.length} avertissement(s), ${distinct.length} token(s) distinct(s).`);
      console.log(`      ${distinct.slice(0, 12).join(', ')}${distinct.length > 12 ? ', ...' : ''}`);
      console.log('      --verbose pour le detail (non bloquant par construction).');
      console.log('');
      continue;
    }
    console.log(`  ${g.id} - ${hits.length} constat(s) :`);
    const byToken = new Map();
    for (const h of hits) {
      if (!byToken.has(h.token)) byToken.set(h.token, []);
      byToken.get(h.token).push(h);
    }
    for (const [token, list] of byToken) {
      console.log(`    - ${token}  (${list.length})`);
      for (const h of list.slice(0, 4)) console.log(`        ${h.file}:${h.line}${h.detail ? '  ' + h.detail : ''}`);
      if (list.length > 4) console.log(`        ... et ${list.length - 4} autre(s)`);
    }
    console.log('');
  }

  if (!res.ok) {
    console.log('  REMEDE : le gate CONSTATE, il ne reecrit pas. Corriger a la SOURCE (le canon)');
    console.log('  puis re-propager, plutot que de scrubber le miroir - scrubber forke le miroir.');
    console.log('');
  }
  console.log('  Ce que le gate n\'attrape PAS (relecture humaine toujours requise avant diffusion) :');
  for (const l of LIMITS) console.log('    - ' + l);
}
