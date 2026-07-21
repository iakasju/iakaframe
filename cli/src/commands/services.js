// iakaframe services - sonde git(Forgejo)/Ollama/ComfyUI sur des hotes candidats.
// Sortie machine C-JSON (§ 2) : `--json` est un BOOLEEN -> emet sur stdout
//   { ok, generated, count, services:[...] }. L'ecriture fichier (ex-`--json <fichier>`) passe a
//   `--out <fichier>` (rupture assumee § 8). Iso du iakaframe-services.ps1 (memes defauts/schema).
import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { getJson } from '../lib/http.js';
import { emit, ok } from '../lib/output.js';

// Hotes candidats : NEUTRES par defaut, pilotes par variable d'environnement.
//
// POURQUOI. Cette constante portait des IP privees en dur (le LAN d'un poste precis). Le miroir
// `frames/releases/` avait deja, lui, la forme pilotee par env var : le miroir etait MEILLEUR que
// sa source. Scrubber le miroir aurait aggrave le fork ; on neutralise donc la SOURCE, et le fork
// disparait a la racine (specs/instructions/outillage-scrub-miroir-frame.md § 2.5, Lot 0).
// Intention deja ecrite en son temps : frame-stefframe2.md:137 « pilote par variables
// d'environnement sans defaut LAN ».
//
// USAGE : renseigner `IAKAFRAME_HOSTS` (CSV) dans `~/work/.env` pour retrouver les hotes du LAN.
// `--hosts` reste prioritaire sur l'env var.
const FALLBACK_HOSTS = ['localhost', '127.0.0.1'];

function envHosts() {
  const raw = process.env.IAKAFRAME_HOSTS;
  if (!raw) return null;
  const list = raw.split(',').map(s => s.trim()).filter(Boolean);
  return list.length ? list : null;
}

const DEFAULT_HOSTS = envHosts() || FALLBACK_HOSTS;

const SERVICES = [
  { name: 'git (Forgejo)', port: 3001, path: '/api/v1/version',
    detail: b => (b && b.version) ? 'v' + b.version : '' },
  { name: 'Ollama', port: 11434, path: '/api/tags',
    detail: b => (b && Array.isArray(b.models)) ? `${b.models.length} modeles` : '' },
  { name: 'ComfyUI', port: 8188, path: '/system_stats',
    detail: () => 'OK' },
];

export async function runServices(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      hosts: { type: 'string' },           // CSV
      json: { type: 'boolean', default: false }, // drapeau stdout (C-JSON)
      out: { type: 'string' },             // [nouveau] chemin de sortie fichier (ex-`--json <fichier>`)
      timeout: { type: 'string', default: '3' },
    },
  });
  const hosts = values.hosts ? values.hosts.split(',').map(s => s.trim()).filter(Boolean) : DEFAULT_HOSTS;
  const timeoutMs = Math.max(800, (parseInt(values.timeout, 10) || 3) * 1000);

  const results = [];
  for (const svc of SERVICES) {
    let found = null;
    for (const h of hosts) {
      const url = `http://${h}:${svc.port}${svc.path}`;
      const r = await getJson(url, timeoutMs);
      if (r.ok) {
        found = { service: svc.name, available: true, host: h, port: svc.port,
                  url: `http://${h}:${svc.port}`, detail: svc.detail(r.body) };
        break;
      }
    }
    if (!found) found = { service: svc.name, available: false, host: '', port: svc.port, url: '', detail: '' };
    results.push(found);
  }

  const generated = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const payload = ok({ generated, count: results.length, services: results });

  // Ecriture fichier optionnelle (ex-`--json <fichier>`, deplacee vers `--out`).
  if (values.out) {
    const dir = path.dirname(values.out);
    if (dir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(values.out, JSON.stringify(payload, null, 2), 'utf8');
  }

  emit(values.json, payload, () => {
    console.log('\n=== iakaframe - services detectes ===');
    for (const r of results) {
      const mark = r.available ? '[OK]' : '[--]';
      const where = r.available ? `${r.url}  ${r.detail}` : `introuvable (port ${r.port})`;
      console.log(`  ${mark} ${r.service.padEnd(14)} ${where}`);
    }
    console.log('');
    if (values.out) console.log(`services.json ecrit -> ${values.out}`);
  });
  return results;
}
