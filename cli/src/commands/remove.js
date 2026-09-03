// iakaframe remove <team|method|binding|skill> <id> — le `-` symetrique de `add` (ligne E) + la
// de-materialisation d'un skill (ligne B) (instruction symetrie-ajout-suppression.md, S3/S4).
//
// Posture « retrait sur » (S1) :
//   - RESTRICT par defaut (Q-2) : un element encore reference n'est PAS retire ; on liste les
//     referents (findReferrers, inverse de checkRefs) et on refuse sans rien toucher.
//   - CASCADE explicite seulement (jamais silencieuse) : `--cascade` PLUS confirmation `--yes`.
//       * team|method|binding : la cascade archive AUSSI les referents (bindings/kits) en corbeille.
//       * skill : la cascade DETACHE le skill de chaque persona referent (mute leur skills:[]) puis
//         de-materialise le dossier — on ne supprime jamais un persona.
//   - Non destructif (Q-6) : tout artefact retire est DEPLACE en corbeille <root>/.trash-<ts>/,
//     restaurable, avec trace (manifest.json). Jamais de suppression seche.
import path from 'node:path';
import { parseArgs } from 'node:util';
import { libraryRoot, readEntry, pathFor, scan } from '../lib/library.js';
import {
  findReferrers, makeTrash, moveToTrash, writeTrashManifest,
  readPersonaSkills, setPersonaSkills,
} from '../lib/remove.js';
import { emit, fail } from '../lib/output.js';

const KIND_TO_TYPE = { team: 'teams', method: 'methods', binding: 'bindings', skill: 'skills' };
const KINDS = Object.keys(KIND_TO_TYPE);

export function runRemove(argv) {
  const { values, positionals } = parseArgs({
    args: argv, allowPositionals: true,
    options: {
      root: { type: 'string' }, cascade: { type: 'boolean', default: false },
      yes: { type: 'boolean', default: false }, json: { type: 'boolean', default: false },
    },
  });
  const [kind, id] = positionals;
  const json = values.json;

  if (!kind || !KINDS.includes(kind) || !id) {
    fail(json, `Usage : iakaframe remove <${KINDS.join('|')}> <id>  [--cascade --yes] [--json]`); return;
  }

  const root = libraryRoot(values.root);
  const type = KIND_TO_TYPE[kind];
  const entry = readEntry(type, id, root);
  if (!entry) {
    // Palier 0 (Lot A, refus loquace) : les ids valides sont DERIVES de scan() (source unique),
    // jamais recopies a la main.
    const ids = scan(type, root).map((e) => e.id);
    const msg = `${kind} introuvable : ${id}` + (ids.length ? ` — ids valides : ${ids.join(', ')}.` : ` — aucun ${kind} dans la bibliotheque.`);
    fail(json, msg, { kind, id, idsValides: ids }, () => console.error(msg));
    return;
  }

  const referrers = findReferrers(type, id, root);

  // RESTRICT : refuse par defaut si encore reference.
  if (referrers.length && !values.cascade) {
    fail(json, `${kind} ${id} est encore référencé (RESTRICT) — rien retiré.`,
      { reason: 'restrict', kind, id, referrers }, () => {
        console.error(`Refus (RESTRICT) : ${kind} ${id} est encore référencé — rien retiré.`);
        for (const r of referrers) console.error(`  ! référent : ${r.type} ${r.id} (champ ${r.field})`);
        if (kind === 'skill') console.error(`  → détache d'abord : iakaframe detach ${id} --persona <personaId>`);
        else console.error(`  → --cascade --yes pour retirer aussi les référents (geste explicite).`);
      });
    return;
  }

  // CASCADE demandee mais NON confirmee : on montre le plan et on exige --yes.
  if (referrers.length && values.cascade && !values.yes) {
    fail(json, `Confirmation requise : la cascade va ${kind === 'skill' ? 'détacher' : 'archiver'} ${referrers.length} référent(s).`,
      { reason: 'confirm-required', kind, id, referrers }, () => {
        console.error(`Confirmation requise : la cascade va ${kind === 'skill' ? 'détacher' : 'archiver'} ${referrers.length} référent(s) :`);
        for (const r of referrers) console.error(`  - ${r.type} ${r.id} (champ ${r.field})`);
        console.error('  → relancez avec --yes pour confirmer.');
      });
    return;
  }

  // --- Retrait effectif (non destructif) ---
  const ts = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  const trashDir = makeTrash(root, ts);
  const trashed = [];
  const detached = [];

  if (referrers.length && values.cascade && values.yes) {
    if (kind === 'skill') {
      // Cascade skill : detacher de chaque persona referent (jamais supprimer un persona).
      for (const r of referrers) {
        if (r.type !== 'personas') continue;
        const p = readEntry('personas', r.id, root);
        if (!p) continue;
        setPersonaSkills(p.path, readPersonaSkills(p.path).filter((s) => s !== id));
        detached.push(r.id);
      }
    } else {
      // Cascade team|method|binding : archiver les referents (bindings/kits) en corbeille.
      for (const r of referrers) {
        const rp = pathFor(r.type, r.id, root);
        if (!rp) continue;
        const item = moveToTrash(root, rp, trashDir);
        trashed.push({ type: r.type, id: r.id, rel: item.rel });
      }
    }
  }

  // Cible : pour un skill, on archive le DOSSIER library/skills/<id>/ ; sinon le fichier .md.
  const targetPath = type === 'skills' ? path.dirname(entry.path) : entry.path;
  const item = moveToTrash(root, targetPath, trashDir);
  trashed.push({ type, id, rel: item.rel });

  const manifest = writeTrashManifest(trashDir, {
    at: new Date().toISOString(), kind, id, trashed, detached,
  });

  const report = { ok: true, kind, id, trash: trashDir, trashed, detached, manifest };
  emit(json, report, () => {
    console.log(`− ${kind} ${id} retiré (archivé dans ${trashDir})`);
    for (const d of detached) console.log(`  ↳ détaché de ${d} (skills:[] mis à jour)`);
    for (const t of trashed) if (!(t.type === type && t.id === id)) console.log(`  ↳ référent archivé : ${t.type} ${t.id}`);
    console.log(`  trace : ${manifest}  (restaurable)`);
  });
}
