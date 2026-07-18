// iakaframe observe - verbe d'ECRITURE de l'observation silencieuse d'Odin (FE2). Ecrit DIRECTEMENT
// dans le store non-gate <IAKAFRAME_ROOT>/.iaka/observation/ (surchargeable --home), SANS aucun
// prompt de consentement, SANS reservoir : une puce datee idempotente par projet ou pour l'agregat
// portefeuille. DISTINCT du canon review-gate (memory/review). Zero dependance.
import { parseArgs } from 'node:util';
import { resolveObservationHome, observe, observeList } from '../lib/observation.js';
import { collection, emit, fail } from '../lib/output.js';

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

  let home;
  try { home = resolveObservationHome(values.home, values.root); }
  catch (e) { return fail(json, e.message); }

  if (positionals[0] === 'list') {
    const res = observeList(home, { project: values.project, portfolio: values.portfolio });
    emit(json, collection('files', res, { home }), () => {
      console.log(res.length
        ? res.map((f) => `${f.file}\n` + (f.entries.length ? f.entries.map((e) => `  - ${e}`).join('\n') : '  (aucune entree)')).join('\n')
        : '(store vide)');
    });
    return;
  }

  const note = positionals.join(' ').trim();
  if (!note) return fail(json, USAGE);
  if (!values.portfolio && !values.project) return fail(json, 'Preciser --project <nom> ou --portfolio.');

  try {
    const rep = observe(home, { project: values.project, portfolio: values.portfolio }, note);
    emit(json, rep, () => console.log(`${rep.changed ? 'OK' : 'no-op'} — observation ${rep.scope} → ${rep.file}`));
  } catch (e) { fail(json, e.message); }
}
