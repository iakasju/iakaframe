// iakaframe install — le verbe de la CHAINE COMPLETE (specs/instructions/
// chaine-complete-install-amorcage-dmg-msi.md). Lot A a livre les etapes 1 et 2 (CLI + methode).
// LOT C.1 (ce fichier, desormais) ajoute les etapes 3 (IakaCockpit) et 4 (iakaFrameGUI) : chaque
// bundle est resolu depuis des sources reseau ORDONNEES (lib/app-bundle.js, M10), sa signature
// minisign VERIFIEE avant toute ecriture (CA-14), et la chaine porte un ROLLBACK a trois gardes
// (AR-5, lib/rollback.js) si une etape echoue apres qu'une precedente a deja ecrit. Hors de la
// SEULE plateforme couverte par ce lot (macOS, § 10 — la seule prouvable sur ce poste), les etapes
// 3/4 refusent EXPLICITEMENT (CA-15) — jamais une simulation, jamais un silence.
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
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resoudreReservoir } from '../lib/reservoir.js';
import { verifierAutoDeploiement } from '../lib/autodeploi.js';
import { packageVersion } from '../lib/version.js';
import { peutDemander, askYesNo } from '../lib/interactif.js';
import { getJson } from '../lib/http.js';
import { resoudreDoubleReseau } from '../lib/network-double.js';
import { APPS, cleManifestePlateforme, telechargerEtVerifier, poserBundleDarwin } from '../lib/app-bundle.js';
import { resoudre } from '../lib/endpoints.js';
import { sauvegarderAvantEtape, restaurerEtape, orchestrerRollback } from '../lib/rollback.js';

const USAGE = `Usage : iakaframe install [options]

La chaine complete d'installation (4 etapes / 3 telechargements, AR-A) : CLI - methode -
IakaCockpit - iakaFrameGUI. Les etapes 3/4 ne s'executent reellement que sur la plateforme
couverte par ce lot (macOS, § 10) ; ailleurs, elles refusent explicitement (CA-15).

Options :
  --dry-run              Decrit les 4 etapes SANS RIEN ECRIRE (empreinte disque avant/apres identique)
  --yes                  Saute TOUTES les validations par etape (AR-4) — jamais une partie
  --root <dir>           Epingle un reservoir vivant precis (sinon <chapeau>/iakaframe)
  --hosts <a,b>          Hotes de l'etape 2 (defaut : claude — cf. install.mjs pour codex/openwebui)
  --target-claude <dir>  Cible de l'etape 2 pour l'hote claude (defaut : ~/.claude)
  --backup-dir <dir>     Sauvegarde horodatee des etapes 2 (install.mjs) et 3/4 (AR-5, rollback)
  --apps-dir <dir>       Cible des etapes 3/4 (defaut : ~/Applications, macOS)
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

function resoudreAppsDir(values) {
  return values['apps-dir'] || path.join(os.homedir(), 'Applications');
}

function resoudreBackupDir(values) {
  return values['backup-dir'] || path.join(os.homedir(), '.iakaframe', 'install-backups');
}

// --- Etapes 3/4 : une app Tauri du portefeuille (IakaCockpit, iakaFrameGUI), lot C.1 ------------
// Meme grammaire AR-4 que les etapes 1/2 (annonce quoi/ou/version/fusion puis feu vert, `--yes`
// saute tout), MEME `confirmerEtape` (source unique du prompt, G3b). Ce que ce lot AJOUTE : la
// resolution reseau ORDONNEE + la verification de signature (lib/app-bundle.js, CA-14) AVANT toute
// ecriture, et la sauvegarde AR-5 (garde 1) juste avant l'ecriture elle-meme — jamais apres.
// `resoudreEndpointsApp`/`telechargerApp` sont des points d'INJECTION de test (defaut : les VRAIES
// fonctions reseau), meme idiome que `sondes`/`execNpmInstall` de l'etape 1. `plateforme` est un
// point d'injection PUR (aucun reseau), reserve aux tests DIRECTS de CA-15 (cf. cli/test/
// app-bundle.test.js) — jamais expose par un drapeau CLI : simuler une AUTRE plateforme que celle
// reellement en cours d'execution n'a aucun sens hors d'un test.
export async function etapeApp({
  numero, appKey, values, appsDir, backupDir,
  resoudreEndpointsApp = resoudre, telechargerApp,
  plateforme,
} = {}) {
  const app = APPS[appKey];
  console.log(`\n[${numero}/4] ${app.nom}`);

  // CA-15 : hors plateforme couverte, REFUS EXPLICITE avant meme de toucher au reseau — jamais
  // une simulation, jamais un silence.
  // Meme doctrine que les etapes 1/2 (etape1Cli/etape2Methode) : `--dry-run` DECRIT sans jamais
  // rien ECRIRE, mais il continue a consulter reseau/disque en LECTURE pour une description
  // exacte (CA-03 : « prouve par empreinte disque, pas par lecture de code »). Une etape qui ne
  // peut RIEN determiner (plateforme non couverte, reseau injoignable) n'a donc RIEN a ecrire de
  // toute facon : en dry-run, elle le DIT et laisse la chaine continuer decrire les suivantes ;
  // en execution reelle, la meme impossibilite ARRETE la chaine (CA-07) — c'est le seul point ou
  // dry-run et reel divergent dans ce fichier, et c'est delibere.
  const dryRun = Boolean(values['dry-run']);

  const cle = cleManifestePlateforme(plateforme || {});
  if (!cle) {
    const plat = `${(plateforme && plateforme.platform) || os.platform()}-${(plateforme && plateforme.arch) || os.arch()}`;
    console.log(`  REFUS : plateforme "${plat}" non couverte par ce lot (§ 10 — seul macOS est prouvé sur ce poste). Jamais une simulation.`);
    if (!dryRun) {
      console.log(`  Reprise : aucune — cette plateforme attend un lot dédié (recette réelle Windows/Linux, § 10).`);
      return { ok: false, preuve: null };
    }
    console.log(`  [dry-run] rien à écrire de toute façon sur cette plateforme — la chaîne continue décrire les étapes suivantes.`);
    return { ok: true, dryRun: true, preuve: null };
  }

  const res = await resoudreEndpointsApp(app.endpoints, {});
  if (!res.retenu) {
    console.log(`  sources consultées (ordre M10) :`);
    for (const e of res.essais) console.log(`    - ${e.hote} : ${e.motif}`);
    if (!dryRun) {
      console.log(`  REFUS : aucune source n'a servi de manifeste exploitable pour ${app.nom}.`);
      console.log(`  Reprise : iakaframe install --yes   (ou relancer une fois le réseau disponible)`);
      return { ok: false, preuve: null };
    }
    console.log(`  [dry-run] aucune source n'a servi de manifeste exploitable pour ${app.nom} — rien à écrire de toute façon.`);
    return { ok: true, dryRun: true, preuve: null };
  }
  const manifeste = res.manifeste;
  const cible = path.join(appsDir, `${app.nom}.app`);
  const dejaPresent = fs.existsSync(cible);
  console.log(`  quoi : ${app.nom} v${manifeste.version} (plateforme ${cle}), depuis ${res.retenu.hote}`);
  console.log(`  où : ${cible}`);
  console.log(`  quelle version : v${manifeste.version}`);
  console.log(`  ce qui sera fusionné : ${dejaPresent ? `${app.nom}.app existant à cette adresse sera REMPLACÉ (sauvegardé avant, AR-5)` : `pose neuve, rien n'existait à cette adresse`}`);

  if (dryRun) {
    console.log('  [dry-run] rien écrit (réseau consulté en lecture seule, aucune écriture disque).');
    return { ok: true, dryRun: true, preuve: null };
  }

  const feuVert = await confirmerEtape({
    yes: values.yes, json: values.json,
    question: `Installer ${app.nom} v${manifeste.version} ? [o/N] `,
  });
  if (!feuVert) {
    console.log(`  REFUS : installation de ${app.nom} non confirmée.`);
    console.log(`  Reprise : iakaframe install --yes   (ou relancer en interactif)`);
    return { ok: false, preuve: null };
  }

  const dl = await telechargerEtVerifier({ app, manifeste, cle, telecharger: telechargerApp });
  if (!dl.ok) {
    console.log(`  REFUS : ${dl.raison}`);
    return { ok: false, preuve: null };
  }
  console.log(`  + signature vérifiée (minisign, ${app.nom}).`);

  // AR-5 garde 1 : sauvegarde AVANT toute écriture. Si la sauvegarde elle-même échoue, on REFUSE
  // d'écrire plutôt que d'écrire sans filet — même prudence que le refus de dérouler sans preuve.
  let preuve;
  try {
    preuve = sauvegarderAvantEtape({ backupDir, etape: numero, cible });
  } catch (e) {
    console.log(`  REFUS : sauvegarde de sécurité impossible avant la pose (${e.message}) — rien n'est écrit.`);
    return { ok: false, preuve: null };
  }

  const pose = poserBundleDarwin({ octets: dl.octets, cible });
  if (!pose.ok) {
    console.log(`  ÉCHEC : ${pose.raison}`);
    // Echec APRES la sauvegarde : on a la preuve, on peut donc défaire immédiatement ce que CETTE
    // écriture a pu poser partiellement — jamais un état à moitié écrit laissé tel quel.
    const rb = restaurerEtape(preuve);
    console.log(`  [rollback immédiat de l'étape ${numero}] ${rb.raison}`);
    return { ok: false, preuve: null };
  }
  console.log(`  + ${app.nom} v${manifeste.version} posé à ${pose.cible}.`);
  return { ok: true, preuve };
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
      'apps-dir': { type: 'string' },
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });
  if (values.help) { console.log(USAGE); return; }

  console.log(`==== iakaframe install ====`);
  console.log(bannierEtapes());

  const reservoir = resoudreReservoir({ root: values.root });

  // Double de test reseau, DEUX signaux requis, jamais documente dans --help : voir lib/
  // network-double.js pour le motif complet (correction du 3e gate qualite, 2026-09-04). Ce
  // module NE PORTE AUCUNE implementation de double — seulement la decision + le chargement
  // conditionnel d'un fichier qui vit hors de `src/` (cli/test/fixtures/, jamais publie).
  const { sondes, execNpmInstall, resoudreEndpointsApp, telechargerApp } = await resoudreDoubleReseau();

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

  const appsDir = resoudreAppsDir(values);
  const backupDir = resoudreBackupDir(values);

  const r3 = await etapeApp({
    numero: 3, appKey: 'IakaCockpit', values, appsDir, backupDir,
    resoudreEndpointsApp, telechargerApp,
  });
  if (!r3.ok) { process.exitCode = 1; return; } // CA-07 : rien n'a été écrit par l'étape 3, rien à défaire

  const r4 = await etapeApp({
    numero: 4, appKey: 'iakaFrameGUI', values, appsDir, backupDir,
    resoudreEndpointsApp, telechargerApp,
  });
  if (!r4.ok) {
    // AR-5 : l'étape 3 A ÉCRIT (r3.preuve non nulle, sauf dry-run) et la chaîne s'arrête quand
    // même ici — c'est PRÉCISÉMENT le cas que le rollback existe pour couvrir. On ne défait QUE
    // ce que la preuve permet de défaire (garde 1), jamais à l'aveugle.
    if (r3.preuve) {
      const rb = orchestrerRollback([r3.preuve]);
      console.log(`\n[rollback] ${rb.resume}`);
      for (const rap of rb.rapports) console.log(`  [étape ${rap.etape}] ${rap.raison}`);
    }
    process.exitCode = 1;
    return; // CA-07
  }

  console.log(`\nTerminé : les 4 étapes ont été jouées.`);
}
