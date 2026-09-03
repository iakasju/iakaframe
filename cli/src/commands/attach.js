// iakaframe attach|detach <skillId> --persona <personaId> — le `+`/`-` symetrique skill<->persona
// (instruction symetrie-ajout-suppression.md, ligne A / S2). Cas emblematique du decideur.
// Q-1 = Option 1 : le geste mute le SEUL `skills:[]` du frontmatter du persona (source unique de
// verite) ; il n'ecrit AUCUNE section dans le corps (le `-` au « titre du skill » est rendu par la
// vue). Reversible par nature : `detach` retire l'id, `attach` le remet (idempotents).
import { parseArgs } from 'node:util';
import { libraryRoot, readEntry, scan } from '../lib/library.js';
import { readPersonaSkills, setPersonaSkills } from '../lib/remove.js';
import { emit, fail } from '../lib/output.js';

function parse(argv) {
  return parseArgs({
    args: argv, allowPositionals: true,
    options: {
      root: { type: 'string' }, persona: { type: 'string' },
      force: { type: 'boolean', default: false }, json: { type: 'boolean', default: false },
    },
  });
}

export function runAttach(argv) { run('attach', argv); }
export function runDetach(argv) { run('detach', argv); }

function run(mode, argv) {
  const { values, positionals } = parse(argv);
  const [skillId] = positionals;
  const personaId = values.persona;
  const json = values.json;

  if (!skillId || !personaId) {
    fail(json, `Usage : iakaframe ${mode} <skillId> --persona <personaId>`); return;
  }

  const root = libraryRoot(values.root);
  const persona = readEntry('personas', personaId, root);
  if (!persona) {
    // Palier 0 (Lot A, refus loquace) : ids DERIVES de scan('personas'), jamais recopies.
    const ids = scan('personas', root).map((e) => e.id);
    const msg = `Persona introuvable : ${personaId}` + (ids.length ? ` — ids valides : ${ids.join(', ')}.` : '');
    fail(json, msg, { personaId, idsValides: ids }, () => console.error(msg));
    return;
  }

  // Integrite I1 : on n'attache que des skills reellement materialises dans la bibliotheque
  // (sinon on creerait une reference fantome). --force pour outrepasser (cas de reparation).
  if (mode === 'attach' && !readEntry('skills', skillId, root) && !values.force) {
    const ids = scan('skills', root).map((e) => e.id);
    const msg = `Skill introuvable dans la bibliotheque : ${skillId} (--force pour attacher malgre tout)`
      + (ids.length ? ` — ids valides : ${ids.join(', ')}.` : '');
    fail(json, msg, { skillId, idsValides: ids }, () => console.error(msg));
    return;
  }

  const before = readPersonaSkills(persona.path);
  let after;
  if (mode === 'attach') after = before.includes(skillId) ? before : [...before, skillId];
  else after = before.filter((s) => s !== skillId);

  const changed = after.length !== before.length ||
    after.some((s, i) => s !== before[i]);
  if (changed) setPersonaSkills(persona.path, after);

  const report = { ok: true, mode, skillId, personaId, changed, skills: after, path: persona.path };
  emit(json, report, () => {
    if (mode === 'attach') {
      console.log(changed
        ? `+ skill ${skillId} attaché à ${personaId}  (skills: [${after.join(', ')}])`
        : `no-op : ${skillId} déjà attaché à ${personaId}`);
    } else {
      console.log(changed
        ? `− skill ${skillId} détaché de ${personaId}  (skills: [${after.join(', ')}])`
        : `no-op : ${skillId} n'était pas attaché à ${personaId}`);
    }
  });
}
