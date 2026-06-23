// iakaframe init - deploie le kit (claude/codex/ollama) + marqueur .iakaframe. Non destructif.
import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { frameworkRoot, kitName, contractFile, frameworkVersion, copyKit } from '../lib/kit.js';
import { now } from '../lib/date.js';

const TARGETS = ['claude', 'codex', 'ollama'];

export function runInit(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      path: { type: 'string' },
      target: { type: 'string', default: 'claude' },
      force: { type: 'boolean', default: false },
    },
  });
  if (!TARGETS.includes(values.target)) {
    console.error(`target invalide : ${values.target} (attendu: ${TARGETS.join('|')})`); process.exitCode = 1; return false;
  }
  const dest = path.resolve(values.path || process.cwd());
  const root = frameworkRoot();
  if (!root) { console.error('Racine iakaframe introuvable (dossier kit-claude/ absent).'); process.exitCode = 1; return false; }

  const kit = path.join(root, kitName(values.target));
  const contract = contractFile(values.target);
  const version = frameworkVersion(root);
  if (!fs.existsSync(kit)) { console.error(`Kit introuvable : ${kit}`); process.exitCode = 1; return false; }
  fs.mkdirSync(dest, { recursive: true });

  console.log(`iakaframe ${version} -> deploiement du kit [${values.target}] dans : ${dest}`);

  const existing = path.join(dest, contract);
  if (fs.existsSync(existing) && !values.force) {
    console.log(`  ! ${contract} existe deja : projet semble deja initialise (relancer --force pour ecraser).`);
    return true;
  }

  const { copied, skipped } = copyKit(kit, dest, { force: values.force });

  // Marqueur .iakaframe
  const stamp = [
    `iakaframe=${version}`,
    `target=${values.target}`,
    `contract=${contract}`,
    `installed=${now()}`,
  ].join('\n') + '\n';
  fs.writeFileSync(path.join(dest, '.iakaframe'), stamp, 'utf8');

  console.log(`  + .iakaframe (version ${version}, cible ${values.target})`);
  console.log(`\nTermine : ${copied} copie(s), ${skipped} ignore(s).`);
  return true;
}
