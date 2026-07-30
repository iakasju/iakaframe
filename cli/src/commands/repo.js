// iakaframe repo - branche (ou cree, avec --create) le depot distant d'un projet git EXISTANT.
//
// Geste PROVIDER-NEUTRE (etage capacite/famille de la hierarchie skill). Ce qui vit ICI : le
// parsing des drapeaux, la GARDE --create, la precondition "depot git", la selection du fournisseur
// et le branchement du remote git. Ce qui vit dans l'ADAPTATEUR (--provider, defaut forgejo) : le
// POST de creation, le test d'existence, le pattern d'URL. Le nom 'forgejo' n'apparait qu'a l'etage
// adaptateur (valeur de --provider), JAMAIS comme nom de geste (cf. F10 : aucun case 'forgejo').
//
// SURETE (issue du lot cb2a9b9, identique et non negociable) : SANS --create, ce verbe n'emet
// JAMAIS de POST de creation, quel que soit le provider. Il se limite a un test d'existence (lecture
// seule) + une configuration de remote LOCALE. Depot inexistant sans --create -> REFUS (exit != 0),
// jamais de creation par effet de bord. La garde vit a l'etage neutre -> elle protege d'avance TOUT
// provider futur.
import { parseArgs } from 'node:util';
import path from 'node:path';
import { isRepo, run, hasRemoteOrigin } from '../lib/git.js';
import { resolveAdapter } from '../lib/providers.js';

const USAGE = `Usage : iakaframe repo [<nom>] [options]

Branche (ou cree, avec --create) le remote d'un depot git EXISTANT. Geste
provider-neutre. Sans --create : test d'existence (lecture seule) + remote LOCAL
seulement, jamais de creation par effet de bord.

Arguments :
  <nom>              Nom du depot distant (defaut : --repo, sinon nom du dossier)

Options :
  --repo <nom>       Nom du depot distant (alternative au positionnel)
  --path <dir>       Racine du depot git (defaut : dossier courant)
  --provider <nom>   Fournisseur (defaut : forgejo)
  --create           REQUIS pour creer le depot distant (sinon refus si absent)
  --description <txt> Description ASCII du depot (n'a de sens qu'avec --create)`;

export async function runRepo(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      repo: { type: 'string' },
      path: { type: 'string' },
      provider: { type: 'string', default: 'forgejo' }, // seul adaptateur code en MVP
      create: { type: 'boolean', default: false },      // le SEUL drapeau qui autorise la creation
      description: { type: 'string', default: '' },      // n'a de sens qu'avec --create
      help: { type: 'boolean', default: false },
    },
  });
  if (values.help) { console.log(USAGE); return; }
  const root = path.resolve(values.path || process.cwd());
  const repo = values.repo || positionals[0] || path.basename(root);

  // PRECONDITION : ce verbe ne s'occupe que du remote d'un depot git DEJA present. Il n'INITIALISE
  // jamais (c'est l'onboarding). Pas un depot git -> REFUS vers onboard.
  if (!isRepo(root)) {
    console.error(`REFUS : '${root}' n'est pas un depot git.`);
    console.error(`  Ce verbe branche/cree le remote d'un depot EXISTANT ; il n'initialise jamais.`);
    console.error(`  Pour amorcer un projet : iakaframe onboard --path ${root}`);
    process.exitCode = 1; return;
  }

  // SELECTION DU FOURNISSEUR (etage neutre) : provider inconnu -> erreur nette, AUCUNE action
  // distante (on n'a meme pas encore teste l'existence). C'est le point d'extension non hacke.
  let adapter;
  try {
    adapter = await resolveAdapter(values.provider);
  } catch (e) {
    console.error(`REFUS : ${e.message}`);
    process.exitCode = 1; return;
  }

  // TEST D'EXISTENCE (lecture seule, non destructif) : true (existe) | false (404) | null (inconnu).
  const exists = await adapter.existe(repo);

  // LA GARDE --create : sans elle, la creation serait un EFFET DE BORD -> refus (headless ou non).
  if (exists !== true && !values.create) {
    if (exists === false) {
      console.error(`REFUS : le depot distant '${repo}' n'existe pas (fournisseur : ${adapter.name}).`);
      console.error(`  Aucun depot cree. Pour le creer explicitement : iakaframe repo ${repo} --create`);
    } else {
      console.error(`REFUS : etat du depot '${repo}' inconnu (token absent ou serveur injoignable) ; aucune action.`);
    }
    process.exitCode = 1; return;
  }

  // A ce stade : soit le depot existe (branchement pur), soit --create est pose (creation autorisee).
  if (exists === true) {
    console.log(`= depot distant '${repo}' existe deja (fournisseur : ${adapter.name}) -> branchement du remote.`);
  } else {
    // --create explicite : la creation EST la demande (analogue onboard direct, passe headless).
    // Un etat null ferait lever l'adaptateur (token/reseau) -> REFUS ci-dessous, aucun depot cree.
    let st;
    try {
      st = await adapter.creer(repo, values.description, true);
    } catch (e) {
      console.error(`ECHEC : creation du depot '${repo}' impossible (${e.message}). Aucun remote configure.`);
      process.exitCode = 1; return;
    }
    console.log(st === 'exists'
      ? `= depot deja existant (409) -> on continue (fournisseur : ${adapter.name}).`
      : `+ depot '${repo}' cree (fournisseur : ${adapter.name}).`);
  }

  // BRANCHEMENT DU REMOTE (geste git LOCAL, non-destructif) : mirroir onboard.js:108-110.
  const url = adapter.urlRemote(repo);
  if (hasRemoteOrigin(root)) run(root, ['remote', 'set-url', 'origin', url]);
  else run(root, ['remote', 'add', 'origin', url]);
  console.log(`+ remote 'origin' configure (token masque).`);
}
