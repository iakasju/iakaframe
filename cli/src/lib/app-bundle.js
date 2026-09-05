// Etapes 3/4 du verbe `install` (lot C.1, § 5.4/§ 6.1 de specs/instructions/
// chaine-complete-install-amorcage-dmg-msi.md) : resoudre le manifeste d'une app Tauri du
// portefeuille (IakaCockpit, iakaFrameGUI), verifier la signature minisign du bundle AVANT de le
// poser, et poser le bundle pour la (seule) plateforme couverte par ce lot.
//
// CES ENDPOINTS/CLES SONT EN DUR ICI, ET C'EST DELIBERE. Un utilisateur qui installe par la voie
// PUBLIQUE (AR-H) n'a NI IakaCockpit NI iakaFrameGUI clones sur sa machine — le CLI est
// precisement ce qui les lui pose. Ces constantes sont donc necessairement une COPIE des memes
// valeurs que les deux apps declarent elles-memes dans leur propre `src-tauri/tauri.conf.json`
// (`plugins.updater.endpoints`/`pubkey`, lues le 2026-09-04). AR-E : « ces deux depots ne sont pas
// a modifier par ce lot » — cette copie ne les touche pas ; elle recopie ce qu'ils publient deja.
// ORDRE DES ENDPOINTS : NAS Forgejo (LAN) PUIS GitHub raw (public) — c'est M10, une decision DEJA
// PRISE par ces apps elles-memes (iakabox retiree le 2026-09-03, motif+condition de levee dans
// `IakaCockpit/fixtures/canaux-publication.json:24-30`) : ce lot ne la rouvre pas, il la
// REUTILISE — a la difference de l'ordre AR-H de l'etape 1 (GitHub d'abord), qui est un choix
// PROPRE au CLI et n'a aucune raison d'etre le meme.
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resoudre } from './endpoints.js';
import { getBytes } from './http.js';
import { parsePublicKey, verifierMinisign } from './minisign.js';

export const APPS = {
  IakaCockpit: {
    nom: 'IakaCockpit',
    pubkey: 'dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEUyOTk3MUNDNDlDNzgyMzMKUldRemdzZEp6SEdaNHNNUjczZVJLOW0vVUlTeE1qVzJzV2dDeThISWZkYUYzYjlxWFR2bldMWFoK',
    endpoints: [
      'http://192.168.1.139:3001/sjupin/iakacockpit/raw/branch/main/updater/latest.json',
      'https://raw.githubusercontent.com/iakasju/IakaCockpit/main/updater/latest.json',
    ],
  },
  iakaFrameGUI: {
    nom: 'iakaFrameGUI',
    pubkey: 'dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEQ0NUVGRkJGRDZFNDk1RDAKUldUUWxlVFd2LzllMUJxYm8vZHY4SHRsbjF1VjdoTW0zREt2UlJETE02UUFpRGhtNHE2Nk01R2gK',
    endpoints: [
      'http://192.168.1.139:3001/sjupin/iakaFrameGUI/raw/branch/main/updater/latest.json',
      'https://raw.githubusercontent.com/iakasju/iakaFrameGUI/main/updater/latest.json',
    ],
  },
};

// --- CA-15 : la plateforme COUVERTE, et REFUS EXPLICITE pour toutes les autres ------------------
// § 10 de l'instruction C.1 disait : « prouvable sur ce poste (macOS arm64) » est la SEULE
// recette reelle disponible a l'execution du lot C.1. Le motif ci-dessous (« .app.tar.gz est la
// SEULE forme installable SANS assistant interactif ni privilege eleve sur AUCUNE des quatre
// plateformes ») etait JUSTE a ce moment-la — il ne l'est PLUS.
//
// RECTIFICATION DATEE (2026-09-05, lot ETAPES-3-4-WINDOWS-LINUX/W-L,
// specs/instructions/etapes-3-4-windows-linux.md § 1) : ce motif est FAUX sur Linux, et FAUX pour
// le `.exe` NSIS de Windows. Une AppImage se pose par une COPIE DE L'OCTET + un bit d'execution
// (`chmod +x`) — strictement le MEME geste que macOS, SANS installeur tiers, SANS privilege eleve
// (E-6/E-8 du cadrage). Le NSIS Windows, en mode `currentUser` (defaut des deux apps, M7, E-2),
// n'eleve pas non plus. Seuls le `.msi` Windows (`perMachine` FORCE par le gabarit WiX de Tauri,
// sans aucun parametre pour le changer, E-1), le `.deb` et le `.rpm` (ecriture dans l'arbre
// systeme + enregistrement aupres du gestionnaire de paquets, E-9) EXIGENT un privilege eleve —
// et ce sont EXACTEMENT les trois formes que ce portefeuille EXCLUT (AR-W1(a), AR-W2(a)), pas
// parce qu'elles seraient hors de portee technique, mais parce qu'elles elevent. Ce commentaire
// d'origine est laisse EN PLACE ci-dessus, NON EFFACE : il documente ce qui etait vrai quand seul
// macOS etait prouve (§ 10 du cadrage parent, lot C.1).
//
// TABLE DE CLES (§ 2.1 du lot W-L/W-W) : `cleManifestePlateforme` rend un COUPLE ORDONNE
// `{ installeur, generique }`, lu DANS L'ORDRE DU PLUGIN updater (M6) : `{os}-{arch}-{installer}`
// PUIS `{os}-{arch}`. C'est la convention que les deux apps PUBLIENT deja et que leur propre
// client consomme deja (`tauri-plugin-updater` 2.10.1) — on la REUTILISE, on n'en invente pas une
// seconde. `installeur` vaut `null` quand aucune forme installeur n'existe pour cette plateforme
// (macOS : seule la forme generique `.app.tar.gz` existe, AR-3 de L40).
export function cleManifestePlateforme({ platform = os.platform(), arch = os.arch() } = {}) {
  if (platform === 'darwin') {
    if (arch === 'arm64') return { installeur: null, generique: 'darwin-aarch64' };
    if (arch === 'x64') return { installeur: null, generique: 'darwin-x86_64' };
  }
  if (platform === 'linux' && arch === 'x64') {
    return { installeur: 'linux-x86_64-appimage', generique: 'linux-x86_64' };
  }
  // AJOUT LOT W-W (2026-09-05, § 2.1) : `windows-x86_64-nsis` D'ABORD (le `.exe` NSIS, AR-W1(a) —
  // le SEUL artefact Windows que ce lot lit), `windows-x86_64` en repli (M6). **Le `.msi` n'est
  // JAMAIS lu** : sa clé (`windows-x86_64-msi`) n'apparait NULLE PART dans ce fichier — pas meme
  // comme un repli refuse explicitement, exactement comme AR-W2(a) exclut `-deb`/`-rpm` sur Linux.
  if (platform === 'win32' && arch === 'x64') {
    return { installeur: 'windows-x86_64-nsis', generique: 'windows-x86_64' };
  }
  // « Tout le reste » n'est pas vide, et c'est deliberer (§ 2.1) : linux/arm64, win32/arm64 et
  // darwin/ia32 restent NON COUVERTS — les manifestes reels ne portent que du x86_64 hors macOS
  // (M5). Le refus CA-15 survit a ce lot ; il retrecit, il ne disparait pas (CA-W15).
  return null;
}

/**
 * Selection installeur -> generique (M6), en FONCTION PURE : recoit le couple ordonne rendu par
 * `cleManifestePlateforme` et le manifeste resolu, et rend la clé PLATE (une chaine) a lire dans
 * `manifeste.platforms`, en essayant `installeur` D'ABORD, `generique` EN REPLI — jamais l'inverse.
 * Rend `null` si NI L'UNE NI L'AUTRE n'existe : c'est le cas CA-W6 (un manifeste qui ne porte QUE
 * `-deb`/`-rpm` ne doit JAMAIS faire gagner ces clés par defaut — ce non-repli est le critere).
 */
export function resoudreCleManifeste(manifeste, cle) {
  const platforms = (manifeste && manifeste.platforms) || {};
  if (!cle) return null;
  if (cle.installeur && platforms[cle.installeur] && platforms[cle.installeur].url) {
    return cle.installeur;
  }
  if (cle.generique && platforms[cle.generique] && platforms[cle.generique].url) {
    return cle.generique;
  }
  return null;
}

/**
 * Famille de pose (macOS / Linux / Windows), derivee du couple `cle` — SOURCE UNIQUE (le prefixe
 * de la clé generique, qui encode deja la plateforme), jamais une seconde lecture de `os.platform()`
 * qui pourrait diverger de ce que `plateforme` a simule dans un test (M10 : `plateforme` est un
 * point d'injection PUR).
 */
export function familleDePose(cle) {
  if (!cle || !cle.generique) return null;
  if (cle.generique.startsWith('darwin-')) return 'darwin';
  if (cle.generique.startsWith('linux-')) return 'linux';
  if (cle.generique.startsWith('windows-')) return 'windows';
  return null;
}

/** Nom de fichier cible, par famille de pose — le `.app` n'est plus ecrit en dur (M3). */
export function nomFichierCible(appNom, famille) {
  if (famille === 'linux') return `${appNom}.AppImage`;
  if (famille === 'windows') return `${appNom}-setup.exe`; // lot W-W : forme temporaire, non posee telle quelle
  return `${appNom}.app`; // darwin, inchange
}

/**
 * Resout le manifeste d'une app via ses endpoints ORDONNES (M10), en REUTILISANT le contrat de
 * failover DEJA EPROUVE de `lib/endpoints.js` (`resoudre` — CA-11, lot 0) plutot que d'en
 * reecrire un second. `resoudreEndpoints` est un point d'INJECTION de test (defaut : le vrai
 * `resoudre` reseau) — meme idiome que `sondes`/`execNpmInstall` de l'etape 1.
 */
export async function resoudreManifesteApp(app, { resoudreEndpoints = resoudre } = {}) {
  return resoudreEndpoints(app.endpoints, {});
}

/**
 * Telecharge l'octet annonce par le manifeste pour `cle`, et verifie sa signature minisign AVANT
 * de rendre quoi que ce soit d'utilisable — CA-14 : un bundle sans signature valide est REFUSE,
 * jamais pose. `telecharger` est un point d'INJECTION de test (defaut : le vrai `getBytes`
 * reseau).
 */
export async function telechargerEtVerifier({ app, manifeste, cle, telecharger = getBytes }) {
  const entree = manifeste && manifeste.platforms && manifeste.platforms[cle];
  if (!entree || !entree.url) {
    return { ok: false, raison: `plateforme "${cle}" absente du manifeste ${app.nom} (v${manifeste && manifeste.version})` };
  }
  const rep = await telecharger(entree.url);
  if (!rep.ok || !rep.octets || rep.octets.length === 0) {
    return { ok: false, raison: `ECHEC telechargement ${entree.url} (statut ${rep.status})` };
  }
  if (!entree.signature) {
    return { ok: false, raison: `CA-14 : aucune signature annoncee pour "${cle}" — bundle REFUSE, jamais pose sans signature` };
  }
  let v;
  try {
    const clePublique = parsePublicKey(app.pubkey);
    v = verifierMinisign({ octets: rep.octets, signature: entree.signature, clePublique });
  } catch (e) {
    return { ok: false, raison: `CA-14 : signature illisible — bundle REFUSE : ${e.message}` };
  }
  const bonne = v.valide && v.globaleValide && v.keyIdConcorde;
  if (!bonne) {
    return { ok: false, raison: `CA-14 : SIGNATURE INVALIDE (${v.motif}) — bundle REFUSE, jamais pose` };
  }
  return { ok: true, octets: rep.octets, url: entree.url, version: manifeste.version };
}

/**
 * Pose un bundle `.app.tar.gz` (format updater Tauri, macOS) : extrait l'archive dans un dossier
 * temporaire, verifie qu'elle porte EXACTEMENT un `.app`, puis le copie a `cible`. L'appelant a
 * DEJA pris la sauvegarde AVANT cet appel (lib/rollback.js, AR-5 garde 1) : cette fonction ne
 * gere QUE l'ecriture avant, jamais la securite de son annulation.
 */
export function poserBundleDarwin({ octets, cible }) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-install-bundle-'));
  try {
    const tarPath = path.join(tmpDir, 'bundle.tar.gz');
    fs.writeFileSync(tarPath, octets);
    const extractDir = path.join(tmpDir, 'extrait');
    fs.mkdirSync(extractDir, { recursive: true });
    const res = spawnSync('tar', ['-xzf', tarPath, '-C', extractDir], { encoding: 'utf8' });
    if (res.status !== 0) {
      return { ok: false, raison: `\`tar\` a echoue (code ${res.status}) : ${res.stderr || res.error}` };
    }
    const entrees = fs.readdirSync(extractDir).filter((n) => n.endsWith('.app'));
    if (entrees.length !== 1) {
      return { ok: false, raison: `bundle inattendu : ${entrees.length} entree(s) ".app" dans l'archive (1 attendue)` };
    }
    const source = path.join(extractDir, entrees[0]);
    fs.mkdirSync(path.dirname(cible), { recursive: true });
    fs.rmSync(cible, { recursive: true, force: true });
    fs.cpSync(source, cible, { recursive: true });
    return { ok: true, cible };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

/**
 * Pose un bundle AppImage (Linux, lot W-L, § 2.2) : ECRIT LES OCTETS DEJA VERIFIES (CA-14 est en
 * amont, rien a y toucher) directement a `cible`, puis pose le bit d'execution. Rien d'autre — pas
 * d'archive a ouvrir, pas de sous-processus, pas de dependance. La cible est un FICHIER
 * remplaçable dans son entier : `sauvegarderAvantEtape`/`restaurerEtape` (lib/rollback.js)
 * fonctionnent SANS modification (M2) — l'appelant a DEJA pris la sauvegarde AVANT cet appel,
 * exactement comme `poserBundleDarwin`.
 */
export function poserBundleLinux({ octets, cible }) {
  try {
    fs.mkdirSync(path.dirname(cible), { recursive: true });
    fs.writeFileSync(cible, octets);
    fs.chmodSync(cible, 0o755);
    return { ok: true, cible };
  } catch (e) {
    return { ok: false, raison: `écriture de l'AppImage a échoué (${cible}) : ${e.message}` };
  }
}

// ==================================================================================================
// Lot ETAPES-3-4-WINDOWS-LINUX / W-W (Windows) — ajouts 2026-09-05. RIEN CI-DESSUS N'EST TOUCHE
// (macOS et Linux inchanges, y compris leurs commentaires).
// ==================================================================================================

function execRegReel(cmd, args) { return spawnSync(cmd, args, { encoding: 'utf8' }); }
function execSpawnReel(cmd, args) { return spawnSync(cmd, args, { encoding: 'utf8' }); }

/**
 * AR-5 Windows (§ 2.3 de l'instruction) : decouvre si une version de `productName` est DEJA
 * installee, en lisant la cle de desinstallation HKCU deja MESUREE et GATEE a l'etape 0 de ce
 * portefeuille (`HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\<productName>`, nom
 * LITTERAL — pas de GUID, SHCTX=HKCU en `currentUser`). DEUX requetes `reg query` distinctes,
 * jamais une seule : la premiere teste la PRESENCE de la cle (sans `/v`), la seconde lit la valeur
 * `InstallLocation` (`/v`) — un `reg.exe` reel rend un code non nul dans les DEUX cas ("cle
 * absente" ET "cle presente mais valeur absente"), et ce fichier ne peut pas les distinguer avec
 * UNE seule requete. `execReg` est le port d'INJECTION (M-10, meme idiome que `sondes`/
 * `execNpmInstall`) : la production lance le VRAI `reg.exe`, sans shell (spawnSync avec un
 * tableau d'arguments, jamais une chaine interpretee) ; les tests injectent un double qui rejoue
 * le FORMAT REEL de sortie Windows (mesure fournie par Aragorn a l'etape 0 : lignes tabulees
 * `InstallLocation    REG_SZ    "C:\Users\x\AppData\Local\IakaCockpit"`, guillemets LITTERAUX
 * inclus dans la valeur — le NSIS de Tauri les ecrit tels quels via `"$INSTDIR"`).
 *
 * Rend TROIS formes, jamais une quatrieme (§ 2.3) :
 *   - `{ existe:false, installLocation:null }` — rien n'est installe (rollback = uninstall.exe
 *     apres coup, cas "rien avant") ;
 *   - `{ existe:true, installLocation:<chemin> }` — cle trouvee, `InstallLocation` LISIBLE (apres
 *     retrait des guillemets litteraux) ET le dossier EXISTE reellement sur le disque (verifie ici
 *     par `fs.existsSync`, jamais suppose) ;
 *   - `{ existe:true, installLocation:null }` — cle trouvee mais la valeur est absente, illisible,
 *     VIDE, ou pointe sur un dossier DISPARU : c'est le cas qui commande le REFUS D'ECRIRE au
 *     site d'appel (etapeApp) — CE FICHIER NE REFUSE RIEN LUI-MEME, il MESURE et rend le fait tel
 *     quel ; c'est a l'appelant de decider, exactement comme `resoudreCleManifeste` ne refuse pas
 *     non plus, il rend `null` et laisse `etapeApp` REFUSER en NOMMANT la cause (CA-W6/CA-W10).
 */
export function decouvrirInstallationWindows({ productName, execReg = execRegReel } = {}) {
  const cle = `HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\${productName}`;
  const resCle = execReg('reg', ['query', cle]);
  if (!resCle || resCle.status !== 0) {
    return { existe: false, installLocation: null };
  }
  const resValeur = execReg('reg', ['query', cle, '/v', 'InstallLocation']);
  if (!resValeur || resValeur.status !== 0) {
    return { existe: true, installLocation: null };
  }
  const sortie = String(resValeur.stdout || '');
  const m = sortie.match(/InstallLocation\s+REG_SZ\s+(.*)/i);
  if (!m) return { existe: true, installLocation: null };
  let valeur = m[1].trim();
  // Les guillemets LITTERAUX poses par le NSIS (`"$INSTDIR"`, mesure d'etape 0) sont retires ICI,
  // jamais a la source : `reg.exe` les rend TELS QUELS, ils font partie de la donnee stockee.
  if (valeur.length >= 2 && valeur.startsWith('"') && valeur.endsWith('"')) {
    valeur = valeur.slice(1, -1).trim();
  }
  if (!valeur || !fs.existsSync(valeur)) {
    return { existe: true, installLocation: null }; // absente, vide, OU dossier disparu (§2.3 cas 3)
  }
  return { existe: true, installLocation: valeur };
}

/**
 * Pose Windows (§ 2.2) : ecrit l'octet DEJA VERIFIE (CA-14 est en amont, rien a y toucher) dans un
 * fichier TEMPORAIRE `<tmp>/<nomFichier>`, puis EXECUTE l'installeur NSIS en silencieux — `/S`
 * SEUL (AR-W1(a) tranche : le `.exe` NSIS `currentUser`, sans UAC ; JAMAIS `/R`, qui relancerait
 * l'app sans un second consentement — le feu vert de CETTE etape couvre la pose, pas un
 * redemarrage, AR-4). Node pur, `spawnSync` avec un TABLEAU d'arguments (jamais un shell, jamais
 * une chaine interpretee). Le code de sortie de l'installeur EST le verdict (§ 2.2) : non nul ⇒
 * ECHEC NOMME avec le code — 2 est le code d'ABANDON par defaut de NSIS (mesure d'etape 0), 0 le
 * SEUL succes reconnu ; aucun autre code n'est suppose. Le temporaire est SUPPRIME dans TOUS les
 * cas (succes, echec, exception) — jamais laisse trainer sur le disque de l'utilisateur.
 *
 * Cette fonction NE CONNAIT PAS et NE CHOISIT PAS le dossier d'installation reel (E-4 : `/D=`
 * n'agit pas en silencieux) — c'est `decouvrirInstallationWindows`, appelee par l'appelant APRES
 * un succes, qui l'apprend en relisant le registre. `exec` est le port d'INJECTION (M-10) : la
 * production lance le VRAI `<setup>.exe /S`, les tests injectent un double qui compte ses appels
 * (CA-W10/CA-W13 : ce compteur doit rester a 0 en refus et en dry-run) et rejoue un code de
 * sortie 0/2.
 */
export function poserBundleWindows({ octets, nomFichier, exec = execSpawnReel }) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-install-bundle-win-'));
  const setupPath = path.join(tmpDir, nomFichier);
  try {
    fs.writeFileSync(setupPath, octets);
    const res = exec(setupPath, ['/S']);
    const code = res && typeof res.status === 'number' ? res.status : null;
    if (code !== 0) {
      const raison = code === 2
        ? `installeur NSIS ABANDONNE (code de sortie 2, abandon par defaut de NSIS) : ${nomFichier} /S`
        : `\`${nomFichier} /S\` a echoue (code ${code === null ? 'indetermine' : code})`;
      return { ok: false, raison };
    }
    return { ok: true };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
