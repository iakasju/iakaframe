// Support commun du banc de preuve CI — etapes 3/4 (CA-W19, specs/instructions/
// etapes-3-4-windows-linux.md § 5 Etape 3, § 8 « gate humain par OS »). ZERO DEPENDANCE, Node pur
// — meme discipline que le reste du CLI. Ce fichier ne connait AUCUNE logique d'installation : il
// ne fait qu'assembler un tableau { mesure, attendu, obtenu, verdict } et l'ecrire dans
// $GITHUB_STEP_SUMMARY (§5 de l'ordre de mission : « pour que le decideur lise le run sans ouvrir
// les logs »). Les bancs `banc-etapes-3-4-linux.mjs`/`-windows.mjs` appellent l'API du CLI
// directement (etapeApp, restaurerEtape) ; ce module n'en reimplemente rien.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const VOCABULAIRE_VERDICT = ['PASS', 'FAIL', 'NON-MESURE'];

/** Une ligne de mesure. `verdict` est FERME (§8 : « un critere non mesure se declare NON MESURE,
 * jamais PASS » — une formule d'ensemble muette est refusee ici a la source). */
export function ligne(mesure, attendu, obtenu, verdict) {
  if (!VOCABULAIRE_VERDICT.includes(verdict)) {
    throw new Error(`banc-support.mjs : verdict hors vocabulaire ferme ("${verdict}") pour la mesure "${mesure}"`);
  }
  return { mesure, attendu: String(attendu), obtenu: String(obtenu), verdict };
}

/** sha256 d'UN fichier (l'AppImage Linux, un fichier remplaçable dans son entier — M2). */
export function sha256Fichier(chemin) {
  return crypto.createHash('sha256').update(fs.readFileSync(chemin)).digest('hex');
}

/** sha256 recursif d'UN dossier (le dossier d'installation Windows) : hash du nom relatif ET du
 * contenu de chaque fichier, dans un ORDRE STABLE (tri des chemins relatifs) — deux dossiers avec
 * les memes fichiers aux memes chemins et le meme contenu rendent le meme sha256, quel que soit
 * l'ordre de lecture du systeme de fichiers. */
export function sha256Dossier(dossier) {
  const relatifs = [];
  (function marcher(dir, prefixe) {
    for (const nom of fs.readdirSync(dir)) {
      const p = path.join(dir, nom);
      const rel = prefixe ? `${prefixe}/${nom}` : nom;
      if (fs.statSync(p).isDirectory()) marcher(p, rel);
      else relatifs.push(rel);
    }
  })(dossier, '');
  relatifs.sort();
  const h = crypto.createHash('sha256');
  for (const rel of relatifs) {
    h.update(rel);
    h.update(fs.readFileSync(path.join(dossier, ...rel.split('/'))));
  }
  return h.digest('hex');
}

/** Ecrit le tableau dans $GITHUB_STEP_SUMMARY (si present) ET sur stdout (toujours) ; fixe le
 * code de sortie du process a 1 si au moins une mesure est en FAIL — un job qui rougit doit le
 * faire NOMMEMENT (§5/§6 de l'ordre de mission), jamais un vert muet qui avale un echec. */
export function ecrireResume(titre, lignes) {
  const enTete = '| Mesure | Attendu | Obtenu | Verdict |\n|---|---|---|---|\n';
  const icone = { PASS: '✅ PASS', FAIL: '🔴 FAIL', 'NON-MESURE': '⚪ NON-MESURE' };
  const corps = lignes.map((l) => `| ${l.mesure} | ${l.attendu} | ${l.obtenu} | ${icone[l.verdict]} |`).join('\n');
  const bloc = `## ${titre}\n\n${enTete}${corps}\n`;
  const cible = process.env.GITHUB_STEP_SUMMARY;
  if (cible) fs.appendFileSync(cible, `${bloc}\n`);
  console.log(bloc);
  const echecs = lignes.filter((l) => l.verdict === 'FAIL');
  if (echecs.length > 0) {
    console.error(`\n${echecs.length} mesure(s) EN ECHEC, NOMMEMENT : ${echecs.map((l) => l.mesure).join(' | ')}`);
    process.exitCode = 1;
  }
}

/** Repertoire de bac a sable, TOUJOURS sous $RUNNER_TEMP — jamais un dossier hote de l'utilisateur
 * (garde statique verifiee independamment par cli/test/guard-banc-etapes-3-4.test.js). */
export function racineBacASable() {
  const base = process.env.RUNNER_TEMP;
  if (!base) {
    throw new Error('banc-support.mjs : $RUNNER_TEMP absent — ce banc REFUSE de deviner un dossier hote de l\'utilisateur.');
  }
  return base;
}
