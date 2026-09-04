// iakaframe install — le verbe de la CHAINE COMPLETE (specs/instructions/
// chaine-complete-install-amorcage-dmg-msi.md). Lot A a livre les etapes 1 et 2 (CLI + methode).
// LOT C.1 a ajoute les etapes 3 (IakaCockpit) et 4 (iakaFrameGUI) : chaque bundle est resolu depuis
// des sources reseau ORDONNEES (lib/app-bundle.js, M10), sa signature minisign VERIFIEE avant
// toute ecriture (CA-14), et la chaine porte un ROLLBACK a trois gardes (AR-5, lib/rollback.js) si
// une etape echoue apres qu'une precedente a deja ecrit. Hors de la SEULE plateforme couverte par
// ce lot (macOS, § 10 — la seule prouvable sur ce poste), les etapes 3/4 refusent EXPLICITEMENT
// (CA-15) — jamais une simulation, jamais un silence.
//
// LOT CONTRAT-MACHINE-DU-VERBE-INSTALL (specs/instructions/contrat-machine-du-verbe-install.md) :
// ce lot n'AJOUTE aucune logique d'installation — il EXPOSE celle qui existe a un programme, en
// plus de l'humain. Trois drapeaux neufs (`--events`, `--feu-vert refus|stdin`, et le sens ENFIN
// VERIDIQUE de `--json`) ; UN SEUL emetteur (lib/evenements.js), deux facons de le vider. LA PROSE
// HUMAINE NE BOUGE PAS D'UN OCTET (CA-M8) : chaque `console.log` devient `em.dire(<meme chaine>,
// <evenement ou null>)` — en mode humain, `dire` ne fait QUE `console.log(prose)`, rien d'autre.
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
import { peutDemander, askYesNo, lireLigneFeuVert } from '../lib/interactif.js';
import { getJson } from '../lib/http.js';
import { resoudreDoubleReseau } from '../lib/network-double.js';
import { APPS, cleManifestePlateforme, telechargerEtVerifier, poserBundleDarwin } from '../lib/app-bundle.js';
import { resoudre } from '../lib/endpoints.js';
import { sauvegarderAvantEtape, restaurerEtape, orchestrerRollback } from '../lib/rollback.js';
import { creerEmetteur } from '../lib/evenements.js';
import { emit, collection, fail } from '../lib/output.js';

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
  --json                 Sortie machine C-JSON : bufferise et imprime UNE racine objet
                         { ok, count, evenements[], etatAtteint, reprise } (contrat CONTRAT-
                         MACHINE-DU-VERBE-INSTALL) — desactive aussi les confirmations interactives
  --events               Flux NDJSON (contrat C-EVT) sur stdout, une ligne = un evenement — pour un
                         programme qui pilote la chaine en direct (incompatible avec --json)
  --feu-vert <mode>      Canal de consentement machine : "refus" (defaut, AR-4 tenu) ou "stdin"
                         (lit une ligne de reponse par etape sur stdin — incompatible avec --json)`;

// --- Confirmation par etape (AR-4) --------------------------------------------------------------
// `--yes` saute TOUJOURS ; sinon confirmation interactive si le terminal le permet, REFUS par
// defaut en non-interactif (le sur, jamais le suppose). `askYesNo` est le prompt UNIQUE (G3b,
// cli/test/guard-guidage-autorite.test.js) : reutilise depuis lib/interactif.js, jamais recree ici.
//
// LOT CONTRAT-MACHINE : `em`/`etape`/`feuVert` sont des ports INJECTES, optionnels — meme idiome
// que sondes/execNpmInstall (M-9). Le chemin HUMAIN (feuVert absent/'refus' et em.mode==='humain')
// est ATTEINT A L'IDENTIQUE de ce qu'il etait avant ce lot (§ 2 point 3) : `em.dire(null, ...)`
// n'imprime jamais rien en mode humain (evenements.js), donc AUCUNE prose n'est ajoutee ici.
export async function confirmerEtape({ yes, json, question, em, etape, feuVert = 'refus' }) {
  if (yes) {
    if (em) em.dire(null, { evt: 'feu-vert', etape, champs: { accorde: true, canal: 'yes', motif: '--yes : validation sautee (AR-4)' } });
    return true;
  }
  if (em) em.dire(null, { evt: 'demande-feu-vert', etape, champs: { question } });
  if (feuVert === 'stdin') {
    const { accorde, motif } = await lireLigneFeuVert({ etape });
    if (em) em.dire(null, { evt: 'feu-vert', etape, champs: { accorde, canal: 'stdin', motif } });
    return accorde;
  }
  const interactive = peutDemander({ json: Boolean(json), guide: true });
  if (!interactive) {
    if (em) {
      em.dire(null, {
        evt: 'feu-vert', etape,
        champs: { accorde: false, canal: 'refus-par-defaut', motif: 'non-interactif (ou canal machine sans --feu-vert stdin) : refus par defaut, AR-4' },
      });
    }
    return false;
  }
  const accorde = await askYesNo(question);
  if (em) {
    em.dire(null, {
      evt: 'feu-vert', etape,
      champs: { accorde, canal: 'tty', motif: accorde ? 'confirme au terminal' : 'refuse au terminal' },
    });
  }
  return accorde;
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

function essaisPourEvenement(essais) {
  return (essais || []).map(e => ({
    nom: e.nom,
    repond: Boolean(e.repond),
    exploitable: Boolean(e.exploitable),
    ...(e.version ? { version: e.version } : {}),
    ...(!e.repond ? { motif: 'injoignable' } : (!e.exploitable ? { motif: 'manifeste inexploitable' } : {})),
  }));
}

// Execute un sous-processus DELEGUE. En mode HUMAIN (machineActif=false) : `stdio:'inherit'`
// INCHANGE (M-5/M-6, comportement de production preexistant, jamais touche). En mode MACHINE
// (json OU events) : `stdio: ['ignore','pipe','pipe']` — le `stdin` de l'enfant est COUPE (empeche
// le vol de la ligne de consentement, M-5/R-M3) et chaque ligne de sa sortie est RE-EMISE en
// evenement `log-delegue` (jamais perdue, jamais entrelacee avec la prose humaine, CA-M1).
function executerEnfant(cmd, args, { em, etape, machineActif }) {
  if (!machineActif) {
    return spawnSync(cmd, args, { encoding: 'utf8', stdio: 'inherit' });
  }
  const res = spawnSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  for (const [flux, texte] of [['stdout', res.stdout], ['stderr', res.stderr]]) {
    if (!texte) continue;
    for (const ligne of String(texte).split('\n')) {
      if (ligne === '') continue;
      em.dire(null, { evt: 'log-delegue', etape, champs: { flux, ligne } });
    }
  }
  return res;
}

// --- Etape 1/4 : le CLI (sens UNIQUE ici, AR-G : mise a jour) -----------------------------------
// `sondes`/`execNpmInstall` (optionnels) : point d'INJECTION de test pour `sourcesOrdonneesCli`
// et l'execution de la mise a jour — JAMAIS utilises par l'execution reelle (defaut = les vraies
// sondes reseau / un vrai `npm`), exposes pour que les tests maitrisent le reseau PAR INJECTION,
// jamais en modifiant la logique de production elle-meme (cf. cli/test/etape1-reseau-ecarte.test.js
// et le double de cli/test/install-verbe.test.js, IAKAFRAME_INSTALL_TEST_DOUBLE).
export async function etape1Cli({ reservoir, values, execNpmInstall, sondes, em = creerEmetteur(), feuVert = 'refus' }) {
  const courante = packageVersion();
  em.dire(`\n[1/4] CLI — mise à jour (poste déjà équipé, AR-G) : version courante v${courante}`, null);
  em.dire(`  ${reservoir.provenance}`, {
    evt: 'reservoir', etape: 1,
    champs: {
      source: reservoir.source, vivantRoot: reservoir.vivantRoot, vivantVersion: reservoir.vivantVersion,
      embarqueDir: reservoir.embarqueDir, embarqueVersion: reservoir.embarqueVersion,
      installMjsPath: reservoir.installMjsPath, provenance: reservoir.provenance,
    },
  });

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

  const annonce = {
    evt: 'etape-annoncee', etape: 1,
    champs: {
      quoi: 'CLI (paquet npm global @naonedge/iakaframe)',
      ou: 'npm global',
      version: cible ? cible.version : courante,
      ceQuiSeraFusionne: cible
        ? 'remplace le paquet global @naonedge/iakaframe existant'
        : 'aucune mise a jour disponible : le paquet global reste tel quel',
      sourceRetenue: cible ? { nom: cible.from, pourquoi: `v${cible.version} > courante v${courante}` } : null,
      sourcesConsultees: essaisPourEvenement(essaisReseau),
    },
  };

  if (!cible) {
    if (essaisReseau) em.dire(`  sources réseau (AR-H) consultées :\n${ligneEssais(essaisReseau)}`, null);
    em.dire(`  déjà à jour (v${courante}) — rien à installer.`, annonce);
    em.dire(null, { evt: 'etape-terminee', etape: 1, champs: { etat: 'sautee', detail: `déjà à jour (v${courante})` } });
    return { ok: true, misAJour: false };
  }

  em.dire(`  mise à jour disponible : v${courante} → v${cible.version} (source : ${cible.from})`, annonce);
  em.dire(`  ce qui sera fusionné : remplace le paquet global \`@naonedge/iakaframe\` existant`, null);
  if (values['dry-run']) {
    em.dire('  [dry-run] rien écrit.', null);
    em.dire(null, { evt: 'etape-terminee', etape: 1, champs: { etat: 'dry-run', detail: `mise à jour v${courante} → v${cible.version} décrite, rien écrit` } });
    return { ok: true, misAJour: false, dryRun: true };
  }
  const ok = await confirmerEtape({
    yes: values.yes, json: values.json, em, etape: 1, feuVert,
    question: `Mettre à jour le CLI vers v${cible.version} depuis ${cible.from} ? [o/N] `,
  });
  if (!ok) {
    em.dire('  REFUS : mise à jour du CLI non confirmée.', null);
    const reprise = `iakaframe install --yes   (ou relancer en interactif)`;
    em.dire(`  Reprise : ${reprise}`, null);
    em.dire(null, { evt: 'etape-terminee', etape: 1, champs: { etat: 'refusee', detail: 'mise à jour non confirmée' } });
    return { ok: false, misAJour: false, reprise };
  }
  const [cmd, args] = cible.install;
  const machineActif = em.mode !== 'humain';
  const res = execNpmInstall ? execNpmInstall(cmd, args) : executerEnfant(cmd, args, { em, etape: 1, machineActif });
  if (res.status !== 0) {
    em.dire(`  ÉCHEC : ${cmd} ${args.join(' ')} (code ${res.status}).`, null);
    const reprise = `${cmd} ${args.join(' ')}`;
    em.dire(`  Reprise : ${reprise}`, null);
    em.dire(null, { evt: 'etape-terminee', etape: 1, champs: { etat: 'echouee', detail: `code ${res.status}` } });
    return { ok: false, misAJour: false, reprise };
  }
  em.dire(`  + CLI mis à jour vers v${cible.version}.`, null);
  em.dire(null, { evt: 'etape-terminee', etape: 1, champs: { etat: 'faite', detail: `mis à jour vers v${cible.version}` } });
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
// AR-I(a) (BUNDLE-INSTALL-MJS-ABSENT) : le reservoir qui PORTE la charge de l'etape 2 est celui
// DESIGNE par AR-F (reservoir.source), jamais systematiquement le vivant. `kitsDir` doit donc etre
// derive du reservoir PORTEUR (`path.dirname(reservoir.installMjsPath)`), pas de `vivantRoot` —
// sinon un embarque porteur (vivantRoot === null) fait lever un TypeError (N5/R-B).
export async function etape2Methode({ reservoir, values, em = creerEmetteur(), feuVert = 'refus' }) {
  em.dire(`\n[2/4] méthode — délégation à install.mjs (M4, non réimplémenté)`, null);
  if (!reservoir.installMjsPath) {
    // CA-21' (rectification datee de CA-21, 2026-09-04) : la charge n'est plus INTROUVABLE par
    // construction sur un poste sans vivant (elle voyage avec le paquet, AR-I(a)) — le refus ne
    // se declenche donc plus que si NI le vivant NI l'embarque ne la portent (bundle ampute, R-A).
    // Le message nomme les DEUX chemins cherches, jamais une affirmation sur ce que `_bundled/`
    // NE porte pas (E-3 : c'etait le seul enonce faux LU PAR L'UTILISATEUR).
    em.dire(`  REFUS : la charge de la méthode (install.mjs) est introuvable.`, null);
    em.dire(`    cherchée : ${reservoir.installMjsCandidatVivant}   (réservoir vivant)`, null);
    em.dire(`               ${reservoir.installMjsCandidatEmbarque} (réservoir embarqué)`, null);
    em.dire(`    cause : ni l'arbre vivant ni le paquet embarqué ne la portent — un paquet publié qui ne`, null);
    em.dire(`            la porte pas est un bundle incomplet (garde \`required\` de cli/scripts/bundle.js).`, null);
    const reprise = `iakaframe install --root <chemin-vers-un-clone-iakaframe>`;
    em.dire(`    Reprise : ${reprise}`, null);
    em.dire(null, {
      evt: 'etape-terminee', etape: 2,
      champs: { etat: 'echouee', detail: 'install.mjs introuvable (ni vivant ni embarqué)' },
    });
    return { ok: false, reprise };
  }
  const kitsDir = path.join(path.dirname(reservoir.installMjsPath), 'kits');
  const hosts = values.hosts || 'claude';
  const targetClaude = values['target-claude'] || path.join(os.homedir(), '.claude');
  em.dire(`  quoi : kit(s) hôte(s) [${hosts}] depuis ${kitsDir}`, null);
  em.dire(`  où : ${targetClaude}`, null);
  const versionAffichee = reservoir.source === 'vivant'
    ? (reservoir.vivantVersion == null ? 'version indéterminée' : `v${reservoir.vivantVersion}`)
    : `v${reservoir.embarqueVersion}`;
  em.dire(`  quelle version : ${versionAffichee}`, null);
  em.dire(`  ce qui sera fusionné : --merge par défaut (rien d'existant n'est écrasé sans --overwrite)`, {
    evt: 'etape-annoncee', etape: 2,
    champs: {
      quoi: `kit(s) hôte(s) [${hosts}]`,
      ou: targetClaude,
      version: versionAffichee,
      ceQuiSeraFusionne: '--merge par défaut (rien d\'existant n\'est écrasé sans --overwrite)',
      sourceRetenue: { nom: reservoir.source, pourquoi: reservoir.provenance },
      sourcesConsultees: [],
    },
  });

  if (!values['dry-run']) {
    const ok = await confirmerEtape({
      yes: values.yes, json: values.json, em, etape: 2, feuVert,
      question: `Déployer/mettre à jour le kit méthode sur [${hosts}] ? [o/N] `,
    });
    if (!ok) {
      em.dire('  REFUS : déploiement de la méthode non confirmé.', null);
      const reprise = `iakaframe install --yes   (ou relancer en interactif)`;
      em.dire(`  Reprise : ${reprise}`, null);
      em.dire(null, { evt: 'etape-terminee', etape: 2, champs: { etat: 'refusee', detail: 'déploiement non confirmé' } });
      return { ok: false, reprise };
    }
  }

  const args = [
    reservoir.installMjsPath, '--kits-dir', kitsDir, '--hosts', hosts,
    '--target-claude', targetClaude,
  ];
  if (values['dry-run']) args.push('--dry-run');
  args.push('--yes'); // la confirmation AR-4 vient d'avoir lieu CI-DESSUS ; install.mjs ne redemande pas une 2e fois
  if (values['backup-dir']) args.push('--backup-dir', values['backup-dir']);
  const machineActif = em.mode !== 'humain';
  const res = executerEnfant(process.execPath, args, { em, etape: 2, machineActif });
  if (res.status !== 0) {
    em.dire(`  ÉCHEC : install.mjs a rendu le code ${res.status}.`, null);
    const reprise = `node ${reservoir.installMjsPath} --kits-dir ${kitsDir} --hosts ${hosts} --target-claude ${targetClaude}`;
    em.dire(`  Reprise : ${reprise}`, null);
    em.dire(null, { evt: 'etape-terminee', etape: 2, champs: { etat: 'echouee', detail: `code ${res.status}` } });
    return { ok: false, reprise };
  }
  em.dire(null, {
    evt: 'etape-terminee', etape: 2,
    champs: { etat: values['dry-run'] ? 'dry-run' : 'faite', detail: 'kit méthode déployé/à jour' },
  });
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
  plateforme, em = creerEmetteur(), feuVert = 'refus',
} = {}) {
  const app = APPS[appKey];
  em.dire(`\n[${numero}/4] ${app.nom}`, null);

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
    em.dire(`  REFUS : plateforme "${plat}" non couverte par ce lot (§ 10 — seul macOS est prouvé sur ce poste). Jamais une simulation.`, null);
    if (!dryRun) {
      const reprise = 'aucune — cette plateforme attend un lot dédié (recette réelle Windows/Linux, § 10)';
      em.dire(`  Reprise : ${reprise}`, null);
      em.dire(null, { evt: 'etape-terminee', etape: numero, champs: { etat: 'echouee', detail: `plateforme "${plat}" non couverte` } });
      return { ok: false, preuve: null, reprise };
    }
    em.dire(`  [dry-run] rien à écrire de toute façon sur cette plateforme — la chaîne continue décrire les étapes suivantes.`, null);
    em.dire(null, { evt: 'etape-terminee', etape: numero, champs: { etat: 'dry-run', detail: `plateforme "${plat}" non couverte` } });
    return { ok: true, dryRun: true, preuve: null };
  }

  const res = await resoudreEndpointsApp(app.endpoints, {});
  if (!res.retenu) {
    em.dire(`  sources consultées (ordre M10) :`, null);
    for (const e of res.essais) em.dire(`    - ${e.hote} : ${e.motif}`, null);
    const annonceEchec = {
      evt: 'etape-annoncee', etape: numero,
      champs: {
        quoi: app.nom, ou: null, version: null, ceQuiSeraFusionne: null,
        sourceRetenue: null,
        sourcesConsultees: res.essais.map(e => ({ nom: e.hote, repond: Boolean(e.status), exploitable: Boolean(e.ok), motif: e.motif })),
      },
    };
    if (!dryRun) {
      em.dire(`  REFUS : aucune source n'a servi de manifeste exploitable pour ${app.nom}.`, annonceEchec);
      const reprise = `iakaframe install --yes   (ou relancer une fois le réseau disponible)`;
      em.dire(`  Reprise : ${reprise}`, null);
      em.dire(null, { evt: 'etape-terminee', etape: numero, champs: { etat: 'echouee', detail: 'aucune source exploitable' } });
      return { ok: false, preuve: null, reprise };
    }
    em.dire(`  [dry-run] aucune source n'a servi de manifeste exploitable pour ${app.nom} — rien à écrire de toute façon.`, annonceEchec);
    em.dire(null, { evt: 'etape-terminee', etape: numero, champs: { etat: 'dry-run', detail: 'aucune source exploitable' } });
    return { ok: true, dryRun: true, preuve: null };
  }
  const manifeste = res.manifeste;
  const cible = path.join(appsDir, `${app.nom}.app`);
  const dejaPresent = fs.existsSync(cible);
  em.dire(`  quoi : ${app.nom} v${manifeste.version} (plateforme ${cle}), depuis ${res.retenu.hote}`, null);
  em.dire(`  où : ${cible}`, null);
  em.dire(`  quelle version : v${manifeste.version}`, null);
  const ceQuiSeraFusionne = dejaPresent
    ? `${app.nom}.app existant à cette adresse sera REMPLACÉ (sauvegardé avant, AR-5)`
    : `pose neuve, rien n'existait à cette adresse`;
  em.dire(`  ce qui sera fusionné : ${ceQuiSeraFusionne}`, {
    evt: 'etape-annoncee', etape: numero,
    champs: {
      quoi: `${app.nom} v${manifeste.version} (plateforme ${cle})`,
      ou: cible,
      version: manifeste.version,
      ceQuiSeraFusionne,
      sourceRetenue: { nom: res.retenu.hote, pourquoi: 'manifeste exploitable retenu (ordre M10, AR-H)' },
      sourcesConsultees: res.essais.map(e => ({ nom: e.hote, repond: Boolean(e.status), exploitable: Boolean(e.ok), motif: e.motif })),
    },
  });

  if (dryRun) {
    em.dire('  [dry-run] rien écrit (réseau consulté en lecture seule, aucune écriture disque).', null);
    em.dire(null, { evt: 'etape-terminee', etape: numero, champs: { etat: 'dry-run', detail: `${app.nom} v${manifeste.version} décrit, rien écrit` } });
    return { ok: true, dryRun: true, preuve: null };
  }

  const feuVertOk = await confirmerEtape({
    yes: values.yes, json: values.json, em, etape: numero, feuVert,
    question: `Installer ${app.nom} v${manifeste.version} ? [o/N] `,
  });
  if (!feuVertOk) {
    em.dire(`  REFUS : installation de ${app.nom} non confirmée.`, null);
    const reprise = `iakaframe install --yes   (ou relancer en interactif)`;
    em.dire(`  Reprise : ${reprise}`, null);
    em.dire(null, { evt: 'etape-terminee', etape: numero, champs: { etat: 'refusee', detail: 'installation non confirmée' } });
    return { ok: false, preuve: null, reprise };
  }

  const dl = await telechargerEtVerifier({ app, manifeste, cle, telecharger: telechargerApp });
  if (!dl.ok) {
    em.dire(`  REFUS : ${dl.raison}`, null);
    em.dire(null, { evt: 'etape-terminee', etape: numero, champs: { etat: 'echouee', detail: dl.raison } });
    return { ok: false, preuve: null };
  }
  em.dire(`  + signature vérifiée (minisign, ${app.nom}).`, null);

  // AR-5 garde 1 : sauvegarde AVANT toute écriture. Si la sauvegarde elle-même échoue, on REFUSE
  // d'écrire plutôt que d'écrire sans filet — même prudence que le refus de dérouler sans preuve.
  let preuve;
  try {
    preuve = sauvegarderAvantEtape({ backupDir, etape: numero, cible });
  } catch (e) {
    em.dire(`  REFUS : sauvegarde de sécurité impossible avant la pose (${e.message}) — rien n'est écrit.`, null);
    em.dire(null, { evt: 'etape-terminee', etape: numero, champs: { etat: 'echouee', detail: `sauvegarde impossible : ${e.message}` } });
    return { ok: false, preuve: null };
  }

  const pose = poserBundleDarwin({ octets: dl.octets, cible });
  if (!pose.ok) {
    em.dire(`  ÉCHEC : ${pose.raison}`, null);
    // Echec APRES la sauvegarde : on a la preuve, on peut donc défaire immédiatement ce que CETTE
    // écriture a pu poser partiellement — jamais un état à moitié écrit laissé tel quel.
    const rb = restaurerEtape(preuve);
    em.dire(`  [rollback immédiat de l'étape ${numero}] ${rb.raison}`, null);
    em.dire(null, { evt: 'etape-terminee', etape: numero, champs: { etat: 'echouee', detail: pose.raison } });
    return { ok: false, preuve: null };
  }
  em.dire(`  + ${app.nom} v${manifeste.version} posé à ${pose.cible}.`, null);
  em.dire(null, { evt: 'etape-terminee', etape: numero, champs: { etat: 'faite', detail: `${app.nom} v${manifeste.version} posé` } });
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
      events: { type: 'boolean', default: false },
      'feu-vert': { type: 'string', default: 'refus' },
      help: { type: 'boolean', default: false },
    },
  });
  if (values.help) { console.log(USAGE); return; }

  // --- Refus explicite des combinaisons incoherentes, AVANT TOUT EFFET (CA-M12) ------------------
  if (values.json && values.events) {
    fail(true, 'combinaison incohérente : --json et --events ne peuvent pas être utilisés ensemble (--json bufferise et imprime une seule racine en fin de chaîne ; --events diffuse une ligne NDJSON par événement, immédiatement) — choisir un seul des deux');
    return;
  }
  if (values.json && values['feu-vert'] === 'stdin') {
    fail(true, 'combinaison incohérente : --json et --feu-vert stdin ne peuvent pas être utilisés ensemble (--json bufferise : un client ne verrait la demande de feu vert qu\'après la fin de la chaîne, jamais à temps pour y répondre)');
    return;
  }
  if (!['refus', 'stdin'].includes(values['feu-vert'])) {
    const msg = `--feu-vert doit valoir "refus" ou "stdin" (reçu : "${values['feu-vert']}")`;
    if (values.json) { fail(true, msg); } else { console.error(msg); process.exitCode = 1; }
    return;
  }

  const emetteurMode = values.json ? 'json' : (values.events ? 'events' : 'humain');
  const em = creerEmetteur({ mode: emetteurMode });
  const feuVert = values['feu-vert'];

  const courante = packageVersion();
  em.dire(`==== iakaframe install ====`, null);
  em.dire(bannierEtapes(), {
    evt: 'debut', etape: null,
    champs: {
      versionCli: courante, totalEtapes: 4, telechargements: 3,
      dryRun: Boolean(values['dry-run']), plateforme: `${os.platform()}-${os.arch()}`,
      mode: emetteurMode,
    },
  });

  const reservoir = resoudreReservoir({ root: values.root });

  // Double de test reseau, DEUX signaux requis, jamais documente dans --help : voir lib/
  // network-double.js pour le motif complet (correction du 3e gate qualite, 2026-09-04). Ce
  // module NE PORTE AUCUNE implementation de double — seulement la decision + le chargement
  // conditionnel d'un fichier qui vit hors de `src/` (cli/test/fixtures/, jamais publie).
  const { sondes, execNpmInstall, resoudreEndpointsApp, telechargerApp } = await resoudreDoubleReseau();

  const etapesFaites = [];

  function terminer({ ok, error, derniereEtapeTentee, reprise }) {
    const etatAtteint = {
      derniereEtapeTentee,
      etapesFaites: [...etapesFaites],
      etapesNonTentees: [1, 2, 3, 4].filter(n => n > derniereEtapeTentee),
    };
    const finChamps = { ok, etatAtteint, reprise: reprise || null };
    if (!ok && error) finChamps.error = error;
    em.dire(null, { evt: 'fin', etape: null, champs: finChamps });
    if (values.json) {
      if (ok) {
        emit(true, collection('evenements', em.evenements, { etatAtteint, reprise: reprise || null }), undefined);
      } else {
        fail(true, error || 'la chaîne d\'installation a échoué', { evenements: em.evenements, count: em.evenements.length, etatAtteint, reprise: reprise || null });
      }
    }
    if (!ok) process.exitCode = 1;
  }

  const r1 = await etape1Cli({ reservoir, values, sondes, execNpmInstall, em, feuVert });
  if (!r1.ok) { // CA-07 : arret, deja enonce ci-dessus (etat atteint + commande de reprise)
    terminer({ ok: false, error: 'étape 1 (CLI) refusée ou échouée', derniereEtapeTentee: 1, reprise: r1.reprise });
    return;
  }
  if (!values['dry-run']) etapesFaites.push(1);

  // --- Corollaire AR-1/AR-4 (§5.5, CA-08) : le moteur DESARME AR-1 pour TOUTE la duree de la
  // chaine — jamais un chemin ou le CLI fraichement mis a jour (etape 1) declencherait le
  // deploiement du kit AVANT que l'etape 2 n'ait ete validee. Toujours desarme=true ICI : ce
  // verbe EST « la chaine », le contrefactuel (garde desarmee) n'est exerce QUE par les tests
  // (cli/test/autodeploi-ar1-ar4.test.js), jamais en execution reelle de `install`.
  if (reservoir.installMjsPath) {
    const targetClaude = values['target-claude'] || path.join(os.homedir(), '.claude');
    const rapportAr1 = verifierAutoDeploiement({
      installMjsPath: reservoir.installMjsPath,
      // N5/R-B : derive du reservoir PORTEUR (dirname d'installMjsPath), jamais de vivantRoot —
      // un embarque porteur a `vivantRoot === null`, et `path.join(null, 'kits')` leverait un
      // TypeError AVANT meme l'appel (evaluation eager de l'argument).
      kitsDir: path.join(path.dirname(reservoir.installMjsPath), 'kits'),
      targetClaude,
      desarme: true,
    });
    em.dire(`\n  [garde AR-1/AR-4] ${rapportAr1.raison}`, {
      evt: 'garde-ar1', etape: 1, champs: { desarme: true, raison: rapportAr1.raison },
    });
  }

  const r2 = await etape2Methode({ reservoir, values, em, feuVert });
  if (!r2.ok) { // CA-07
    terminer({ ok: false, error: 'étape 2 (méthode) refusée ou échouée', derniereEtapeTentee: 2, reprise: r2.reprise });
    return;
  }
  if (!values['dry-run']) etapesFaites.push(2);

  const appsDir = resoudreAppsDir(values);
  const backupDir = resoudreBackupDir(values);

  const r3 = await etapeApp({
    numero: 3, appKey: 'IakaCockpit', values, appsDir, backupDir,
    resoudreEndpointsApp, telechargerApp, em, feuVert,
  });
  if (!r3.ok) { // CA-07 : rien n'a été écrit par l'étape 3, rien à défaire
    terminer({ ok: false, error: 'étape 3 (IakaCockpit) refusée ou échouée', derniereEtapeTentee: 3, reprise: r3.reprise });
    return;
  }
  if (!r3.dryRun) etapesFaites.push(3);

  const r4 = await etapeApp({
    numero: 4, appKey: 'iakaFrameGUI', values, appsDir, backupDir,
    resoudreEndpointsApp, telechargerApp, em, feuVert,
  });
  if (!r4.ok) {
    // AR-5 : l'étape 3 A ÉCRIT (r3.preuve non nulle, sauf dry-run) et la chaîne s'arrête quand
    // même ici — c'est PRÉCISÉMENT le cas que le rollback existe pour couvrir. On ne défait QUE
    // ce que la preuve permet de défaire (garde 1), jamais à l'aveugle.
    if (r3.preuve) {
      const rb = orchestrerRollback([r3.preuve]);
      em.dire(`\n[rollback] ${rb.resume}`, {
        evt: 'rollback', etape: 4,
        champs: { resume: rb.resume, defaits: rb.defaits, nonDefaits: rb.nonDefaits, rapports: rb.rapports },
      });
      for (const rap of rb.rapports) em.dire(`  [étape ${rap.etape}] ${rap.raison}`, null);
    }
    terminer({ ok: false, error: 'étape 4 (iakaFrameGUI) refusée ou échouée', derniereEtapeTentee: 4, reprise: r4.reprise });
    return; // CA-07
  }
  if (!r4.dryRun) etapesFaites.push(4);

  em.dire(`\nTerminé : les 4 étapes ont été jouées.`, null);
  terminer({ ok: true, derniereEtapeTentee: 4 });
}
