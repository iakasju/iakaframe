// iakaframe consolidate - « Consolidation initiale » (T8, § 9, critere 10). Fond les fiches memoire
// existantes du portefeuille dans un APERCU capé de PROFIL.md / REGISTRE.md (curation, pas copie),
// SOUS PLAFOND DUR, pour revue humaine SUR DIFF. N'ECRIT JAMAIS dans le canon reel : produit
// seulement <home>/consolidation/{PROFIL,REGISTRE}.proposed.md + DIFF.md + RAPPORT.md. L'application
// (recopier l'apercu sur le canon) reste un geste humain gate. Resolution du canon = celle de T1.
// Reference : specs/instructions/boucle-apprentissage-incrementale.md.
import { parseArgs } from 'node:util';
import { resolveMemoryHome } from '../lib/memory.js';
import { consolidate, defaultSourceDir } from '../lib/consolidate.js';

const USAGE = `Usage : iakaframe consolidate [options]

Consolidation initiale : fond les fiches mémoire du portefeuille en un APERÇU capé de
PROFIL.md / REGISTRE.md (curation, pas copie) pour revue humaine SUR DIFF (§ 9, critère 10).
N'APPLIQUE RIEN au canon réel : produit consolidation/{PROFIL,REGISTRE}.proposed.md + DIFF.md.

Options :
  --source <dir>   Dossier des fiches à fondre (défaut : mémoire portefeuille ~/work)
  --home <dir>     Canon (STAGING) — sinon IAKA_MEMORY_HOME, sinon ~/.iaka/memory/
                     Utiliser un --home de staging pour NE PAS toucher au canon réel.
  --json           Sortie machine`;

export function runConsolidate(argv) {
  const { values } = parseArgs({
    args: argv, allowPositionals: true,
    options: {
      home: { type: 'string' },
      source: { type: 'string' },
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
  try { report = consolidate({ home, source: values.source }); }
  catch (e) { return fail(e.message, json); }

  if (json) {
    // Sortie machine : on omet les longs corps `proposed`/`before` (disponibles sur disque).
    const slim = (r) => ({
      cap: r.cap, chars: r.chars, overCap: r.overCap, proposedPath: r.proposedPath,
      kept: r.kept.map((e) => ({ source: e.source, type: e.type })),
      dropped: r.dropped.map((e) => ({ source: e.source, type: e.type })),
    });
    console.log(JSON.stringify({
      ok: report.ok, home: report.home, sourceDir: report.sourceDir, stagingDir: report.stagingDir,
      fiches: report.fiches, skipped: report.skipped, missing: report.missing,
      profil: slim(report.profil), registre: slim(report.registre),
    }, null, 2));
    return;
  }

  // --- Sortie humaine -----------------------------------------------------------------------------
  const src = values.source || defaultSourceDir();
  console.log(`Consolidation initiale — source ${src}`);
  if (report.missing) console.log('  ⚠ source introuvable : aucun fiche lue.');
  console.log(`  ${report.fiches} fiche(s) lue(s), ${report.skipped.length} ignorée(s) — canon (staging) ${home}`);
  for (const target of ['profil', 'registre']) {
    const r = report[target];
    const flag = r.overCap ? ' ⚠ DÉPASSEMENT' : '';
    console.log(`  ${target.toUpperCase()} : ${r.chars}/${r.cap} chars${flag} — ${r.kept.length} retenue(s), ${r.dropped.length} écartée(s)`);
  }
  console.log(`\nAperçu + diff dans : ${report.stagingDir}`);
  console.log('  PROFIL.proposed.md · REGISTRE.proposed.md · DIFF.md · RAPPORT.md');
  console.log('\nLe canon réel n\'est PAS muté. Revoir le DIFF puis appliquer à la main = geste humain gate (§ 8).');
}

function fail(msg, json) {
  if (json) console.log(JSON.stringify({ ok: false, error: msg }, null, 2));
  else console.error(msg);
  process.exitCode = 1;
}
