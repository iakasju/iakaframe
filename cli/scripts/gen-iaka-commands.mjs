#!/usr/bin/env node
// Genere les entrees `iaka-<verbe>.md` MANQUANTES depuis lib/verbes.js (Lot B, source unique —
// specs/instructions/cli-mode-guide-selections.md § LOT B). Chaque fichier est un AIGUILLEUR
// (calque de kits/iakaframe-claude/.claude/commands/iaka-list.md) : il execute
// `iakaframe <verbe> $ARGUMENTS` et restitue la sortie VERBATIM — jamais un backend.
//
// COUVERTURE : seuls les verbes marques `guideClaudeCode.generer:true` dans le registre recoivent
// une entree. Un verbe non genere PORTE TOUJOURS un motif explicite (`guideClaudeCode.motif`) —
// jamais une exclusion silencieuse (meme discipline que le registre de corpus D-3/D-5 de ce depot,
// cf. cli/package.json:24). Cible : kits/iakaframe-claude/.claude/commands/ (LE KIT, jamais
// ~/.claude/commands/ — le deploiement est un geste existant, cf. `iakaframe init`/`skills deploy`).
//
// Les 10 entrees deja presentes AVANT ce lot (iaka-list.md, iaka-brief.md, iaka-recap.md,
// iaka-services.md, iaka-update.md, et les 5 invocateurs de skill iaka-cadre/deploie/etat/qualite/
// help.md) sont HAND-AUTHORED : leurs verbes portent `generer:false` dans le registre (motif
// « deja couvert par ... ») — ce generateur ne les touche donc JAMAIS, meme en re-execution.
//
// Fichiers GENERES (verbes `generer:true`) : le generateur est AUTORITAIRE dessus (regenere a
// chaque execution, en-tete `NE PAS EDITER A LA MAIN`) — c'est ce qui empeche leur description de
// perimer quand `resume` change dans le registre (meme motif que gen-models-doc.mjs).
//
// Usage : node cli/scripts/gen-iaka-commands.mjs [--check]
//   --check : n'ecrit rien ; sort 1 si un fichier genere manque ou differe de la regeneration.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERBES, resumeOf } from '../src/lib/verbes.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const OUT_DIR = path.join(ROOT, 'kits', 'iakaframe-claude', '.claude', 'commands');

const CHECK = process.argv.includes('--check');

function isEcriture(v) {
  return v.ecriture === true;
}

function contenu(v) {
  const desc = resumeOf(v).replace(/\s+/g, ' ').trim();
  const noteEcriture = isEcriture(v)
    ? "Commande d'ÉCRITURE : respecte scrupuleusement les gardes du CLI (refus affichés tels\nquels, jamais contournés) — ne compose **jamais** `--force`/`--yes`/`--cascade` à la place de\nl'utilisateur."
    : 'Commande **lecture seule** : n\'écrit rien, ne mute rien.';
  return `---
description: ${desc}
---

<!-- GENERE par cli/scripts/gen-iaka-commands.mjs depuis cli/src/lib/verbes.js (verbe \`${v.id}\`).
     NE PAS EDITER A LA MAIN : la description derive de \`resume\`, regenerer via le script. -->

Affiche d'abord la ligne **\`→ iakaframe ${v.id} $ARGUMENTS\`** (la commande effectivement
exécutée), **PUIS** exécute **\`iakaframe ${v.id} $ARGUMENTS\`** et **restitue la sortie VERBATIM**
(aucune reformulation). ${noteEcriture}

$ARGUMENTS
`;
}

function main() {
  const candidats = VERBES.filter(v => v.guideClaudeCode && v.guideClaudeCode.generer === true);
  const manquants = VERBES.filter(v => !v.guideClaudeCode || (v.guideClaudeCode.generer !== true && v.guideClaudeCode.generer !== false));
  if (manquants.length) {
    console.error(`refus : ${manquants.length} verbe(s) sans decision guideClaudeCode.generer explicite : ${manquants.map(v => v.id).join(', ')}`);
    process.exit(1);
  }
  const hors = VERBES.filter(v => v.guideClaudeCode.generer === false && !v.guideClaudeCode.motif);
  if (hors.length) {
    console.error(`refus : ${hors.length} verbe(s) hors couverture SANS motif : ${hors.map(v => v.id).join(', ')}`);
    process.exit(1);
  }

  let ecrits = 0, driftes = [];
  for (const v of candidats) {
    const dest = path.join(OUT_DIR, `iaka-${v.id}.md`);
    const attendu = contenu(v);
    const existe = fs.existsSync(dest);
    const actuel = existe ? fs.readFileSync(dest, 'utf8') : null;
    if (actuel === attendu) continue;
    if (CHECK) { driftes.push(v.id); continue; }
    fs.writeFileSync(dest, attendu);
    ecrits++;
    console.log(`  ${existe ? '~' : '+'} kits/iakaframe-claude/.claude/commands/iaka-${v.id}.md`);
  }

  if (CHECK) {
    if (driftes.length) {
      console.error(`DERIVE : ${driftes.length} fichier(s) a regenerer (node cli/scripts/gen-iaka-commands.mjs) : ${driftes.join(', ')}`);
      process.exit(1);
    }
    console.log(`OK : ${candidats.length} entree(s) iaka-*.md a jour avec le registre.`);
    return;
  }
  console.log(`gen-iaka-commands : ${candidats.length} verbe(s) couverts, ${ecrits} fichier(s) (re)ecrits -> ${OUT_DIR}`);
}

main();
