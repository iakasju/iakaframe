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
export function sauvegarderAvantEtape({ backupDir, etape, cible }) {
  const existaitAvant = fs.existsSync(cible);
  const horodatage = new Date().toISOString().replace(/[:.]/g, '-');
  const dossierPreuve = path.join(backupDir, `etape-${etape}-${horodatage}`);
  fs.mkdirSync(dossierPreuve, { recursive: true });
  let backupPath = null;
  if (existaitAvant) {
    backupPath = path.join(dossierPreuve, path.basename(cible));
    fs.cpSync(cible, backupPath, { recursive: true });
  }
  const preuve = { etape, cible, existaitAvant, backupPath, horodatage, dossierPreuve };
  fs.writeFileSync(path.join(dossierPreuve, 'preuve.json'), JSON.stringify(preuve, null, 2));
  return preuve;
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
export function restaurerEtape(preuve) {
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
  try {
    if (preuveDisque.existaitAvant) {
      fs.rmSync(preuveDisque.cible, { recursive: true, force: true });
      fs.cpSync(preuveDisque.backupPath, preuveDisque.cible, { recursive: true });
      return { ok: true, defait: true, raison: `restaure : ${preuveDisque.cible} (etait deja present avant la chaine — garde 2, jamais efface)` };
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
export function orchestrerRollback(preuves) {
  const valides = (preuves || []).filter(Boolean);
  const rapports = [...valides].reverse().map((p) => ({ etape: p.etape, cible: p.cible, ...restaurerEtape(p) }));
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
