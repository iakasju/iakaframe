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
import { balayer, ligneRappel, rendreBloc } from '../lib/branches-locales.js';

const USAGE = `Usage : iakaframe range <all|projet> [options]   (alias : iaka range ...)

Sauvegarde le portefeuille dans le depot restic chiffre. SUR COMMANDE — rien n'est planifie.

  range all              Tout le dossier chapeau, SECRETS COMPRIS, sans aucune exclusion
  range <projet>         Ce projet seul (un nom inconnu est REFUSE, jamais un repli sur "all")
  range --list           Liste les projets sauvegardables du chapeau
  range --branches       BALAYAGE SEUL : dit quelles branches locales n'ont aucune copie
                         distante, sans lancer restic (lecture seule, sort en 0)

Options :
  --root <dir>              Force le chapeau (sinon IAKAFRAME_ROOT, sinon ~/work)
  --repository <url>        Depot restic       (sinon IAKA_RANGE_REPOSITORY, sinon le defaut)
  --password-command <cmd>  Commande qui REND le mot de passe sur sa sortie standard
                            (sinon IAKA_RANGE_PASSWORD_COMMAND, sinon le defaut)
  --exclude-file <fichier>  Fichier d'exclusion (defaut : config/sauvegarde-exclusions.txt, VIDE)
  --branches                Balayage seul, sans restic (perimetre : "all" par defaut)
  --dry-run                 Parcourt et compte sans rien ecrire dans le depot
  --json                    Sortie machine

Toute sauvegarde annonce les BRANCHES SANS COPIE DISTANTE avant de lancer restic, et le rappelle
apres le OK final. Ce signalement n'est JAMAIS bloquant : faire echouer une sauvegarde parce
qu'une branche n'est pas poussee aggraverait le probleme qu'il traite. Motifs a ecarter :
config/sauvegarde-branches-ignorees.txt (vide par defaut ; ecarter n'est jamais taire).

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
      branches: { type: 'boolean', default: false },
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
  // Aucun perimetre par defaut pour SAUVEGARDER (famille CTRL-1). Seule exception : `--branches`,
  // qui est un BALAYAGE EN LECTURE SEULE — il ne peut rien ecrire, ni dans un dossier, ni dans un
  // depot restic (il ne lance pas restic). Son defaut « all » est donc sans consequence, et c'est
  // la forme de recette du signalement.
  if (!cible && !values.branches) return fail(json, USAGE);

  let perimetre;
  try { perimetre = resoudrePerimetre(cible || 'all', root); }
  catch (e) { return fail(json, e.message, { cible, root }); }

  // 🛑 LE BALAYAGE EST FAIT AVANT RESTIC, ET C'EST DELIBERE (`DD-2`) : la sortie de restic est
  // HERITEE et dure plusieurs minutes sur une premiere passe ; un signal place apres serait noye.
  const scan = balayer(perimetre, { root });
  const champsScan = {
    branchesSansCopieDistante: scan.branchesSansCopieDistante,
    branchesSansCopieDistanteCount: scan.branchesSansCopieDistanteCount,
    scanBranches: scan.scanBranches,
  };

  // `--branches` : le balayage SEUL. Ne lance pas restic, ne touche a aucun depot de sauvegarde,
  // sort en 0. C'est le seul chemin de recette du signalement au niveau CLI qui ne PUISSE PAS
  // ecrire dans un depot restic (parade heritee de l'incident du 2026-08-15).
  if (values.branches) {
    return emit(json, ok({
      portee: perimetre.portee, projet: perimetre.projet, chemin: perimetre.chemin, ...champsScan,
    }), () => {
      console.log(`range --branches ${perimetre.portee === 'all' ? 'all' : perimetre.projet} (balayage seul, aucune sauvegarde lancee)`);
      console.log(`  chemin      : ${perimetre.chemin}`);
      console.log('');
      for (const l of rendreBloc(scan)) console.log(l);
    });
  }

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
    for (const l of rendreBloc(scan)) console.log(l);
    console.log('');
  }

  let r;
  try { r = lancerSauvegarde(perimetre, opts); }
  // 🛑 Le signalement voyage AUSSI dans la charge d'echec (`DD-7`) : une information perdue quand
  // restic rate serait perdue au pire moment.
  catch (e) { return fail(json, e.message, { cible, root, ...champsScan }); }

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
    ...champsScan,
  };

  if (r.code !== 0) {
    return fail(json, `restic a echoue (code ${r.code})${r.stderr ? ` : ${r.stderr}` : ''}`, payload);
  }
  return emit(json, ok(payload), () => {
    console.log(`\nOK — sauvegarde ${perimetre.portee === 'all' ? 'globale' : `de ${perimetre.projet}`} en ${(r.dureeMs / 1000).toFixed(1)} s`);
    // Rappel APRES le OK : UNE ligne, le compteur — pas la liste (`DD-3`). Deux emplacements,
    // deux formes : ni bloquant, ni noye.
    console.log(`  ${ligneRappel(scan)}`);
  });
}
