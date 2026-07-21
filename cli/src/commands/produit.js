// iakaframe produit - outil du CANON PROJET (lot A). La connaissance INCREMENTALE du produit vit
// DANS le projet : <projet>/specs/canon/PRODUIT.md, VERSIONNE et pousse. Substrat neutre, zero dep.
// Reference : specs/instructions/canon-projet-connaissance-produit.md.
//
// Le canon global apprend *qui est le decideur* (`iakaframe memory`), le canon projet apprend *ce
// qu'est le produit* (`iakaframe produit`). Deux axes du meme moteur, deux stores ETANCHES : un
// fait sur le decideur va au canon GLOBAL, jamais ici.
//
// SYMETRIE AJOUT/SUPPRESSION : tout ce qui s'ajoute par `add` se retire par `remove`, et `replace`
// revise EN PLACE (c'est la promesse du lot : ni un instantane qui ecrase, ni une main courante qui
// empile).
import { parseArgs } from 'node:util';
import fs from 'node:fs';
import {
  projectCanonHome, ensureProjectCanon, projectCanonExists, loadProjectConfig, produitCap,
  produitAdd, produitReplace, produitRemove, produitList, produitPath, measure,
} from '../lib/projectCanon.js';
import { collection, emit, fail, ok } from '../lib/output.js';

const USAGE = `Usage : iakaframe produit <action> [options]

Canon PROJET : ce qu'on a APPRIS du produit (constat de terrain), revise EN PLACE.
Vit dans <projet>/specs/canon/PRODUIT.md — versionne, revu en diff, pousse.

Actions :
  init                          Cree specs/canon/PRODUIT.md (non destructif) — et rien d'autre
  path                          Affiche le chemin du canon projet resolu
  config                        Affiche le plafond resolu
  list                          Liste les entrees du canon produit
  add <texte>                   Ajoute une entree datee (idempotent) ; refuse si plafond depasse
  replace <ancien> <nouveau>    REVISE une entree EN PLACE et la re-date (le cœur du lot)
  remove <texte>                Retire une entree (idempotent) — le \`-\` de \`add\`

Options :
  --project <dir>  Racine du projet (defaut : repertoire courant)
  --json           Sortie machine

Note : ces mutations sont le geste HUMAIN. La cloture (pause|version) n'ecrit JAMAIS ici
d'elle-meme : elle depose des propositions revues via \`iakaframe review\` (canon versionne
-> garde de consentement plus stricte que celle du canon global).`;

export function runProduit(argv) {
  let values, positionals;
  try {
    ({ values, positionals } = parseArgs({
      args: argv, allowPositionals: true,
      options: { project: { type: 'string' }, json: { type: 'boolean', default: false } },
    }));
  } catch (e) { return fail(false, e.message); }
  const [action, ...rest] = positionals;
  const json = values.json;

  let home;
  try { home = projectCanonHome(values.project || process.cwd()); }
  catch (e) { return fail(json, e.message); }

  switch (action) {
    case 'init': {
      const created = ensureProjectCanon(home);
      emit(json, collection('created', created, { home }), () => console.log(
        `Canon produit prêt : ${produitPath(home)}` +
        `${created.length ? `\n  + ${created.length} élément(s) créé(s)` : ' (déjà en place)'}`));
      break;
    }
    case 'path': {
      emit(json, ok({ home, file: produitPath(home), exists: projectCanonExists(home) }),
        () => console.log(produitPath(home)));
      break;
    }
    case 'config': {
      const cfg = loadProjectConfig(home);
      emit(json, ok({ home, config: cfg, cap: produitCap(cfg) }), () => console.log(
        `Canon produit (${produitPath(home)}) :\n` +
        `  plafond       : PRODUIT ≤ ${produitCap(cfg)} caractères\n` +
        `  consolidation : ${Math.round(cfg.consolidation_threshold * 100)} %`));
      break;
    }
    case 'list': {
      const entries = projectCanonExists(home) ? produitList(home) : [];
      emit(json, collection('entries', entries, { home }),
        () => console.log(entries.map((e) => `- ${e}`).join('\n') || '(aucune entrée)'));
      break;
    }
    case 'add': {
      if (!rest.length) return fail(json, USAGE);
      run(() => produitAdd(home, rest.join(' ')), home, json);
      break;
    }
    case 'replace': {
      const [oldC, ...newC] = rest;
      if (!oldC || !newC.length) return fail(json, USAGE);
      run(() => produitReplace(home, oldC, newC.join(' ')), home, json);
      break;
    }
    case 'remove': {
      if (!rest.length) return fail(json, USAGE);
      run(() => produitRemove(home, rest.join(' ')), home, json);
      break;
    }
    default:
      fail(json, USAGE);
  }
}

// Execute une mutation et rend le rapport (humain ou JSON). Sort en erreur si refus.
function run(fn, home, json) {
  let report;
  try { report = fn(); }
  catch (e) { return fail(json, e.message); }

  emit(json, report, () => {
    if (!report.ok && report.reason === 'cap-exceeded') {
      console.error(`Refus (plafond dépassé) : PRODUIT atteindrait ${report.length}/${report.cap} caractères.`);
      console.error('  → consolidation requise : c\'est le plafond qui FORCE la révision (sinon on retombe');
      console.error('    sur la main courante). Fusionner des entrées via `produit replace`.');
    } else if (!report.ok && report.reason === 'not-found') {
      console.error(`Entrée introuvable dans PRODUIT.md : « ${report.match} » (rien remplacé).`);
      console.error('  → `iakaframe produit list` pour le contenu exact des entrées.');
    } else {
      const bytes = measure(fs.readFileSync(produitPath(home), 'utf8'));
      const flag = report.consolidationNeeded ? '  ⚠ consolidation conseillée (≥ 80 % du plafond)' : '';
      const verb = report.action === 'add' ? 'ajout'
        : report.action === 'replace' ? 'révision en place' : 'retrait';
      console.log(`${report.changed ? 'OK' : 'no-op'} — ${verb} sur PRODUIT (${bytes}/${report.cap} car.)${flag}`);
    }
  });
  if (!report.ok) process.exitCode = 1;
}
