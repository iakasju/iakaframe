// Decision GATEE (DEUX signaux independants) permettant a `install.js` de charger, EN CONTEXTE DE
// TEST UNIQUEMENT, le double reseau qui vit HORS de `src/` (cli/test/fixtures/
// install-network-double.mjs — jamais publie, cf. ce fichier pour le motif complet).
//
// CE MODULE-CI EST PUBLIE (il vit dans src/, donc part dans le tarball — `files:
// ["src","_bundled","README.md"]`), MAIS NE PORTE AUCUNE IMPLEMENTATION DE DOUBLE : ni sonde
// fabriquee, ni execNpmInstall fabrique, ni URL, ni commande arbitraire — seulement la DECISION
// et un chargement CONDITIONNEL d'un chemin qui n'existe structurellement PAS hors d'un clone
// source (correction du TROISIEME gate qualite, 2026-09-04 : la version precedente livrait le
// double lui-meme dans src/commands/install.js, sans seconde garde — mesure par `npm pack
// --dry-run`, 546 fichiers dont install.js, 18,2 kB).
//
// DEUX SIGNAUX, LES DEUX REQUIS — l'un sans l'autre ne suffit JAMAIS a activer le double :
//   1. IAKAFRAME_INSTALL_TEST_DOUBLE=1 — intention EXPLICITE, posee par le test lui-meme.
//   2. NODE_TEST_CONTEXT — pose par NODE LUI-MEME, jamais par un profil shell ni un `.env`
//      oublie : c'est le test runner natif (`node --test`) qui le definit pour ses processus,
//      et il est HERITE par tout sous-processus qu'ils spawnent (verifie : un `spawnSync` lance
//      depuis un test `node --test` recoit `NODE_TEST_CONTEXT=child-v8` dans son `process.env`,
//      sans rien de special cote appelant — c'est le comportement DEFAUT de l'heritage d'env).
//      Une variable oubliee dans un profil shell peut mimer le signal 1 ; personne ne mime par
//      accident le comportement interne du test runner de Node.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DOUBLE_REL = path.join('..', '..', 'test', 'fixtures', 'install-network-double.mjs');

export function doitActiverDouble(env = process.env) {
  return env.IAKAFRAME_INSTALL_TEST_DOUBLE === '1' && Boolean(env.NODE_TEST_CONTEXT);
}

// Tente de charger le double. `actif:false` si les DEUX signaux ne sont pas reunis (repli
// silencieux LEGITIME : c'est le chemin de production normal, pas une anomalie a signaler) OU si
// le fichier est introuvable APRES demande explicite (cas normal hors d'un clone source : le
// paquet publie ne porte pas `cli/test/`) — dans CE second cas, un diagnostic est ecrit sur
// stderr (jamais un silence total quand le double a ete DEMANDE mais ne peut pas repondre).
export async function resoudreDoubleReseau(env = process.env) {
  if (!doitActiverDouble(env)) return { actif: false, sondes: undefined, execNpmInstall: undefined };
  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const mod = await import(path.join(here, DOUBLE_REL));
    return { actif: true, sondes: mod.sondes, execNpmInstall: mod.execNpmInstall };
  } catch (e) {
    console.error(
      `  ! IAKAFRAME_INSTALL_TEST_DOUBLE demande mais introuvable (${e && e.code || e}) — `
      + `repli sur les sondes reelles. Attendu hors d'un clone source complet (cli/test/ n'est `
      + `jamais publie).`,
    );
    return { actif: false, sondes: undefined, execNpmInstall: undefined };
  }
}
