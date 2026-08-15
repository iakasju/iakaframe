// iakaframe range — sauvegarde du portefeuille, SUR COMMANDE UNIQUEMENT.
// Instruction : specs/instructions/sauvegarde-portefeuille.md (lot 1).
//
// 🛑 AUCUNE PLANIFICATION ICI, ET C'EST DELIBERE. Le decideur a tranche « sur commande » pour ce
// lot ; l'hebdomadaire et le veilleur d'ABSENCE (le dispositif qui crie quand rien ne se passe)
// sont un lot ulterieur. Tant qu'ils n'existent pas, ce verbe ne protege que de ce qu'on lui
// demande : si personne ne le lance, RIEN NE SE PASSE ET PERSONNE N'EST PREVENU.
//
// Ce verbe n'appelle jamais `forget` ni `prune` : il ecrit, il ne supprime pas.
import { parseArgs } from 'node:util';
import { collection, emit, fail, ok } from '../lib/output.js';
import { resolveRoot } from '../lib/root.js';
import {
  DEFAULT_PASSWORD_COMMAND, DEFAULT_REPOSITORY,
  defaultExcludeFile, lancerSauvegarde, listerProjets, resoudrePerimetre,
} from '../lib/range.js';

const USAGE = `Usage : iakaframe range <all|projet> [options]   (alias : iaka range ...)

Sauvegarde le portefeuille dans le depot restic chiffre. SUR COMMANDE — rien n'est planifie.

  range all              Tout le dossier chapeau, SECRETS COMPRIS, sans aucune exclusion
  range <projet>         Ce projet seul (un nom inconnu est REFUSE, jamais un repli sur "all")
  range --list           Liste les projets sauvegardables du chapeau

Options :
  --root <dir>              Force le chapeau (sinon IAKAFRAME_ROOT, sinon ~/work)
  --repository <url>        Depot restic       (sinon IAKA_RANGE_REPOSITORY, sinon le defaut)
  --password-command <cmd>  Commande qui REND le mot de passe sur sa sortie standard
                            (sinon IAKA_RANGE_PASSWORD_COMMAND, sinon le defaut)
  --exclude-file <fichier>  Fichier d'exclusion (defaut : config/sauvegarde-exclusions.txt, VIDE)
  --dry-run                 Parcourt et compte sans rien ecrire dans le depot
  --json                    Sortie machine

Le mot de passe n'est JAMAIS un argument : il est lu sur la sortie d'une commande, donc il
n'apparait ni dans la table des processus, ni dans les logs, ni dans un fichier de ce depot.`;

export function runRange(argv) {
  const { values, positionals } = parseArgs({
    args: argv, allowPositionals: true,
    options: {
      root: { type: 'string' },
      repository: { type: 'string' },
      'password-command': { type: 'string' },
      'exclude-file': { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
      list: { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
    },
  });
  const json = values.json;
  const root = resolveRoot(values.root);

  if (values.list) {
    const projets = listerProjets(root);
    return emit(json, collection('projets', projets, { root }), () => {
      console.log(projets.length ? projets.join('\n') : '(aucun projet)');
      console.log(`\n${projets.length} projet(s) sous ${root}`);
    });
  }

  const cible = positionals[0];
  if (!cible) return fail(json, USAGE);

  let perimetre;
  try { perimetre = resoudrePerimetre(cible, root); }
  catch (e) { return fail(json, e.message, { cible, root }); }

  const opts = {
    repository: values.repository || process.env.IAKA_RANGE_REPOSITORY || DEFAULT_REPOSITORY,
    passwordCommand: values['password-command'] || process.env.IAKA_RANGE_PASSWORD_COMMAND || DEFAULT_PASSWORD_COMMAND,
    excludeFile: values['exclude-file'] || defaultExcludeFile(),
    dryRun: values['dry-run'],
    json,
  };

  if (!json) {
    console.log(`range ${perimetre.portee === 'all' ? 'all' : perimetre.projet} -> ${opts.repository}`);
    console.log(`  chemin      : ${perimetre.chemin}`);
    console.log(`  etiquettes  : ${perimetre.tags.join(' ')}`);
    console.log(`  exclusions  : ${opts.excludeFile}`);
    if (opts.dryRun) console.log('  MODE SIMULATION : rien ne sera ecrit dans le depot');
    console.log('');
  }

  let r;
  try { r = lancerSauvegarde(perimetre, opts); }
  catch (e) { return fail(json, e.message, { cible, root }); }

  const payload = {
    portee: perimetre.portee,
    projet: perimetre.projet,
    chemin: perimetre.chemin,
    tags: perimetre.tags,
    repository: opts.repository,
    excludeFile: opts.excludeFile,
    dryRun: opts.dryRun,
    dureeMs: r.dureeMs,
    code: r.code,
    resume: r.resume,
  };

  if (r.code !== 0) {
    return fail(json, `restic a echoue (code ${r.code})${r.stderr ? ` : ${r.stderr}` : ''}`, payload);
  }
  return emit(json, ok(payload), () => {
    console.log(`\nOK — sauvegarde ${perimetre.portee === 'all' ? 'globale' : `de ${perimetre.projet}`} en ${(r.dureeMs / 1000).toFixed(1)} s`);
  });
}
