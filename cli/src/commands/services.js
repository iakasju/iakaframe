// iakaframe services - sonde git(Forgejo)/Ollama/ComfyUI sur des hotes candidats.
// Sortie machine C-JSON (§ 2) : `--json` est un BOOLEEN -> emet sur stdout
//   { ok, generated, count, services:[...] }. L'ecriture fichier (ex-`--json <fichier>`) passe a
//   `--out <fichier>` (rupture assumee § 8). Iso du iakaframe-services.ps1 (memes defauts/schema).
import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { getJson } from '../lib/http.js';
import { emit, ok } from '../lib/output.js';

const DEFAULT_HOSTS = ['192.168.2.11', '192.168.2.12', 'localhost', '127.0.0.1'];

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
