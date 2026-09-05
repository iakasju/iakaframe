// Le moteur de ROLLBACK et ses TROIS gardes (AR-5, § 4.0/§ 5.4/§ 9 de specs/instructions/
// chaine-complete-install-amorcage-dmg-msi.md, lot C.1). Portee de CE fichier, dite explicitement
// (meme discipline que lib/autodeploi.js pour AR-1) : il couvre les etapes qui ecrivent une CIBLE
// remplacable dans son ENTIER (un dossier applicatif) — les etapes 3 (IakaCockpit) et 4
// (iakaFrameGUI) du verbe `install`. Il NE couvre PAS l'etape 1 (mise a jour globale du paquet
// npm du CLI : rien de local et remplacable dans son entier a sauvegarder — « reprise »,
// CA-07, reste le remede) ni l'etape 2 (delegue a `install.mjs`, qui porte DEJA son propre
// `--backup-dir`, M4 — une seconde sauvegarde ferait double emploi avec un mecanisme deja
// eprouve). Si un lot futur donne a l'etape 1 ou 2 une cible remplacable dans son entier, CE
// moteur est celui qu'il faut reutiliser — jamais un second.
//
// LES TROIS GARDES, VERBATIM DE L'ARBITRAGE (AR-5(c)) :
//   1. « il ne defait que ce qu'il peut PROUVER avoir change — sauvegarde horodatee prise AVANT
//      chaque etape — et REFUSE explicitement de derouler si la sauvegarde manque, au lieu de
//      supprimer a l'aveugle » -> `sauvegarderAvantEtape` (avant), `restaurerEtape` (refus si la
//      preuve manque ou est corrompue).
//   2. « il ne retire jamais ce qu'il n'a pas pose — une app deja presente est RESTAUREE, pas
//      effacee » -> `restaurerEtape` bifurque sur `existaitAvant`.
//   3. « le rollback peut lui-meme echouer : il enonce ce qu'il a su defaire ET ce qu'il n'a pas
//      su, jamais un "restaure" global » -> `orchestrerRollback` ne rend JAMAIS une phrase
//      d'ensemble sans enumeration.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

/**
 * GARDE 1 (moitie "avant") — sauvegarde horodatee de `cible`, PRISE AVANT toute ecriture de
 * l'etape. Si `cible` n'existe pas encore, la preuve le dit (`existaitAvant: false`) : c'est une
 * mesure a part entiere, pas une absence de mesure — le rollback, plus tard, saura qu'il n'y a
 * rien a restaurer, seulement a retirer ce qu'IL a pose (garde 2).
 *
 * Leve une exception si la sauvegarde elle-meme echoue (disque plein, permissions...) : l'appelant
 * doit alors REFUSER de poursuivre l'ecriture plutot que d'ecrire sans filet — symetrique de la
 * garde 1 cote deroulement.
 */
export function sauvegarderAvantEtape({ backupDir, etape, cible, plateforme = null }) {
  const existaitAvant = fs.existsSync(cible);
  const horodatage = new Date().toISOString().replace(/[:.]/g, '-');
  const dossierPreuve = path.join(backupDir, `etape-${etape}-${horodatage}`);
  fs.mkdirSync(dossierPreuve, { recursive: true });
  let backupPath = null;
  if (existaitAvant) {
    backupPath = path.join(dossierPreuve, path.basename(cible));
    fs.cpSync(cible, backupPath, { recursive: true });
  }
  // `plateforme` (AJOUT LOT W-W, optionnel, defaut null) : uniquement pose a `'windows'` par
  // l'appelant Windows (etapeApp) — jamais lu ni ecrit par macOS/Linux, champ inerte pour eux
  // (deepEqual non exerce sur `preuve` par les tests existants, aucune regression).
  const preuve = { etape, cible, existaitAvant, backupPath, horodatage, dossierPreuve, plateforme };
  fs.writeFileSync(path.join(dossierPreuve, 'preuve.json'), JSON.stringify(preuve, null, 2));
  return preuve;
}

/**
 * AR-5 Windows, cas § 2.3 point 2 "rien n'existait avant" : AUCUNE cible n'est connue a
 * sauvegarder — le NSIS `currentUser` choisit lui-meme son dossier (E-4, `--apps-dir` sans effet,
 * CA-W9) et on ne l'apprend qu'APRES la pose, en relisant le registre (`decouvrirInstallationWindows`,
 * app-bundle.js). On ENREGISTRE quand meme une preuve horodatee AVANT d'ecrire quoi que ce soit :
 * c'est la garde 1 dans sa lettre ("mesure honnete d'absence", meme discipline que
 * `sauvegarderAvantEtape` sur une cible qui n'existe pas encore) — juste sans dossier a copier.
 * `completerPreuveWindowsApresPose` la complete une fois l'installeur passe.
 */
export function ouvrirPreuveWindowsSansExistant({ backupDir, etape }) {
  const horodatage = new Date().toISOString().replace(/[:.]/g, '-');
  const dossierPreuve = path.join(backupDir, `etape-${etape}-${horodatage}`);
  fs.mkdirSync(dossierPreuve, { recursive: true });
  const preuve = {
    etape, cible: null, existaitAvant: false, backupPath: null, horodatage, dossierPreuve,
    plateforme: 'windows', windowsUninstall: null,
  };
  fs.writeFileSync(path.join(dossierPreuve, 'preuve.json'), JSON.stringify(preuve, null, 2));
  return preuve;
}

/**
 * Complete une preuve Windows ouverte par `ouvrirPreuveWindowsSansExistant`, APRES que la pose a
 * REUSSI et que le registre a ete RELU (§ 2.3 point 3 : "l'uninstall.exe que la pose vient de
 * creer") : enregistre le dossier reellement pose (`cible`, pour l'affichage) et le chemin de
 * l'`uninstall.exe` que le rollback devra lancer en `/S` si une etape suivante echoue. Reecrit le
 * meme fichier `preuve.json` (source unique relue par `restaurerEtape`, jamais un objet en
 * memoire seul — meme discipline que le reste de ce fichier).
 */
export function completerPreuveWindowsApresPose(preuve, { cible = null, cheminUninstall } = {}) {
  const misAJour = { ...preuve, cible: cible ?? preuve.cible, windowsUninstall: { chemin: cheminUninstall } };
  fs.writeFileSync(path.join(preuve.dossierPreuve, 'preuve.json'), JSON.stringify(misAJour, null, 2));
  return misAJour;
}

/**
 * Defait UNE etape, a partir de sa preuve. Rend TOUJOURS un rapport `{ ok, defait, raison }` —
 * jamais une exception : un rollback qui plante au lieu de rendre compte serait pire que celui
 * qu'il remplace (garde 3).
 *
 * GARDE 1 (moitie "pendant") : si la preuve est absente, illisible, ou si la sauvegarde qu'elle
 * annonce a disparu du disque -> REFUS explicite de derouler. Ne JAMAIS supprimer `cible` sur la
 * seule foi d'un objet preuve en memoire : on RELIT le fichier de preuve sur disque, pour que la
 * meme regle protege un appel direct ET une reprise apres redemarrage du processus.
 *
 * GARDE 2 : `existaitAvant` decide tout. Vrai -> restaure (jamais efface). Faux -> retire ce que
 * CETTE chaine a pose (rien d'autre : on ne peut pas avoir efface ce qu'on n'a pas soi-meme pose,
 * puisque `existaitAvant` etait faux au moment de la sauvegarde).
 */
// `execDesinstalleur` (AJOUT LOT W-W, optionnel) : port d'INJECTION (M-10) pour le SEUL cas
// Windows "rien n'existait avant" (§ 2.3 point 3) — la production lance le VRAI `uninstall.exe`
// que la pose a cree, les tests injectent un double qui compte ses appels et rejoue un code de
// sortie. Absent de tout appel macOS/Linux existant : leur comportement est BYTE-IDENTIQUE a
// avant ce lot (aucune de leurs preuves ne porte `windowsUninstall`, la branche n'est jamais
// atteinte pour elles).
export function restaurerEtape(preuve, { execDesinstalleur = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8' }) } = {}) {
  if (!preuve) {
    return {
      ok: false, defait: false,
      raison: 'REFUS : aucune preuve de sauvegarde fournie — le rollback refuse de derouler a l\'aveugle (garde 1, AR-5)',
    };
  }
  let preuveDisque;
  try {
    preuveDisque = JSON.parse(fs.readFileSync(path.join(preuve.dossierPreuve, 'preuve.json'), 'utf8'));
  } catch (e) {
    return {
      ok: false, defait: false,
      raison: `REFUS : fichier de preuve introuvable ou illisible (${preuve.dossierPreuve}) — le rollback refuse de derouler a l'aveugle (garde 1, AR-5) : ${e.message}`,
    };
  }
  if (preuveDisque.existaitAvant && (!preuveDisque.backupPath || !fs.existsSync(preuveDisque.backupPath))) {
    return {
      ok: false, defait: false,
      raison: `REFUS : sauvegarde attendue absente (${preuveDisque.backupPath || 'chemin non enregistre'}) — le rollback refuse de supprimer a l'aveugle plutot que de deviner (garde 1, AR-5)`,
    };
  }
  // GARDE 3, second usage (§ 2.3 point 3, AR-W5) : sur Windows, la restauration d'un dossier NE
  // RETABLIT PAS les valeurs de registre (DisplayVersion pointe deja la version neuve) ni les
  // raccourcis du menu Demarrer reecrits par l'installeur — ce lot donne a la garde 3 sa RAISON
  // supplementaire de ne jamais rendre une phrase d'ensemble. Suffixe ajoute UNIQUEMENT quand la
  // preuve est marquee `plateforme:'windows'` (jamais pour macOS/Linux, dont les preuves ne
  // portent pas ce champ) : les raisons existantes restent EXACTEMENT celles d'avant ce lot.
  const suffixeResiduWindows = preuveDisque.plateforme === 'windows'
    ? ' — RESIDU NON RETABLI (garde 3, AR-W5) : les valeurs de registre (DisplayVersion, UninstallString) et les raccourcis du menu Demarrer poses par l\'installeur ne sont PAS retablis par ce rollback.'
    : '';
  try {
    if (preuveDisque.existaitAvant) {
      fs.rmSync(preuveDisque.cible, { recursive: true, force: true });
      fs.cpSync(preuveDisque.backupPath, preuveDisque.cible, { recursive: true });
      return { ok: true, defait: true, raison: `restaure : ${preuveDisque.cible} (etait deja present avant la chaine — garde 2, jamais efface)${suffixeResiduWindows}` };
    }
    // Cas Windows "rien n'existait avant" (§ 2.3 point 3) : on ne RETIRE PAS le dossier par
    // `rmSync` (ce serait un demi-rollback qui laisserait l'enregistrement de desinstallation,
    // les raccourcis et les associations derriere lui, § 2.3) — on lance l'`uninstall.exe` que la
    // pose a cree, en silencieux (`/S`, E-5), et c'est SON code de sortie qui decide.
    if (preuveDisque.windowsUninstall && preuveDisque.windowsUninstall.chemin) {
      const res = execDesinstalleur(preuveDisque.windowsUninstall.chemin, ['/S']);
      const code = res && typeof res.status === 'number' ? res.status : null;
      if (code !== 0) {
        return {
          ok: false, defait: false,
          raison: `ECHEC de la desinstallation (${preuveDisque.windowsUninstall.chemin} /S, code ${code === null ? 'indetermine' : code}) — garde 3 : enonce, jamais un "restaure" global`,
        };
      }
      return {
        ok: true, defait: true,
        raison: `desinstalle via ${preuveDisque.windowsUninstall.chemin} /S (rien n'existait avant la chaine — garde 2, jamais efface)${suffixeResiduWindows}`,
      };
    }
    fs.rmSync(preuveDisque.cible, { recursive: true, force: true });
    return { ok: true, defait: true, raison: `retire : ${preuveDisque.cible} (rien n'existait avant la chaine — jamais pose par un tiers, garde 2)` };
  } catch (e) {
    return { ok: false, defait: false, raison: `ECHEC du rollback de ${preuveDisque.cible} : ${e.message} (garde 3 : enonce, jamais un "restaure" global)` };
  }
}

/**
 * GARDE 3 : orchestre le defaisage de PLUSIEURS etapes deja executees, dans l'ordre INVERSE de
 * leur execution (la derniere ecrite est la premiere defaite), et rend un resume qui ENUMERE —
 * jamais une phrase d'ensemble du type "tout restaure". `preuves` peut contenir des entrees
 * `null`/`undefined` (etape jamais atteinte, ou refusee avant toute ecriture) : elles sont
 * filtrees, elles n'ont rien a defaire.
 */
// `execDesinstalleur` (AJOUT LOT W-W, optionnel) : simple relais vers `restaurerEtape` pour
// chaque preuve — voir sa documentation ci-dessus. Absence => comportement PRE-EXISTANT inchange.
export function orchestrerRollback(preuves, { execDesinstalleur } = {}) {
  const valides = (preuves || []).filter(Boolean);
  const rapports = [...valides].reverse().map((p) => ({
    etape: p.etape, cible: p.cible,
    ...restaurerEtape(p, execDesinstalleur ? { execDesinstalleur } : undefined),
  }));
  const defaits = rapports.filter((r) => r.ok).map((r) => r.etape);
  const nonDefaits = rapports.filter((r) => !r.ok).map((r) => r.etape);
  let resume;
  if (rapports.length === 0) {
    resume = 'rollback : rien a defaire (aucune etape ecrite avant l\'echec)';
  } else if (nonDefaits.length === 0) {
    resume = `rollback : etape(s) [${defaits.join(', ')}] defaite(s), chacune avec sa preuve — jamais annonce comme "tout restaure" (garde 3)`;
  } else {
    resume = `rollback PARTIEL — defait : [${defaits.join(', ') || 'aucune'}] — PAS defait : [${nonDefaits.join(', ')}] (garde 3 : enonce, jamais un "restaure" global)`;
  }
  return { rapports, resume, defaits, nonDefaits };
}
