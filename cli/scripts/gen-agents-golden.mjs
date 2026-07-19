#!/usr/bin/env node
// Producteur UNIQUE du golden de parite CLI<->GUI (specs/instructions/parite-generateurs-contrat.md).
//
// Le CLI est la REFERENCE (renderAgentContract) : ce script fige, pour les 8 personas canon + le
// binding defaut, le contrat `.claude/agents/<id>.md` reellement rendu. Chaque golden porte un
// EN-TETE de provenance (commentaire hors frontmatter, retire au comparatif) + le `sha256` du
// contenu utile (le contrat lui-meme). La copie GUI est byte-a-byte identique (meme header, meme
// hash) : toute derive de format casse les DEUX tests de parite (effet cliquet bilateral).
//
// Rituel de resynchronisation (format de contrat modifie) :
//   1. node cli/scripts/gen-agents-golden.mjs        (regenere les 8 goldens + hash cote CLI)
//   2. re-vendorer les 8 fichiers dans la GUI :
//      cp cli/test/fixtures/agents-golden/*.md \
//         ../iakaFrameGUI/packages/core/__tests__/fixtures/agents-golden/
//   3. les deux suites doivent repasser (CLI + GUI).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { generateAll } from '../src/lib/generate-agents.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..'); // depot iakaframe (vraie bibliotheque)
const OUT = path.join(HERE, '..', 'test', 'fixtures', 'agents-golden');

// En-tete de provenance (identique dans les deux depots). NE contient jamais `---\n` : le
// comparatif retrouve le contrat en coupant sur le 1er `---\n`.
function header(id, sha) {
  return (
    '<!-- iakaframe:agent-contract-golden — NE PAS EDITER A LA MAIN\n' +
    'Reference : iakaframe/cli src/lib/generate-agents.js renderAgentContract (referent gate)\n' +
    `Intrants  : library/personas/${id}.md + bindings/iakaframe-claude-default.md\n` +
    'Regenerer : node cli/scripts/gen-agents-golden.mjs  (puis re-vendorer les 8 fichiers cote GUI)\n' +
    `sha256    : ${sha}\n` +
    '-->\n'
  );
}

export function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const contracts = generateAll({ root: REPO });
  const ids = [...contracts.keys()].sort();
  for (const id of ids) {
    const contract = contracts.get(id);
    const file = header(id, sha256(contract)) + contract;
    fs.writeFileSync(path.join(OUT, `${id}.md`), file);
  }
  process.stdout.write(`golden : ${ids.length} contrats ecrits dans ${OUT}\n`);
}

main();
