// Double de test reseau pour `iakaframe install` — cli/test/fixtures/, DELIBEREMENT hors de
// `src/` (specs/instructions/chaine-complete-install-amorcage-dmg-msi.md, correction du
// TROISIEME gate qualite, 2026-09-04).
//
// POURQUOI CE FICHIER VIT ICI ET PAS DANS `src/commands/install.js`. `cli/package.json:12-16`
// (`files: ["src", "_bundled", "README.md"]`) embarque TOUT `src/` dans le tarball publie — verifie
// par `npm pack --dry-run` (546 fichiers, dont `src/commands/install.js`, 18,2 kB). `cli/test/`
// N'EST PAS dans `files` : AUCUN fichier de ce dossier ne part jamais dans un paquet publie,
// verifiable par la MEME commande. Un double vivant dans `src/` serait une porte livree a tout
// utilisateur de la voie publique qu'AR-H vient d'acter, meme inactive par defaut — c'est
// EXACTEMENT le defaut mesure par le gate sur la version precedente de ce correctif. Le sortir
// d'ici rend l'activation en dehors d'un clone source STRUCTURELLEMENT IMPOSSIBLE : `install.js`
// tente un `import()` dynamique de ce chemin RELATIF, qui echoue proprement (MODULE_NOT_FOUND)
// des que `cli/test/` n'existe pas — cf. lib/network-double.js:resoudreDoubleReseau.
//
// SONDES TOUJOURS INJOIGNABLES — jamais un « répond avec succès » fabriqué ici. La propriété
// « une source qui répond avec une version plus récente est reprise » est déjà prouvée par les
// sondes injectées DIRECTEMENT (sans passer par ce fichier) dans
// cli/test/etape1-reseau-ecarte.test.js. Ce double ne couvre qu'un seul besoin : zéro réseau réel
// et zéro `npm install -g` réel pour les tests qui doivent spawn le binaire CLI complet
// (cli/test/install-verbe.test.js, qui ne peut pas injecter de fonctions JS a travers un
// sous-processus).
export const sondes = [
  async () => ({ nom: 'DOUBLE-TEST (cli/test/fixtures/install-network-double.mjs) : sonde toujours injoignable', repond: false }),
];

// Ne doit JAMAIS etre atteint : les sondes ci-dessus sont toujours injoignables, `cible` reste
// donc toujours `null` dans `etape1Cli`. Garde de defense en profondeur, pas un chemin normal.
export function execNpmInstall() {
  throw new Error('install-network-double.mjs actif : execNpmInstall ne doit jamais être atteint (sondes toujours injoignables)');
}
