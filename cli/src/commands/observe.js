// iakaframe observe - verbe d'ECRITURE de l'observation silencieuse d'Odin (FE2). Ecrit DIRECTEMENT
// dans le store non-gate <IAKAFRAME_ROOT>/.iaka/observation/ (surchargeable --home), SANS aucun
// prompt de consentement, SANS reservoir : une puce datee idempotente par projet ou pour l'agregat
// portefeuille. DISTINCT du canon review-gate (memory/review). Zero dependance.
import { parseArgs } from 'node:util';
import { resolveObservationHome, observe, observeList } from '../lib/observation.js';

const USAGE = `Usage : iakaframe observe [action] [options]

Ecriture silencieuse (sans consentement, hors canon review-gate) :
  observe --project <nom> "<note>"    Ajoute une puce datee dans observation/<nom>.md
  observe --portfolio "<note>"        Ajoute une puce datee dans observation/_portefeuille.md
  observe list [--project <nom>|--portfolio]   Liste les entrees (defaut : tout le store)

Options :
  --project <nom>   Cible le fichier d'un projet
  --portfolio       Cible l'agregat portefeuille (_portefeuille.md)
  --home <dir>      Force le store (defaut <IAKAFRAME_ROOT>/.iaka/observation/)
  --root <dir>      Force le chapeau (sinon IAKAFRAME_ROOT, sinon ~/work)
  --json            Sortie machine`;

export function runObserve(argv) {
  const { values, positionals } = parseArgs({
    args: argv, allowPositionals: true,
    options: {
      project: { type: 'string' },
      portfolio: { type: 'boolean', default: false },
      home: { type: 'string' },
      root: { type: 'string' },
      json: { type: 'boolean', default: false },
    },
  });
  const json = values.json;
  const out = (obj, human) => { if (json) console.log(JSON.stringify(obj, null, 2)); else console.log(human); };

  let home;
  try { home = resolveObservationHome(values.home, values.root); }
  catch (e) { return fail(e.message, json); }

  const [action, ...rest] = positionals;

  if (action === 'list') {
    const res = observeList(home, { project: values.project, portfolio: values.portfolio });
    const human = res.length
      ? res.map((f) => `${f.file}\n` + (f.entries.length ? f.entries.map((e) => `  - ${e}`).join('\n') : '  (aucune entree)')).join('\n')
      : '(store vide)';
    out({ ok: true, home, files: res }, human);
    return;
  }

  const note = positionals.join(' ').trim();
  if (!note) return fail(USAGE, json);
  if (!values.portfolio && !values.project) return fail('Preciser --project <nom> ou --portfolio.', json);

  try {
    const rep = observe(home, { project: values.project, portfolio: values.portfolio }, note);
    out(rep, `${rep.changed ? 'OK' : 'no-op'} — observation ${rep.scope} → ${rep.file}`);
  } catch (e) { fail(e.message, json); }
}

function fail(msg, json) {
  if (json) console.log(JSON.stringify({ ok: false, error: msg }, null, 2));
  else console.error(msg);
  process.exitCode = 1;
}
