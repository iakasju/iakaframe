// iakaframe vendor-check - constate que le vendorage de iakaFrameGUI est fidele au canon iakaframe.
// (specs/instructions/garde-vendor-check-cross-repo.md § 3.2/3.4/4.4/4.5)
//
// La source detient la verite ; c'est elle qui constate que son miroir a decroche. Le verbe rend
// la garde INVOCABLE a la demande et scriptable (--json), et surtout : il donne le geste de
// remediation. Une garde qui affiche un rouge que personne ne sait eteindre est une garde qu'on
// finit par desactiver.
//
// GRACIEUX PAR DEFAUT : depot frere absent -> exit 0 (on ne bloque pas un clone isole) mais
// ok:false (rien n'a ete compare). --strict pour l'usage portefeuille, ou l'on SAIT que les deux
// depots sont la.
import { parseArgs } from 'node:util';
import { libraryRoot } from '../lib/library.js';
import { checkVendor } from '../lib/vendor.js';
import { emit } from '../lib/output.js';

// Les DEUX gestes de remediation (§ 4.4) — jamais un seul. Noyer les derivees dans « re-vendorez
// les 21 fichiers » conduirait l'operateur a les COPIER, detruisant la forme canonique sur
// laquelle methodMd/teamMd/kitMd.test.ts sont batis.
export const REMEDIATION_COPIES = [
  'cp cli/test/fixtures/agents-golden/*.md   <GUI>/packages/core/__tests__/fixtures/agents-golden/',
  'cp library/personas/*.md                  <GUI>/packages/core/__tests__/fixtures/personas/',
  'cp bindings/iakaframe-claude-default.md   <GUI>/packages/core/__tests__/fixtures/binding/',
];
export const REMEDIATION_DERIVED = [
  'node packages/core/scripts/gen-fixtures.mjs   (depuis <GUI> ; methode, methode wrapped, team)',
  'iakaframe assemble iakaframe iakaframe-8 --write   (depuis iakaframe ; kit)',
];

function humanReport(res, strict) {
  if (res.status === 'skipped') {
    console.log('vendor-check : SKIP - ' + res.reason);
    console.log('  chemins essayes :');
    for (const c of res.candidates) console.log('    - ' + c);
    console.log('  override : IAKAFRAME_GUI_ROOT=<chemin absolu vers iakaFrameGUI>');
    if (strict) console.log('  --strict : absence du frere traitee comme un echec.');
    return;
  }
  if (res.ok) {
    console.log(`vendor-check : OK - ${res.checked} copies + ${res.derived} derivees conformes au canon.`);
    console.log('  miroir : ' + res.guiRoot);
    return;
  }

  console.log(`vendor-check : DERIVE - ${res.drift} fixture(s) sur ${res.checked + res.derived} verifiee(s).`);
  console.log('  miroir : ' + res.guiRoot);
  console.log('');
  for (const f of res.files) {
    const nature = f.kind === 'derived' ? 'derivee' : (f.kind === 'unexpected' ? 'surnumeraire' : 'copie');
    console.log(`  - ${f.fixture}  [${f.family} / ${nature}]`);
    for (const r of f.reasons) {
      let line = '      ' + r.reason;
      if (r.fields) line += ' : ' + r.fields.map((d) => d.field).join(', ');
      if (r.detail) line += ' : ' + r.detail;
      console.log(line);
    }
    if (f.source) console.log('      source : ' + f.source);
  }
  console.log('');
  console.log('  DEUX gestes distincts - ne jamais copier une derivee :');
  console.log('  1. les 17 COPIES (8 goldens + 8 personas + 1 binding) -> RE-VENDORAGE PAR COPIE');
  for (const c of REMEDIATION_COPIES) console.log('       ' + c);
  console.log('  2. les 4 DERIVEES (methode, methode wrapped, team, kit) -> REGENERATION PAR LE');
  console.log('     SERIALISEUR. Les copier detruirait leur forme canonique et les tests batis dessus.');
  for (const c of REMEDIATION_DERIVED) console.log('       ' + c);
}

export function runVendorCheck(argv) {
  const { values } = parseArgs({
    args: argv, allowPositionals: true,
    options: {
      root: { type: 'string' },
      gui: { type: 'string' },
      strict: { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
    },
  });
  const json = values.json;
  const root = libraryRoot(values.root);
  const res = checkVendor({ root, guiRoot: values.gui || undefined });

  if (res.status === 'skipped') {
    if (values.strict) {
      // --strict : l'absence du frere devient un echec (usage portefeuille).
      const payload = { ok: false, error: res.reason, status: 'skipped', candidates: res.candidates };
      emit(json, payload, () => humanReport(res, true));
      process.exitCode = 1;
      return payload;
    }
    // Defaut gracieux : exit 0, mais ok:false — rien n'a ete verifie.
    emit(json, res, () => humanReport(res, false));
    return res;
  }

  emit(json, res, () => humanReport(res, values.strict));
  if (!res.ok) process.exitCode = 1;
  return res;
}
