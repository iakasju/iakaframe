// Prepack : copie les assets iakaframe (hors du paquet) dans cli/_bundled/ pour qu'ils
// soient embarques dans le tarball publie. _bundled/ est gitignore (genere).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const cliDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(cliDir, '..');
const bundled = path.join(cliDir, '_bundled');

const ASSETS = ['kit', 'kit-codex', 'kit-ollama', 'agents', 'skills', 'design-naonedge'];

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

// Version figee (depuis l'etat des lieux iakaframe, sinon package.json).
let version = '';
try {
  const md = fs.readFileSync(path.join(repoRoot, 'specs', 'etat-des-lieux.md'), 'utf8');
  const m = md.match(/^\|\s*Version\s*\|\s*(.+?)\s*\|/m);
  if (m) version = m[1].trim();
} catch { /* ignore */ }
if (version) fs.writeFileSync(path.join(bundled, 'VERSION'), version + '\n', 'utf8');

console.log(`bundle OK : ${n} asset(s) -> _bundled/${version ? ` (version ${version})` : ''}`);
