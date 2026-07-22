// Source UNIQUE de verite de la version : cli/package.json (champ `version`, semver nu).
// Toute autre representation (bandeau `-v`, etat des lieux, tag git, bundle) DERIVE d'ici.
//
// Resolution robuste en ESM, valable EN SOURCE comme UNE FOIS PUBLIE :
//   - le chemin est calcule depuis import.meta.url (jamais depuis le cwd) ;
//   - `bundle.js` n'empaquete PAS/ne transpile PAS le source JS (le `bin` npm pointe
//     directement vers src/index.js) et npm embarque TOUJOURS package.json a la racine
//     du paquet, a cote de src/. Le couple <racine>/package.json + src/ reste donc
//     solidaire dans le tarball -> `../../package.json` depuis lib/ tient dans les deux cas.
//   - lecture via fs.readFileSync + JSON.parse (pas d'import attributes `with { type: 'json' }`,
//     stables seulement a partir de Node 22) pour rester compatible `engines.node >= 20`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Chemin de l'autorite, resolu une fois. lib/version.js -> ../../package.json = cli/package.json.
const PKG_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'package.json');

// Version nue (ex. "0.20.0"). Lue a chaud a chaque appel : pas de cache, pas de surprise en test.
export function packageVersion() {
  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
  return pkg.version;
}

// Version prefixee `v` (ex. "v0.20.0") pour l'affichage humain, les tags et l'etat des lieux.
export function displayVersion() {
  return 'v' + packageVersion();
}
