// Resolution du RESERVOIR (vivant vs embarque) pour le verbe `install` — AR-F de
// specs/instructions/chaine-complete-install-amorcage-dmg-msi.md § 4.0/4.6.
//
// CE QUE CE MODULE RESOUT, ET POUR QUI. Le CLI qui tourne (« embarque ») porte SA PROPRE
// version, derivee de `cli/package.json` au moment ou il a ete publie/bundle (VERSION.js,
// `_bundled/VERSION`). Un arbre source local (« vivant » — typiquement <chapeau>/iakaframe,
// le depot que le decideur edite) PEUT porter une version plus recente, egale, plus ancienne,
// ou INDETERMINEE (un install.mjs sans cli/ a cote, cf. AR-F consequence 2). La regle d'egalite
// n'est PAS un cas de bord : sur le poste du decideur, qui fait tourner le CLI DEPUIS ce meme
// arbre vivant, `vivantVersion === embarqueVersion` PAR CONSTRUCTION (M3) — c'est le cas NOMINAL,
// pas un `else`.
//
// REGLE (verbatim, AR-F(a)) : « le plus recent gagne ; a egalite, le vivant. »
//   - vivant absent (pas d'install.mjs trouve)         -> embarque, seul source possible.
//   - vivant present, version indeterminee              -> vivant gagne QUAND MEME (dit en provenance).
//   - vivant present, version > embarque                -> vivant.
//   - vivant present, version === embarque (cas nominal) -> vivant.
//   - vivant present, version < embarque                -> embarque.
//
// CE QUE CE MODULE NE FAIT PAS. Il ne resout AUCUNE source RESEAU (GitHub/npm, AR-H) : c'est le
// chemin de repli quand AUCUN reservoir vivant n'est trouve du tout, porte par install.js lui-meme
// (etape 1, sens « mise a jour »). Il ne lit et n'ecrit RIEN d'autre que ce qu'il faut pour
// comparer deux versions et nommer un chemin — zero dependance runtime.
//
// LE DRAPEAU `--reservoir bundled` EST HORS PERIMETRE (AR-F consequence 4, decide) : aucune
// option ici pour forcer l'embarque. `root` (ci-dessous) couvre deja le besoin d'epingler un
// arbre PRECIS — c'est `--root` du verbe `install`, pas un forcage de reservoir.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveRoot } from './root.js';
import { packageVersion } from './version.js';

// --- Reservoir EMBARQUE : ce qui voyage AVEC le CLI qui tourne -----------------------------
// lib/reservoir.js -> ../../ = cli/. _bundled est genere par `cli/scripts/bundle.js` au
// prepack/publish ; en dev (source non bundlee), il peut etre absent -> repli sur
// `cli/package.json` (c'est exactement la valeur que `_bundled/VERSION` aurait derivee, cf.
// bundle.js:98-110 — meme autorite, lue directement plutot qu'a travers un fichier absent).
export function embarqueDir() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
}

export function embarqueInfo() {
  const dir = embarqueDir();
  const versionFile = path.join(dir, '_bundled', 'VERSION');
  let version = null;
  try {
    version = fs.readFileSync(versionFile, 'utf8').trim().replace(/^v/i, '');
  } catch { /* _bundled absent (dev non-bundle) : repli package.json */ }
  if (!version) version = packageVersion();
  return { dir, version };
}

// --- Reservoir VIVANT : un arbre source sur disque, marque par la presence d'`install.mjs` --
// (M4 : « l'installeur de la methode existe deja... a la racine du depot »). C'est CE marqueur,
// pas `library/`+`methods/` (marqueur plus large de `kit.js:hasFrameworkMarker`, qui matcherait
// aussi `_bundled/`, lequel N'A PAS d'install.mjs, cf. cli/scripts/bundle.js:ASSETS) : le
// reservoir vivant de l'etape 2 doit pouvoir EXECUTER install.mjs, pas seulement lister une lib.
export function vivantHasInstaller(dir) {
  try { return fs.existsSync(path.join(dir, 'install.mjs')); } catch { return false; }
}

// Racine vivante CANDIDATE : `root` explicite (--root du verbe install) verbatim — « epingler un
// arbre » (AR-F consequence 4) — sinon la convention <chapeau>/iakaframe deja etablie ailleurs
// dans ce CLI (cf. lib/library.js:55, meme ancre que la GUI, paths.rs resolve_iakaframe_home).
export function candidateVivantRoot(root) {
  if (root) return path.resolve(root);
  // resolveRoot() lit directement process.env.IAKAFRAME_ROOT (cf. lib/root.js) : pas d'injection
  // d'env ici, meme contrat que resolveRoot partout ailleurs dans le CLI.
  return path.join(resolveRoot(undefined), 'iakaframe');
}

// Version du vivant, ou `null` = INDETERMINEE (AR-F consequence 2 : install.mjs present, mais
// aucun `cli/package.json` a cote pour porter une version — ex. mesure : un frame-release
// claude-only). Ne JAMAIS lever : une erreur de lecture vaut indetermine, pas un crash de `install`.
export function vivantVersion(dir) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'cli', 'package.json'), 'utf8'));
    if (pkg && typeof pkg.version === 'string' && pkg.version) return pkg.version;
  } catch { /* cli/ absent, ou package.json illisible/sans version : indetermine */ }
  return null;
}

// Comparaison numerique simple X.Y.Z (segments manquants = 0). Suffisant pour ce depot : les
// versions manipulees ici sont TOUJOURS des semver nus (cf. version.js), jamais des plages ni du
// pre-release — une lib semver complete serait une dependance pour un besoin qui n'en a pas.
export function compareVersions(a, b) {
  const pa = String(a).split('.').map(n => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map(n => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const da = pa[i] || 0, db = pb[i] || 0;
    if (da !== db) return da > db ? 1 : -1;
  }
  return 0;
}

// Ligne de provenance — FORMAT IMPOSE (AR-F consequence 3, chaine-complete-install-amorcage-
// dmg-msi.md § 4.0), recopie telle quelle, jamais reinvente. Dit *quoi* ET *pourquoi* : une
// provenance qui nomme la source sans nommer la raison du choix ne permet pas de diagnostiquer
// une bascule.
// Appelee UNIQUEMENT quand un reservoir vivant a ete TROUVE (install.mjs present) : le cas « aucun
// vivant » est un message distinct, construit directement par `resoudreReservoir` (aucune
// comparaison de version n'a de sens sans second terme).
export function formatProvenance({ source, vivantRoot, vivantVersion: vv, embarqueVersion: ev }) {
  const vTag = vv == null ? 'version indéterminée' : `v${vv}`;
  if (source === 'vivant') {
    if (vv == null) {
      return `réservoir : vivant ${vivantRoot} (${vTag}) — embarqué v${ev}, le vivant l'emporte`;
    }
    const cmp = compareVersions(vv, ev);
    const raison = cmp === 0 ? 'égalité, le vivant l\'emporte' : 'plus récent, le vivant l\'emporte';
    return `réservoir : vivant ${vivantRoot} (${vTag}) — embarqué v${ev}, ${raison}`;
  }
  // source === 'embarque', vivant present mais plus ancien
  return `réservoir : embarqué (v${ev}) — vivant v${vv}, plus ancien`;
}

// --- Resolution complete, AR-F(a) --------------------------------------------------------------
export function resoudreReservoir({ root } = {}) {
  const embarque = embarqueInfo();
  const vivantRoot = candidateVivantRoot(root);
  const present = vivantHasInstaller(vivantRoot);

  if (!present) {
    const info = {
      source: 'embarque',
      vivantRoot: null,
      vivantRootCandidat: vivantRoot,
      vivantPresent: false,
      vivantVersion: null,
      embarqueDir: embarque.dir,
      embarqueVersion: embarque.version,
      installMjsPath: null, // AUCUN install.mjs embarque (cli/scripts/bundle.js ne le copie pas) :
      // l'etape 2 ne peut pas deleguer sans un reservoir vivant. Signale explicitement par
      // install.js, jamais un repli silencieux sur un install.mjs qui n'existe pas.
    };
    info.provenance = `réservoir : embarqué (v${embarque.version}) — aucun réservoir vivant trouvé (install.mjs absent sous ${vivantRoot})`;
    return info;
  }

  const vv = vivantVersion(vivantRoot);
  const source = vv == null ? 'vivant' : (compareVersions(vv, embarque.version) >= 0 ? 'vivant' : 'embarque');

  return {
    source,
    vivantRoot,
    vivantRootCandidat: vivantRoot,
    vivantPresent: true,
    vivantVersion: vv,
    embarqueDir: embarque.dir,
    embarqueVersion: embarque.version,
    installMjsPath: source === 'vivant' ? path.join(vivantRoot, 'install.mjs') : null,
    provenance: formatProvenance({ source, vivantRoot, vivantVersion: vv, embarqueVersion: embarque.version }),
  };
}
