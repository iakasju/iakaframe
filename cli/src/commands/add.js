// iakaframe add team|method|binding <fichier.md> - geste de LIVRAISON (fabrication cote
// bibliotheque). Valide le schema + l'integrite referentielle (I1) AVANT toute ecriture :
// refuse sans ecrire si une reference est cassee. Non destructif (refus si cible existe, --force).
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { parseFrontmatter } from '../lib/frontmatter.js';
import { ADD_DIR, checkRefs, checkSchema, libraryRoot } from '../lib/library.js';
import { scaffoldPoolAtom, POOL_KINDS } from '../lib/scaffold.js';
import { emit, fail } from '../lib/output.js';

// Kinds d'ASSEMBLAGE (livraison d'un fichier deja redige) : `frame` est desormais EXPOSE (le
// cablage lib ADD_DIR/checkSchema/checkRefs le supportait deja, § 0.4 / AC2.5).
const ASSEMBLY_KINDS = ['team', 'method', 'binding', 'frame'];
// POOL_KINDS (persona/role/principle/ritual/guardrail/skill/workflow/scaffold) : SCAFFOLD d'un
// atome typé neuf par id (Lot 2, § 4.2) - mode distinct de la livraison de fichier.
const KINDS = [...ASSEMBLY_KINDS, ...POOL_KINDS];

export function runAdd(argv) {
  const { values, positionals } = parseArgs({
    args: argv, allowPositionals: true,
    options: {
      root: { type: 'string' }, force: { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
    },
  });
  const json = values.json;
  const [kind, arg] = positionals;
  if (!kind || !KINDS.includes(kind) || !arg) {
    return fail(json, `Usage : iakaframe add <${ASSEMBLY_KINDS.join('|')}> <fichier.md>\n        iakaframe add <${POOL_KINDS.join('|')}> <id>`);
  }

  // --- Mode SCAFFOLD d'atome de pool : `add <type-de-pool> <id>` (pose un atome typé neuf). -----
  if (POOL_KINDS.includes(kind)) {
    const root = libraryRoot(values.root);
    const res = scaffoldPoolAtom(kind, arg, root, { force: values.force });
    if (!res.ok) { emit(json, { ok: false, error: res.error }, () => console.error(`Refus : ${res.error}`)); process.exitCode = 1; return; }
    emit(json, { ok: true, kind: res.kind, id: res.id, dest: res.dest }, () => console.log(`+ ${res.kind} ${res.id} scaffolde dans ${res.dest}`));
    return;
  }

  // --- Mode LIVRAISON d'assemblage : `add <team|method|binding|frame> <fichier.md>`. ------------
  const file = arg;
  if (!fs.existsSync(file)) return fail(json, `Fichier introuvable : ${file}`);

  const root = libraryRoot(values.root);
  const { data } = parseFrontmatter(fs.readFileSync(file, 'utf8'));

  // `ok` en PREMIERE cle du rapport (C-JSON regle 2).
  const report = { ok: false, kind, file, errors: [], missing: [], badRunners: [] };

  // 1) Schema (champs requis).
  const schema = checkSchema(kind, data);
  if (!schema.ok) report.errors.push(`champs requis manquants : ${schema.missing.join(', ')}`);

  // 2) id == basename(fichier) (invariant I2).
  const base = path.basename(file).replace(/\.md$/, '');
  if (data.id !== base) report.errors.push(`id (${data.id}) != nom de fichier (${base})`);

  // 3) Integrite referentielle (I1) - seulement si le schema tient (sinon refs partielles).
  if (schema.ok) {
    const refs = checkRefs(kind, data, root);
    report.missing = refs.missing;
    report.badRunners = refs.badRunners;
    if (!refs.ok) report.errors.push('références cassées');
  }

  if (report.errors.length) {
    // Rapport d'echec de validation (ok:false, deja structure) : emis tel quel + exitCode 1.
    emit(json, report, () => {
      console.error(`Refus (aucune écriture) : ${kind} ${data.id || base}`);
      for (const e of report.errors) console.error(`  - ${e}`);
      for (const m of report.missing) console.error(`  ! ref cassée : ${m.field} → ${m.id} (attendu dans ${m.collection})`);
      for (const b of report.badRunners) console.error(`  ! runner invalide : ${b.personaId} → ${b.runner}`);
    });
    process.exitCode = 1; return;
  }

  // 4) Depot non destructif.
  const dest = path.join(root, ADD_DIR[kind], `${data.id}.md`);
  if (fs.existsSync(dest) && !values.force) {
    const msg = `existe déjà : ${dest} (--force pour remplacer)`;
    emit(json, { ...report, ok: false, error: msg }, () => console.error(`Refus : ${msg}`));
    process.exitCode = 1; return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(file, dest);
  report.ok = true; report.dest = dest;

  const refCount = countRefs(kind, data);
  emit(json, report, () => {
    console.log(`+ ${kind} ${data.id} livré dans ${dest}`);
    console.log(`  références vérifiées : ${refCount} (toutes présentes)`);
  });
}

function countRefs(kind, data) {
  const arr = (v) => (v == null || v === '' ? [] : Array.isArray(v) ? v : [v]);
  if (kind === 'team') return arr(data.personas).length + arr(data.coordinator).length + arr(data.guardrails).length;
  if (kind === 'method') return arr(data.workflowId).length + arr(data.principleIds).length + arr(data.ritualIds).length + arr(data.guardrailIds).length + arr(data.roleKeys).length + arr(data.scaffoldIds).length;
  return 2 + arr(data.assignments).length; // methodId + teamId + assignments
}
