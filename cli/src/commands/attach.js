// iakaframe attach|detach <skillId> --persona <personaId> — le `+`/`-` symetrique skill<->persona
// (instruction symetrie-ajout-suppression.md, ligne A / S2). Cas emblematique du decideur.
// Q-1 = Option 1 : le geste mute le SEUL `skills:[]` du frontmatter du persona (source unique de
// verite) ; il n'ecrit AUCUNE section dans le corps (le `-` au « titre du skill » est rendu par la
// vue). Reversible par nature : `detach` retire l'id, `attach` le remet (idempotents).
import { parseArgs } from 'node:util';
import { libraryRoot, readEntry, scan } from '../lib/library.js';
import { readPersonaSkills, setPersonaSkills } from '../lib/remove.js';
import { peutDemander } from '../lib/interactif.js';
import { selectionner, assemblerArgv, ligneEquivalente } from '../lib/guidage.js';
import { emit, fail } from '../lib/output.js';

function usage(mode) {
  return `Usage : iakaframe ${mode} <skillId> --persona <personaId>

${mode === 'attach' ? "Attache un skill a un persona : mute skills:[] (le + symetrique de detach)." : "Detache un skill d'un persona : retire de skills:[] (le - de attach)."}

Options :
  <skillId>          Id du skill.
  --persona <id>     Persona cible.
  --root <dir>       Racine de bibliotheque.
  ${mode === 'attach' ? '--force            Attache meme si le skill est absent de la bibliotheque (I1).' : ''}
  --guide            Mode guide (Lot A) : propose ${mode === 'attach' ? 'skill puis persona' : 'persona puis un skill attache'}, imprime la commande equivalente (echo non desactivable), execute par le chemin normal.
  --json             Sortie machine`;
}

function parse(argv) {
  return parseArgs({
    args: argv, allowPositionals: true,
    options: {
      root: { type: 'string' }, persona: { type: 'string' },
      force: { type: 'boolean', default: false }, json: { type: 'boolean', default: false },
      guide: { type: 'boolean', default: false }, help: { type: 'boolean', default: false },
    },
  });
}

// --- Guidage (Lot A, --guide) : attach = skill PUIS persona (scan('skills')/scan('personas'), A5) ;
// detach = persona PUIS un skill DEJA ATTACHE (autorite = frontmatter du persona, symetrique du -).
async function runGuide(mode, values) {
  const root = libraryRoot(values.root);

  if (mode === 'attach') {
    const selSkill = await selectionner({
      items: scan('skills', root).map((e) => ({ id: e.id, label: e.id })),
      titre: 'Skill :', permettreLibre: true, libelleLibre: 'saisir un id de skill',
    });
    if (selSkill.type === 'annule') { console.log('\nRien n\'a ete modifie.\n'); return; }
    const skillId = selSkill.type === 'libre' ? selSkill.valeur : selSkill.item?.id;
    if (!skillId) { console.log('\nRien n\'a ete modifie.\n'); return; }

    const selPersona = await selectionner({
      items: scan('personas', root).map((e) => ({ id: e.id, label: e.id })),
      titre: 'Persona :', permettreLibre: true, libelleLibre: 'saisir un id de persona',
    });
    if (selPersona.type === 'vide' || selPersona.type === 'annule') { console.log('\nRien n\'a ete modifie.\n'); return; }
    const personaId = selPersona.type === 'libre' ? selPersona.valeur : selPersona.item.id;
    if (!personaId) { console.log('\nRien n\'a ete modifie.\n'); return; }

    const suite = [skillId, '--persona', personaId];
    if (values.root) suite.push('--root', values.root);
    const argvNormal = assemblerArgv(suite);
    console.log(ligneEquivalente(['attach', ...argvNormal]));
    await runAttach(argvNormal);
    return;
  }

  // detach : persona D'ABORD (le skill attache depend d'elle).
  const selPersona = await selectionner({
    items: scan('personas', root).map((e) => ({ id: e.id, label: e.id })),
    titre: 'Persona :', permettreLibre: true, libelleLibre: 'saisir un id de persona',
  });
  if (selPersona.type === 'vide' || selPersona.type === 'annule') { console.log('\nRien n\'a ete modifie.\n'); return; }
  const personaId = selPersona.type === 'libre' ? selPersona.valeur : selPersona.item.id;
  if (!personaId) { console.log('\nRien n\'a ete modifie.\n'); return; }

  const persona = readEntry('personas', personaId, root);
  const attaches = persona ? readPersonaSkills(persona.path) : [];
  const selSkill = await selectionner({
    items: attaches.map((id) => ({ id, label: id })),
    titre: `Skill attache a ${personaId} :`, permettreLibre: true, libelleLibre: 'saisir un id de skill',
  });
  if (selSkill.type === 'vide') { console.log(`\n${personaId} n'a aucun skill attache : rien a detacher.\n`); return; }
  if (selSkill.type === 'annule') { console.log('\nRien n\'a ete modifie.\n'); return; }
  const skillId = selSkill.type === 'libre' ? selSkill.valeur : selSkill.item.id;
  if (!skillId) { console.log('\nRien n\'a ete modifie.\n'); return; }

  const suite = [skillId, '--persona', personaId];
  if (values.root) suite.push('--root', values.root);
  const argvNormal = assemblerArgv(suite);
  console.log(ligneEquivalente(['detach', ...argvNormal]));
  await runDetach(argvNormal);
}

export async function runAttach(argv) { await run('attach', argv); }
export async function runDetach(argv) { await run('detach', argv); }

async function run(mode, argv) {
  const { values, positionals } = parse(argv);
  if (values.help) { console.log(usage(mode)); return; }
  const json = values.json;

  if (values.guide && peutDemander({ json, guide: true })) {
    await runGuide(mode, values);
    return;
  }

  const [skillId] = positionals;
  const personaId = values.persona;

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
