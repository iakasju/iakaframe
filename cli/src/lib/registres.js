// Registres npm du scope @naonedge — LISTE ORDONNEE (lot 0, 0.d ; arbitrage AR-7).
//
// CE QUE CE MODULE EST, ET CE QU'IL N'EST PAS. C'est la DONNEE : l'ordre dans lequel un
// installeur devra essayer les registres, et rien d'autre. La BASCULE elle-meme — essayer
// dans l'ordre et DIRE lequel a repondu — appartient au verbe `install` (AR-7 (a)), qui est
// le LOT A. Rien ici ne tente une installation, ne resout un paquet ni ne touche a `.npmrc`.
//
// POURQUOI LA DONNEE ARRIVE AVANT LE VERBE. `publishConfig` (package.json) et `.npmrc` ne
// designent qu'UN registre chacun : npm n'a pas de bascule native (AR-7). La redondance doit
// donc vivre dans notre code, et elle commence par une liste explicite — sans quoi le lot A
// n'aurait rien a parcourir et re-cablerait une adresse en dur, exactement le defaut A3.
//
// 🛑 LE TROISIEME CANAL N'EST PAS DESIGNE. L'instruction le dit noir sur blanc : « GitHub
// n'heberge pas de registre npm prive dans cette configuration ; le troisieme canal npm est
// donc a designer (Packages GitHub, ou tarball par (c)) — c'est la seule inconnue du lot 0 ».
// On ne l'invente PAS ici : une entree fabriquee donnerait trois registres declares pour deux
// reels, c'est-a-dire precisement le faux sentiment de securite de R7. La liste en porte DEUX,
// et le manque est nomme par la constante ci-dessous.
export const TROISIEME_REGISTRE_A_DESIGNER =
  'Packages GitHub ou repli tarball (AR-7 option c) — arbitrage du decideur, non tranche au 2026-08-28';

// Ordre = celui dans lequel un installeur devra essayer. Le primaire DOIT rester aligne sur
// `cli/package.json` (publishConfig) et `cli/.npmrc` : c'est la garde forge-host-parity.
const DEFAUT = [
  'http://192.168.1.139:3001/api/packages/sjupin/npm/',   // NAS — forge courante
  'http://192.168.2.11:3001/api/packages/sjupin/npm/',    // iakabox — hors service, secours
];

// Pilotable sans toucher au code, meme convention CSV que FORGEJO_URL / IAKAFRAME_HOSTS.
export function registresNpm() {
  const raw = process.env.IAKAFRAME_NPM_REGISTRIES;
  if (!raw) return DEFAUT.slice();
  const l = raw.split(',').map(s => s.trim()).filter(Boolean);
  return l.length ? l : DEFAUT.slice();
}

// Registre de PUBLICATION (le premier). La publication en trois passes (AR-7 (b)) consiste a
// parcourir `registresNpm()` — un `npm publish --registry <url>` par entree. Ce parcours est
// du LOT A : il exige un jeton PAR registre, qui n'existe pas encore ici.
export function registrePrimaire() { return registresNpm()[0]; }
