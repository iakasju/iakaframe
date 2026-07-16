// iakaframe close - revue de cloture CADENCEE du canon (T4, § 5.3). Rejoue le(s) transcript(s) de
// transcripts/ et DEPOSE des PROPOSITIONS d'amendements TYPEES (memory/skill/hook/config) dans le
// RESERVOIR proposals/. N'APPLIQUE RIEN : PROFIL/REGISTRE, skills, hooks et config restent inchanges
// (invariant central, Q-2). La resolution du canon (--home > IAKA_MEMORY_HOME > ~/.iaka/memory/) est
// celle de T1 (lib/memory.js). Reference : specs/instructions/boucle-apprentissage-incrementale.md.
import { parseArgs } from 'node:util';
import { resolveMemoryHome, ensureLayout } from '../lib/memory.js';
import { close } from '../lib/close.js';

const USAGE = `Usage : iakaframe close [options]

Revue de clôture : rejoue les transcripts du canon et dépose des PROPOSITIONS typées
(memory/skill/hook/config) dans proposals/ — sans RIEN appliquer (§ 5.3, invariant Q-2).

Options :
  --session <fic>  Limite le rejeu à un transcript (relatif à transcripts/ ou absolu)
  --home <dir>     Force le chemin du canon (sinon IAKA_MEMORY_HOME, sinon ~/.iaka/memory/)
  --json           Sortie machine`;

export function runClose(argv) {
  const { values } = parseArgs({
    args: argv, allowPositionals: true,
    options: {
      home: { type: 'string' },
      session: { type: 'string' },
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });
  const json = values.json;
  if (values.help) { console.log(USAGE); return; }

  let home;
  try { home = resolveMemoryHome(values.home); }
  catch (e) { return fail(e.message, json); }

  let report;
  try {
    ensureLayout(home);
    report = close(home, { session: values.session });
  } catch (e) { return fail(e.message, json); }

  if (json) { console.log(JSON.stringify(report, null, 2)); return; }

  // --- Sortie humaine -----------------------------------------------------------------------------
  console.log(`Clôture : ${report.analyzed.files} transcript(s) rejoué(s) — canon ${home}`);
  console.log(`  corrections détectées : ${report.analyzed.corrections} · procédures : ${report.analyzed.procedures}`);
  if (report.emitted.length === 0) {
    console.log('Aucune proposition (rien n\'atteint le seuil de répétition).');
  } else {
    console.log(`\n${report.emitted.length} proposition(s) déposée(s) dans proposals/ (statut : en-attente) :`);
    for (const p of report.emitted) {
      const tgt = p.target ? ` → ${p.target}` : '';
      console.log(`  [${p.type}]${tgt} ×${p.occurrences}  ${p.dir}`);
    }
  }
  if (report.skipped.length) {
    console.log(`\n${report.skipped.length} ignorée(s) (déjà en attente) : ${report.skipped.map((s) => `${s.type}/${s.slug}`).join(', ')}`);
  }
  console.log('\nRien n\'est appliqué : la revue (accepter/rejeter) est le geste humain de consentement (T5, § 8).');
}

function fail(msg, json) {
  if (json) console.log(JSON.stringify({ ok: false, error: msg }, null, 2));
  else console.error(msg);
  process.exitCode = 1;
}
