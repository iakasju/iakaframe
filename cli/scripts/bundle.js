// Prepack : copie les assets iakaframe (hors du paquet) dans cli/_bundled/ pour qu'ils
// soient embarques dans le tarball publie. _bundled/ est gitignore (genere).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const cliDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(cliDir, '..');
const bundled = path.join(cliDir, '_bundled');

// Rangement courant : les kits deployables vivent sous kits/iakaframe-<famille>, et la racine
// du framework est reconnue par le double marqueur library/ + methods/ (cf. kit.js
// hasFrameworkMarker).
//
// DEFAUT REPARE : `teams` et `bindings` MANQUAIENT a cette liste. Le paquet publie livrait donc
// les personas SANS les equipes qui les assemblent ni les appariements runner/modele — alors que
// `list`, `add` et `remove` traitent les TROIS types d'assemblage (teams | methods | bindings).
// Une installation npm arrivait avec une bibliotheque amputee, et rien ne le signalait.
//
// `required: true` = le framework est INUTILISABLE sans : on refuse de produire un bundle
// mutile plutot que de publier en silence. C'est cette garde qui manquait.
const ASSETS = [
  { name: 'library', required: true },
  { name: 'methods', required: true },
  { name: 'teams', required: true },
  { name: 'bindings', required: true },
  { name: 'kits', required: true },
  { name: 'design-naonedge', required: false },
  { name: 'agents', required: false },
  { name: 'skills', required: false },
];

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}

fs.rmSync(bundled, { recursive: true, force: true });
fs.mkdirSync(bundled, { recursive: true });

let n = 0;
const manquants = [];
for (const a of ASSETS) {
  const src = path.join(repoRoot, a.name);
  if (fs.existsSync(src)) {
    copyDir(src, path.join(bundled, a.name));
    n++;
    console.log(`  + _bundled/${a.name}`);
  } else if (a.required) {
    manquants.push(a.name);
    console.error(`  ! ${a.name} MANQUANT (requis)`);
  } else {
    console.log(`  = ${a.name} absent (ignore)`);
  }
}
if (manquants.length) {
  console.error(
    `bundle REFUSE : asset(s) requis manquant(s) : ${manquants.join(', ')}.\n` +
      "  Publier sans eux livrerait une bibliotheque amputee, sans que rien ne le signale.",
  );
  process.exit(1);
}

// Coherence du reservoir embarque : chaque persona cite au roster d'une team bundlee doit
// exister dans les personas bundles. C'est le controle qui aurait attrape un bundle partiel
// (le defaut constate : `charon` present a la racine, absent du bundle publie).
const personasDir = path.join(bundled, 'library', 'personas');
const connus = new Set(
  fs.existsSync(personasDir)
    ? fs.readdirSync(personasDir).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3))
    : [],
);
const pendants = [];
const teamsDir = path.join(bundled, 'teams');
for (const f of fs.existsSync(teamsDir) ? fs.readdirSync(teamsDir) : []) {
  if (!f.endsWith('.md')) continue;
  const txt = fs.readFileSync(path.join(teamsDir, f), 'utf8');
  const m = txt.match(/^personas:\s*\[(.*?)\]/m);
  if (!m) continue;
  for (const id of m[1].split(',').map((x) => x.trim().replace(/^["']|["']$/g, '')).filter(Boolean)) {
    if (!connus.has(id)) pendants.push(`${f} -> ${id}`);
  }
}
if (pendants.length) {
  console.error(`bundle REFUSE : persona(s) cite(s) au roster et absent(s) du bundle :`);
  for (const p of pendants) console.error(`  - ${p}`);
  process.exit(1);
}

// Version figee, DERIVEE de l'autorite (cli/package.json), pas de l'etat des lieux.
// Lire l'autorite en PREMIER garantit que le bundle ne peut jamais re-injecter une valeur
// perimee, quel que soit l'ordre bundle/snapshot (cf. dette « source unique de version »).
// L'etat des lieux reste un repli (projets sans package.json d'autorite).
let version = '';
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(cliDir, 'package.json'), 'utf8'));
  if (pkg.version) version = 'v' + pkg.version;
} catch { /* ignore */ }
if (!version) {
  try {
    const md = fs.readFileSync(path.join(repoRoot, 'specs', 'etat-des-lieux.md'), 'utf8');
    const m = md.match(/^\|\s*Version\s*\|\s*(.+?)\s*\|/m);
    if (m) version = m[1].trim();
  } catch { /* ignore */ }
}
if (version) fs.writeFileSync(path.join(bundled, 'VERSION'), version + '\n', 'utf8');

console.log(
  `bundle OK : ${n} asset(s), ${connus.size} personas, roster coherent -> _bundled/` +
    `${version ? ` (version ${version})` : ''}`,
);
