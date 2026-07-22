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
// hasFrameworkMarker). On embarque donc kits/ + library/ + methods/ (requis par le detecteur de
// racine cote paquet publie) plus les assets annexes (agents/skills absents => ignores).
const ASSETS = ['kits', 'library', 'methods', 'agents', 'skills', 'design-naonedge'];

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
for (const a of ASSETS) {
  const src = path.join(repoRoot, a);
  if (fs.existsSync(src)) { copyDir(src, path.join(bundled, a)); n++; console.log(`  + _bundled/${a}`); }
  else console.log(`  = ${a} absent (ignore)`);
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

console.log(`bundle OK : ${n} asset(s) -> _bundled/${version ? ` (version ${version})` : ''}`);
