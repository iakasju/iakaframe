// iakaframe recall <requete...> - rappel BON MARCHE sur l'historique brut du canon (T2, § 5.2).
// Recherche plein-texte sur transcripts/ du canon : retrouve un passage SANS le charger dans le
// prompt. Moteur ripgrep (rg) en sous-process ; repli lecture-fichiers Node si rg absent (jamais de
// crash). La resolution du chemin du canon (--home > IAKA_MEMORY_HOME > ~/.iaka/memory/) est celle de
// T1 (lib/memory.js). Reference : specs/instructions/boucle-apprentissage-incrementale.md.
import { parseArgs } from 'node:util';
import { resolveMemoryHome } from '../lib/memory.js';
import { recall } from '../lib/recall.js';
import { emit, fail, ok } from '../lib/output.js';

const USAGE = `Usage : iakaframe recall <requête...> [options]

Recherche plein-texte sur l'historique brut du canon (transcripts/) : retrouve un
passage SANS le charger dans le prompt (§ 5.2). Moteur ripgrep, repli Node si absent.

Options :
  --home <dir>   Force le chemin du canon (sinon IAKA_MEMORY_HOME, sinon ~/.iaka/memory/)
  --json         Sortie machine (tableau d'objets structurés : file/path/line/text/date)`;

export function runRecall(argv) {
  const { values, positionals } = parseArgs({
    args: argv, allowPositionals: true,
    options: { home: { type: 'string' }, json: { type: 'boolean', default: false } },
  });
  const json = values.json;
  const query = positionals.join(' ').trim();
  if (!query) { fail(json, USAGE); return; }

  let home;
  try { home = resolveMemoryHome(values.home); }
  catch (e) { fail(json, e.message); return; }

  let report;
  try { report = recall(home, query); }
  catch (e) { fail(json, e.message); return; }

  // report = { degraded, count, dir, engine, results:[] } ; count = results.length (deja present).
  emit(json, ok(report), () => renderHuman(report, query));
}

function renderHuman(report, query) {
  if (report.degraded) {
    console.error('⚠ ripgrep (rg) introuvable — repli lecture-fichiers (littéral, insensible à la casse).');
    console.error('  → installez ripgrep pour un rappel plus rapide : https://github.com/BurntSushi/ripgrep');
  }
  if (report.count === 0) {
    console.log(`Aucun passage pour « ${query} » dans ${report.dir}`);
    return;
  }
  console.log(`${report.count} passage(s) pour « ${query} » (moteur : ${report.engine}) :\n`);
  for (const r of report.results) {
    const stamp = r.date ? `[${r.date}] ` : '';
    console.log(`${stamp}${r.file}:${r.line}`);
    console.log(`    ${truncate(r.text, 160)}`);
  }
}

function truncate(s, n) { return s.length > n ? `${s.slice(0, n - 1)}…` : s; }
