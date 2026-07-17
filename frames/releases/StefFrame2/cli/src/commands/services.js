// iakaframe services - sonde git(Forgejo)/Ollama/ComfyUI sur des hotes candidats.
// Iso du iakaframe-services.ps1 (memes defauts, meme schema JSON).
import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { getJson } from '../lib/http.js';

const DEFAULT_HOSTS = (process.env.IAKAFRAME_HOSTS && process.env.IAKAFRAME_HOSTS.split(",").map(s => s.trim()).filter(Boolean)) || ["localhost", "127.0.0.1"];

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
      json: { type: 'string' },            // chemin de sortie
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

  // Rapport lisible
  console.log('\n=== iakaframe - services detectes ===');
  for (const r of results) {
    const mark = r.available ? '[OK]' : '[--]';
    const where = r.available ? `${r.url}  ${r.detail}` : `introuvable (port ${r.port})`;
    console.log(`  ${mark} ${r.service.padEnd(14)} ${where}`);
  }
  console.log('');

  if (values.json) {
    const dir = path.dirname(values.json);
    if (dir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const payload = {
      generated: new Date().toISOString().slice(0, 16).replace('T', ' '),
      services: results,
    };
    fs.writeFileSync(values.json, JSON.stringify(payload, null, 2), 'utf8');
    console.log(`services.json ecrit -> ${values.json}`);
  }
  return results;
}
