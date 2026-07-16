// iakaframe memory - outil du CANON du portefeuille (T1). Substrat de fichiers NEUTRE (defaut
// ~/.iaka/memory/, ou IAKA_MEMORY_HOME) : resolution du chemin, layout, config.yaml, et mutations
// add/replace/remove sur PROFIL.md / REGISTRE.md avec plafond DUR + consolidation a ~80 %.
// Zero dep, autonome, aucun hote. Reference : specs/instructions/boucle-apprentissage-incrementale.md.
import { parseArgs } from 'node:util';
import {
  resolveMemoryHome, ensureLayout, loadConfig, configPath,
  memoryAdd, memoryReplace, memoryRemove, memoryList, statePath, measure,
} from '../lib/memory.js';
import fs from 'node:fs';

const USAGE = `Usage : iakaframe memory <action> [options]

Actions :
  init                         Cree/complete le layout du canon (non destructif)
  path                         Affiche le chemin du canon resolu
  config                       Affiche la config resolue (plafonds, seuils, consentement, cadence)
  list <profil|registre>       Liste les entrees d'un etat
  add <profil|registre> <txt>  Ajoute une entree datee (idempotent) ; refuse si depassement de plafond
  replace <profil|registre> <ancien> <nouveau>   Remplace une entree existante
  remove <profil|registre> <txt>                 Retire une entree (idempotent)

Options :
  --home <dir>   Force le chemin du canon (sinon IAKA_MEMORY_HOME, sinon ~/.iaka/memory/)
  --json         Sortie machine`;

export function runMemory(argv) {
  const { values, positionals } = parseArgs({
    args: argv, allowPositionals: true,
    options: { home: { type: 'string' }, json: { type: 'boolean', default: false } },
  });
  const [action, ...rest] = positionals;
  const json = values.json;

  let home;
  try { home = resolveMemoryHome(values.home); }
  catch (e) { fail(e.message, json); return; }

  const out = (obj, human) => { if (json) console.log(JSON.stringify(obj, null, 2)); else console.log(human); };

  switch (action) {
    case 'init': {
      const created = ensureLayout(home);
      out({ ok: true, home, created }, `Canon prêt : ${home}${created.length ? `\n  + ${created.length} élément(s) créé(s)` : ' (déjà en place)'}`);
      break;
    }
    case 'path': {
      out({ home }, home);
      break;
    }
    case 'config': {
      ensureLayout(home);
      const cfg = loadConfig(home);
      out({ home, config: cfg, configFile: configPath(home) },
        `Config du canon (${configPath(home)}) :\n` +
        `  plafonds        : PROFIL ≤ ${cfg.caps.profil} · REGISTRE ≤ ${cfg.caps.registre} (caractères)\n` +
        `  consolidation   : ${Math.round(cfg.consolidation_threshold * 100)} %\n` +
        `  seuil répété N  : ${cfg.repeat_threshold}\n` +
        `  write_approval  : ${cfg.write_approval}\n` +
        `  cadence close   : ${cfg.cadence.close_on.join(', ')}\n` +
        `  provider        : ${cfg.provider.kind}`);
      break;
    }
    case 'list': {
      const [target] = rest;
      if (!target) return fail(USAGE, json);
      try { out({ home, target, entries: memoryList(home, target) }, memoryList(home, target).map((e) => `- ${e}`).join('\n') || '(aucune entrée)'); }
      catch (e) { fail(e.message, json); }
      break;
    }
    case 'add': {
      const [target, ...txt] = rest;
      if (!target || !txt.length) return fail(USAGE, json);
      run(() => memoryAdd(home, target, txt.join(' ')), home, json);
      break;
    }
    case 'replace': {
      const [target, oldC, ...newC] = rest;
      if (!target || !oldC || !newC.length) return fail(USAGE, json);
      run(() => memoryReplace(home, target, oldC, newC.join(' ')), home, json);
      break;
    }
    case 'remove': {
      const [target, ...txt] = rest;
      if (!target || !txt.length) return fail(USAGE, json);
      run(() => memoryRemove(home, target, txt.join(' ')), home, json);
      break;
    }
    default:
      fail(USAGE, json);
  }
}

// Execute une mutation memory et rend le rapport (humain ou JSON). Sort en erreur si refus (plafond/absence).
function run(fn, home, json) {
  let report;
  try { report = fn(); }
  catch (e) { return fail(e.message, json); }

  if (json) { console.log(JSON.stringify(report, null, 2)); }
  else {
    if (!report.ok && report.reason === 'cap-exceeded') {
      console.error(`Refus (plafond dépassé) : ${report.target} atteindrait ${report.length}/${report.cap} caractères.`);
      console.error('  → consolidation requise (fusion d\'entrées) avant d\'ajouter — geste `close` (T4).');
    } else if (!report.ok && report.reason === 'not-found') {
      console.error(`Entrée introuvable dans ${report.target} : « ${report.match} » (rien remplacé).`);
    } else {
      const bytes = measure(fs.readFileSync(statePath(home, report.target), 'utf8'));
      const flag = report.consolidationNeeded ? '  ⚠ consolidation conseillée (≥ 80 % du plafond)' : '';
      const verb = report.action === 'add' ? 'ajout' : report.action === 'replace' ? 'remplacement' : 'retrait';
      console.log(`${report.changed ? 'OK' : 'no-op'} — ${verb} sur ${report.target} (${bytes}/${report.cap} car.)${flag}`);
    }
  }
  if (!report.ok) process.exitCode = 1;
}

function fail(msg, json) {
  if (json) console.log(JSON.stringify({ ok: false, error: msg }, null, 2));
  else console.error(msg);
  process.exitCode = 1;
}
