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

// --- CA-15 : la plateforme COUVERTE par ce lot, et REFUS EXPLICITE pour toutes les autres -------
// § 10 de l'instruction : « prouvable sur ce poste (macOS arm64) » est la SEULE recette reelle
// disponible a l'execution de ce lot. Le format `.app.tar.gz` (cles GENERIQUES `darwin-*` du
// manifeste, cf. M11) est la SEULE forme installable SANS assistant interactif ni privilege
// eleve sur AUCUNE des quatre plateformes — extraction + copie, rien d'autre. Windows (`.msi`/
// `.exe`) et Linux (`.deb`/`.rpm`/`.AppImage`) exigent soit un installeur a invoquer (msiexec,
// dpkg/rpm) soit un rendu executable + lancement (AppImage) : hors de portee de ce qui est
// PROUVABLE ici (§ 10), donc HORS de ce que ce lot IMPLEMENTE — jamais simule.
export function cleManifestePlateforme({ platform = os.platform(), arch = os.arch() } = {}) {
  if (platform === 'darwin') {
    if (arch === 'arm64') return 'darwin-aarch64';
    if (arch === 'x64') return 'darwin-x86_64';
  }
  return null;
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
