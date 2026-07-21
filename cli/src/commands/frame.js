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
import { emit, fail } from '../lib/output.js';

const DEFAULT_FRAME = path.join('frames', 'releases', 'StefFrame2');

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
      json: { type: 'boolean', default: false },
      verbose: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });

  const action = positionals[0] || 'verify';
  if (values.help || action === 'help') { console.log(HELP); return; }
  if (action !== 'verify') {
    fail(values.json, `action inconnue : ${action} (attendu : verify)`);
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
