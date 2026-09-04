// iakaframe install — le verbe de la CHAINE COMPLETE (specs/instructions/
// chaine-complete-install-amorcage-dmg-msi.md, lot A). Etapes 1 et 2 SEULEMENT (CLI + methode) :
// les etapes 3 (IakaCockpit) et 4 (iakaFrameGUI) sont HORS PERIMETRE de ce lot (lot C.1, a venir)
// et se refusent EXPLICITEMENT — jamais simulees.
//
// AR-A (comptage) : l'interface annonce TOUJOURS « 4 etapes / 3 telechargements », meme si seules
// les etapes 1-2 sont fonctionnelles ici — fusionner CLI+methode serait interdit par AR-4 (§ 2 de
// l'instruction : un consentement donne pour /usr/local/lib ne couvre pas une ecriture dans
// ~/.claude).
//
// AR-G(a) : l'etape 1 jouee PAR CE VERBE n'a QU'UN sens — « mise a jour du CLI » — puisqu'il faut
// deja avoir le CLI pour l'invoquer (« le CLI ne peut pas s'installer lui-meme »). Le sens
// « vraie premiere installation » appartient a l'app d'installation (lot C.2, hors perimetre),
// jamais a ce verbe : AUCUN message d'ici ne doit dire « installe » quand il « met a jour ».
//
// Ce qui GOUVERNE l'etape 1 (correction du 2026-09-04, second gate qualite — le premier
// commentaire de cet en-tete citait « AR-F » pour une regle qui n'y est pas : R11, un commentaire
// n'est pas un constat) : le principe HERITE et NON ROUVERT d'AR-2(c) du cadrage PARENT
// (bundle-complet-install-4-composants.md § 4.0) — verbatim « le plus recent gagne » (vivant vs
// embarque, PAR COMPARAISON DE VERSION). Concretement : reservoir.js (AR-F du cadrage COURANT)
// tranche l'egalite ENTRE DEUX SOURCES LOCALES (vivant/embarque) — ni AR-F ni AR-H ne parlent du
// reseau. C'est AR-2(c) qui impose la comparaison, et une comparaison ne peut conclure « a jour »
// qu'APRES avoir consulte tout ce qui pourrait etre plus recent : le reservoir local (AR-F), PUIS
// — si le local ne fournit aucune mise a jour stricte — les sources reseau ORDONNEES d'AR-H
// (tarball GitHub = voie publique, registre npm NAS = voie LAN). Le CLI DIT laquelle a repondu.
import { parseArgs } from 'node:util';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { resoudreReservoir } from '../lib/reservoir.js';
import { verifierAutoDeploiement } from '../lib/autodeploi.js';
import { packageVersion } from '../lib/version.js';
import { peutDemander, askYesNo } from '../lib/interactif.js';
import { getJson } from '../lib/http.js';

const USAGE = `Usage : iakaframe install [options]

La chaine complete d'installation (4 etapes / 3 telechargements, AR-A) : CLI - methode -
IakaCockpit - iakaFrameGUI. CE LOT ne joue que les etapes 1 et 2 (CLI + methode) ; les
etapes 3 et 4 refusent explicitement (lot C.1, a venir).

Options :
  --dry-run              Decrit les 4 etapes SANS RIEN ECRIRE (empreinte disque avant/apres identique)
  --yes                  Saute TOUTES les validations par etape (AR-4) — jamais une partie
  --root <dir>           Epingle un reservoir vivant precis (sinon <chapeau>/iakaframe)
  --hosts <a,b>          Hotes de l'etape 2 (defaut : claude — cf. install.mjs pour codex/openwebui)
  --target-claude <dir>  Cible de l'etape 2 pour l'hote claude (defaut : ~/.claude)
  --backup-dir <dir>     Sauvegarde horodatee de l'etape 2 (passe a install.mjs, AR-5)
  --json                 Sortie machine (desactive les confirmations interactives)`;

// --- Confirmation par etape (AR-4) --------------------------------------------------------------
// `--yes` saute TOUJOURS ; sinon confirmation interactive si le terminal le permet, REFUS par
// defaut en non-interactif (le sur, jamais le suppose). `askYesNo` est le prompt UNIQUE (G3b,
// cli/test/guard-guidage-autorite.test.js) : reutilise depuis lib/interactif.js, jamais recree ici.
export async function confirmerEtape({ yes, json, question }) {
  if (yes) return true;
  const interactive = peutDemander({ json: Boolean(json), guide: true });
  if (!interactive) return false;
  return askYesNo(question);
}

// --- AR-A : les 4 etapes, toujours annoncees ------------------------------------------------
export const ETAPES = [
  { n: 1, nom: 'CLI', telecharge: true },
  { n: 2, nom: 'méthode', telecharge: false },
  { n: 3, nom: 'IakaCockpit', telecharge: true },
  { n: 4, nom: 'iakaFrameGUI', telecharge: true },
];

export function bannierEtapes() {
  const lignes = ETAPES.map(e => `  [${e.n}/4] ${e.nom}${e.telecharge ? ' (téléchargement)' : ''}`);
  return [
    '4 étapes / 3 téléchargements (AR-A) :',
    ...lignes,
    '',
  ].join('\n');
}

// --- AR-H : sources RESEAU ordonnees ------------------------------------------------------------
// Consultees quand le reservoir local (AR-F) ne fournit PAS de mise a jour stricte de la version
// courante — jamais court-circuitees par la seule presence d'un vivant (cf. etape1Cli : un vivant
// PLUS ANCIEN n'a RIEN etabli, la comparaison d'AR-2(c) doit continuer jusqu'au reseau).
export async function sonderGitHubRelease({ fetchJson = getJson } = {}) {
  const res = await fetchJson(
    'https://api.github.com/repos/iakasju/iakaframe/releases/latest', 5000,
    { 'User-Agent': 'iakaframe-cli', Accept: 'application/vnd.github+json' },
  );
  const nom = 'tarball GitHub (voie publique, AR-H)';
  if (!res.ok || !res.body) return { nom, repond: false };
  const version = String(res.body.tag_name || '').replace(/^v/i, '');
  const asset = (Array.isArray(res.body.assets) ? res.body.assets : []).find(a => /\.tgz$/.test(a && a.name || ''));
  if (!version || !asset) return { nom, repond: true, exploitable: false };
  return { nom, repond: true, exploitable: true, version, url: asset.browser_download_url };
}

export async function sonderRegistreNpmNas({ fetchJson = getJson } = {}) {
  const nom = 'registre npm NAS (voie LAN, AR-H)';
  const res = await fetchJson('http://192.168.1.139:3001/api/packages/sjupin/npm/@naonedge%2Fiakaframe', 5000);
  if (!res.ok || !res.body) return { nom, repond: false };
  const version = res.body['dist-tags'] && res.body['dist-tags'].latest;
  if (!version) return { nom, repond: true, exploitable: false };
  return { nom, repond: true, exploitable: true, version, registry: 'http://192.168.1.139:3001/api/packages/sjupin/npm/' };
}

// Essaie les sources DANS L'ORDRE, s'arrete a la premiere EXPLOITABLE, et NOMME chacune —
// jamais un silence sur celles qui ne repondent pas (calque du corpus : canaux.js, endpoints.js).
export async function sourcesOrdonneesCli({ sondes } = {}) {
  const liste = sondes || [sonderGitHubRelease, sonderRegistreNpmNas];
  const essais = [];
  for (const sonde of liste) {
    // eslint-disable-next-line no-await-in-loop
    const r = await sonde();
    essais.push(r);
    if (r.exploitable) return { retenue: r, essais };
  }
  return { retenue: null, essais };
}

function ligneEssais(essais) {
  return essais.map(e => {
    if (!e.repond) return `    - ${e.nom} : injoignable`;
    if (!e.exploitable) return `    - ${e.nom} : répond, mais manifeste inexploitable`;
    return `    - ${e.nom} : répond, v${e.version}`;
  }).join('\n');
}

// --- Etape 1/4 : le CLI (sens UNIQUE ici, AR-G : mise a jour) -----------------------------------
// `sondes`/`execNpmInstall` (optionnels) : point d'INJECTION de test pour `sourcesOrdonneesCli`
// et l'execution de la mise a jour — JAMAIS utilises par l'execution reelle (defaut = les vraies
// sondes reseau / un vrai `npm`), exposes pour que les tests maitrisent le reseau PAR INJECTION,
// jamais en modifiant la logique de production elle-meme (cf. cli/test/etape1-reseau-ecarte.test.js
// et le double de cli/test/install-verbe.test.js, IAKAFRAME_INSTALL_TEST_DOUBLE).
export async function etape1Cli({ reservoir, values, execNpmInstall, sondes }) {
  const courante = packageVersion();
  console.log(`\n[1/4] CLI — mise à jour (poste déjà équipé, AR-G) : version courante v${courante}`);
  console.log(`  ${reservoir.provenance}`);

  let cible = null; // { version, source, comment }
  if (reservoir.vivantPresent && reservoir.vivantVersion && reservoir.source === 'vivant') {
    const cliDir = path.join(reservoir.vivantRoot, 'cli');
    if (compareStr(reservoir.vivantVersion, courante) > 0) {
      cible = { version: reservoir.vivantVersion, from: `réservoir vivant local (${cliDir})`, install: ['npm', ['install', '-g', cliDir]] };
    }
  }
  // AR-2(c) du cadrage PARENT (herite, non rouvert) : « le plus récent gagne, par comparaison de
  // version ». Le reservoir local (AR-F) vient de repondre ci-dessus ; s'il n'a fourni AUCUNE
  // mise a jour stricte — vivant absent, a egalite, OU MEME PLUS ANCIEN que la version courante —
  // la comparaison n'est PAS terminee : elle continue vers les sources reseau ORDONNEES d'AR-H.
  // Un vivant present mais plus ancien n'a RIEN etabli sur ce qui existe ailleurs ; annoncer
  // « déjà à jour » sans avoir consulte le réseau serait une affirmation SANS VERIFICATION —
  // exactement le défaut mesuré par le gate qualité le 2026-09-04 (courant v0.39.0 face à un
  // vivant v0.1.0 : la version précédente de ce fichier se taisait au lieu de comparer).
  let essaisReseau = null;
  if (!cible) {
    const r = await sourcesOrdonneesCli({ sondes });
    essaisReseau = r.essais;
    if (r.retenue && compareStr(r.retenue.version, courante) > 0) {
      const src = r.retenue;
      cible = {
        version: src.version, from: src.nom,
        install: src.url
          ? ['npm', ['install', '-g', src.url]]
          : ['npm', ['install', '-g', '@naonedge/iakaframe', '--registry', src.registry]],
      };
    }
  }

  if (!cible) {
    if (essaisReseau) console.log(`  sources réseau (AR-H) consultées :\n${ligneEssais(essaisReseau)}`);
    console.log(`  déjà à jour (v${courante}) — rien à installer.`);
    return { ok: true, misAJour: false };
  }

  console.log(`  mise à jour disponible : v${courante} → v${cible.version} (source : ${cible.from})`);
  console.log(`  ce qui sera fusionné : remplace le paquet global \`@naonedge/iakaframe\` existant`);
  if (values['dry-run']) {
    console.log('  [dry-run] rien écrit.');
    return { ok: true, misAJour: false, dryRun: true };
  }
  const ok = await confirmerEtape({
    yes: values.yes, json: values.json,
    question: `Mettre à jour le CLI vers v${cible.version} depuis ${cible.from} ? [o/N] `,
  });
  if (!ok) {
    console.log('  REFUS : mise à jour du CLI non confirmée.');
    console.log(`  Reprise : iakaframe install --yes   (ou relancer en interactif)`);
    return { ok: false, misAJour: false };
  }
  const [cmd, args] = cible.install;
  const res = execNpmInstall ? execNpmInstall(cmd, args) : spawnSync(cmd, args, { encoding: 'utf8', stdio: 'inherit' });
  if (res.status !== 0) {
    console.log(`  ÉCHEC : ${cmd} ${args.join(' ')} (code ${res.status}).`);
    console.log(`  Reprise : ${cmd} ${args.join(' ')}`);
    return { ok: false, misAJour: false };
  }
  console.log(`  + CLI mis à jour vers v${cible.version}.`);
  return { ok: true, misAJour: true };
}

function compareStr(a, b) {
  const pa = String(a).split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const da = pa[i] || 0, db = pb[i] || 0;
    if (da !== db) return da > db ? 1 : -1;
  }
  return 0;
}

// --- Etape 2/4 : la methode, par DELEGATION a install.mjs (M4, non reimplemente) ----------------
export async function etape2Methode({ reservoir, values }) {
  console.log(`\n[2/4] méthode — délégation à install.mjs (M4, non réimplémenté)`);
  if (!reservoir.installMjsPath) {
    console.log(`  REFUS : aucun réservoir vivant avec install.mjs (${reservoir.provenance}).`);
    console.log(`  L'embarqué (_bundled/) ne porte PAS d'install.mjs (cli/scripts/bundle.js ne le copie pas) —`);
    console.log(`  impossible de déléguer sans un arbre vivant. Reprise : iakaframe install --root <chemin-vers-un-clone-iakaframe>`);
    return { ok: false };
  }
  const vivantRoot = reservoir.vivantRoot;
  const kitsDir = path.join(vivantRoot, 'kits');
  const hosts = values.hosts || 'claude';
  const targetClaude = values['target-claude'] || path.join(os.homedir(), '.claude');
  console.log(`  quoi : kit(s) hôte(s) [${hosts}] depuis ${kitsDir}`);
  console.log(`  où : ${targetClaude}`);
  console.log(`  quelle version : ${reservoir.vivantVersion == null ? 'version indéterminée' : `v${reservoir.vivantVersion}`}`);
  console.log(`  ce qui sera fusionné : --merge par défaut (rien d'existant n'est écrasé sans --overwrite)`);

  if (!values['dry-run']) {
    const ok = await confirmerEtape({
      yes: values.yes, json: values.json,
      question: `Déployer/mettre à jour le kit méthode sur [${hosts}] ? [o/N] `,
    });
    if (!ok) {
      console.log('  REFUS : déploiement de la méthode non confirmé.');
      console.log(`  Reprise : iakaframe install --yes   (ou relancer en interactif)`);
      return { ok: false };
    }
  }

  const args = [
    reservoir.installMjsPath, '--kits-dir', kitsDir, '--hosts', hosts,
    '--target-claude', targetClaude,
  ];
  if (values['dry-run']) args.push('--dry-run');
  args.push('--yes'); // la confirmation AR-4 vient d'avoir lieu CI-DESSUS ; install.mjs ne redemande pas une 2e fois
  if (values['backup-dir']) args.push('--backup-dir', values['backup-dir']);
  const res = spawnSync(process.execPath, args, { encoding: 'utf8', stdio: 'inherit' });
  if (res.status !== 0) {
    console.log(`  ÉCHEC : install.mjs a rendu le code ${res.status}.`);
    console.log(`  Reprise : node ${reservoir.installMjsPath} --kits-dir ${kitsDir} --hosts ${hosts} --target-claude ${targetClaude}`);
    return { ok: false };
  }
  return { ok: true };
}

// --- Double de test reseau, accessible en SOUS-PROCESSUS -----------------------------------------
// UNIQUE point d'injection reseau que `cli/test/install-verbe.test.js` peut atteindre : ce fichier
// de test spawn le VRAI binaire CLI (`node src/index.js install ...`), et un sous-processus n'a
// aucun moyen d'y injecter des fonctions JS comme le font les tests unitaires de
// `cli/test/etape1-reseau-ecarte.test.js`. `IAKAFRAME_INSTALL_TEST_DOUBLE=1` active donc un
// double DETERMINISTE et TOUJOURS INJOIGNABLE (jamais un « répond avec succès » fabriqué ici : la
// propriété « une source qui répondrait avec une version plus récente est reprise » est déjà
// prouvée par les sondes injectées DIRECTEMENT dans etape1-reseau-ecarte.test.js — ce double ne
// couvre que « zéro réseau réel, jamais un `npm install -g` réel » pour les tests qui doivent
// spawn le binaire complet). JAMAIS documenté dans `--help` : ce n'est pas une fonctionnalité
// produit, c'est un point de test — toute autre valeur de l'environnement est ignorée (défaut =
// les vraies sondes réseau, le vrai `npm`). La LOGIQUE de production (etape1Cli, ci-dessus) reste
// INCHANGÉE par ce double : elle continue de consulter le réseau exactement comme en production,
// seule la SOURCE consultée est remplacée.
function sondeDoubleTest() {
  return { nom: 'DOUBLE-TEST (IAKAFRAME_INSTALL_TEST_DOUBLE) : sonde toujours injoignable', repond: false };
}
function execNpmInstallDoubleTest() {
  // Ne doit JAMAIS être atteint : les sondes du double sont toujours injoignables, `cible` reste
  // donc toujours `null`. Un throw ici est une garde de défense en profondeur, pas un chemin
  // normal — si elle se déclenche un jour, c'est qu'un test a changé le double sans le savoir.
  throw new Error('IAKAFRAME_INSTALL_TEST_DOUBLE actif : execNpmInstall ne doit jamais être atteint (sondes toujours injoignables)');
}

export async function runInstall(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      'dry-run': { type: 'boolean', default: false },
      yes: { type: 'boolean', default: false },
      root: { type: 'string' },
      hosts: { type: 'string' },
      'target-claude': { type: 'string' },
      'backup-dir': { type: 'string' },
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });
  if (values.help) { console.log(USAGE); return; }

  console.log(`==== iakaframe install ====`);
  console.log(bannierEtapes());

  const reservoir = resoudreReservoir({ root: values.root });

  const testDouble = process.env.IAKAFRAME_INSTALL_TEST_DOUBLE === '1';
  const sondes = testDouble ? [sondeDoubleTest] : undefined;
  const execNpmInstall = testDouble ? execNpmInstallDoubleTest : undefined;

  const r1 = await etape1Cli({ reservoir, values, sondes, execNpmInstall });
  if (!r1.ok) { process.exitCode = 1; return; } // CA-07 : arret, deja enonce ci-dessus (etat atteint + commande de reprise)

  // --- Corollaire AR-1/AR-4 (§5.5, CA-08) : le moteur DESARME AR-1 pour TOUTE la duree de la
  // chaine — jamais un chemin ou le CLI fraichement mis a jour (etape 1) declencherait le
  // deploiement du kit AVANT que l'etape 2 n'ait ete validee. Toujours desarme=true ICI : ce
  // verbe EST « la chaine », le contrefactuel (garde desarmee) n'est exerce QUE par les tests
  // (cli/test/autodeploi-ar1-ar4.test.js), jamais en execution reelle de `install`.
  if (reservoir.installMjsPath) {
    const targetClaude = values['target-claude'] || path.join(os.homedir(), '.claude');
    const rapportAr1 = verifierAutoDeploiement({
      installMjsPath: reservoir.installMjsPath,
      kitsDir: path.join(reservoir.vivantRoot, 'kits'),
      targetClaude,
      desarme: true,
    });
    console.log(`\n  [garde AR-1/AR-4] ${rapportAr1.raison}`);
  }

  const r2 = await etape2Methode({ reservoir, values });
  if (!r2.ok) { process.exitCode = 1; return; } // CA-07

  console.log(`\n[3/4] IakaCockpit — non disponible dans cette version (lot C.1, à venir). Étape refusée explicitement, jamais simulée.`);
  console.log(`[4/4] iakaFrameGUI — non disponible dans cette version (lot C.1, à venir). Étape refusée explicitement, jamais simulée.`);
  console.log(`\nTerminé : étapes 1-2 jouées, étapes 3-4 hors périmètre de ce lot (§ 5.3, cf. lot C.1).`);
}
