// Corollaire AR-1/AR-4 (specs/instructions/chaine-complete-install-amorcage-dmg-msi.md § 5.5,
// obligation d'implementation CA-08) : la garde de DESARMEMENT de l'auto-deploiement du kit
// hote PENDANT la chaine du verbe `install`.
//
// LE RISQUE NOMME, TEL QUEL. « Pendant la chaine, l'etape 1 installe le CLI. Si ce CLI
// fraichement pose est invoque avant l'etape 2, son auto-deploiement AR-1 se declenchera — et
// posera le kit avant que l'utilisateur ait valide l'etape 2. AR-1 aurait alors court-circuite
// AR-4 dans son dos. » (§ 5.5).
//
// PORTEE, DITE — CE QUE CE MODULE N'EST PAS. AR-1 lui-meme (bundle-complet-install-4-
// composants.md, tranche (a) le 2026-08-28 : « le CLI deploie le kit hote au premier lancement,
// si absent, sans rien demander ») N'EST PAS CABLE globalement dans ce depot : aucun des 40
// verbes de `lib/verbes.js` ne le declenche, `index.js#main()` ne porte aucun hook « premier
// lancement ». Mesure a l'execution de CE lot (chaine-complete-install-amorcage-dmg-msi.md ne le
// signale pas) — le cabler sur les 40 verbes serait un lot A PART, hors perimetre de celui-ci
// (§7 de l'instruction ne liste que install.js/reservoir.js/verbes.js/index.js, pas les 40
// dispatchers). Ce module couvre EXACTEMENT le risque cite ci-dessus, confine au SEUL point ou
// il existe aujourd'hui : la transition etape 1 -> etape 2 DU VERBE install LUI-MEME.
import path from 'node:path';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const BLOCK_START = '<!-- iakaframe:start -->';

// Le kit hote (claude) est considere DEPLOYE si son contrat de projet porte le bloc iakaframe —
// meme marqueur qu'install.mjs (BLOCK_START/BLOCK_END), jamais un second vocabulaire de detection.
export function kitHoteDeploye(targetClaude) {
  try {
    const txt = fs.readFileSync(path.join(targetClaude, 'CLAUDE.md'), 'utf8');
    return txt.includes(BLOCK_START);
  } catch {
    return false;
  }
}

// Le SEUL trigger d'AR-1 que ce lot construit. Si le kit hote est absent :
//   - `desarme: true`  -> AR-1 est SUSPENDU pour la duree de la chaine, RIEN n'est pose, et la
//                         raison ecrite le dit explicitement (jamais un saut silencieux) ;
//   - `desarme: false` -> AR-1 se DECLENCHE REELLEMENT : le kit est pose SANS DEMANDER (definition
//                         meme d'AR-1(a)), en deleguant a install.mjs (meme mecanique que l'etape
//                         2 du verbe install, REUTILISEE — jamais reimplementee).
// Retourne un rapport { declenche, raison, ... } — jamais un booleen nu : la RAISON est ce que le
// corollaire exige d'ecrire, et c'est elle qui rend le contrefactuel (CA-08) NOMMABLE.
export function verifierAutoDeploiement({ installMjsPath, kitsDir, targetClaude, desarme }) {
  if (kitHoteDeploye(targetClaude)) {
    return { declenche: false, raison: "kit hôte déjà déployé (AR-1 sans objet)" };
  }
  if (desarme) {
    return {
      declenche: false,
      raison: "AR-1 désarmé pour la durée de la chaîne (corollaire AR-1/AR-4, § 5.5) : "
        + "le kit hôte reste absent jusqu'à validation explicite de l'étape 2",
    };
  }
  const r = spawnSync(process.execPath, [
    installMjsPath, '--kits-dir', kitsDir, '--hosts', 'claude',
    '--target-claude', targetClaude, '--yes',
  ], { encoding: 'utf8' });
  return {
    declenche: true,
    raison: "AR-1 : kit hôte absent, déploiement automatique déclenché SANS confirmation "
      + "(garde de désarmement inactive)",
    status: r.status,
    stdout: r.stdout,
    stderr: r.stderr,
  };
}
