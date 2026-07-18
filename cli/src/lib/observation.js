// Substrat d'OBSERVATION silencieuse d'Odin (CTO du portefeuille). DISTINCT du canon
// review-gate (~/.iaka/memory/ : PROFIL/REGISTRE + reservoir proposals/ + geste `review`). Ici :
// ecriture DIRECTE, SANS consentement, SANS reservoir, IDEMPOTENTE. Le store vit au niveau CHAPEAU
// (<IAKAFRAME_ROOT>/.iaka/observation/, resolu par resolveRoot), surchargeable via --home (tests).
// Assertions DURES de frontiere : ce chemin n'est JAMAIS ~/.iaka/memory/ ni sous ~/.claude/.
// Layout : un fichier par projet `<project>.md` + un agregat portefeuille `_portefeuille.md`.
// Zero dependance. Primitive puce-datee factorisee depuis lib/bullet.js (source-unique). Ce module
// n'importe JAMAIS proposals/ ni review : l'accumulation reste silencieuse et non-gatee.
import fs from 'node:fs';
import path from 'node:path';
import { resolveRoot } from './root.js';
import { isUnderClaudeHome, defaultMemoryHome } from './memory.js';
import { isEntryLine, entryContent, appendBullet, serializeLines } from './bullet.js';

const PORTFOLIO_FILE = '_portefeuille.md';

// Resolution du store d'observation. Priorite : opt (--home) > <IAKAFRAME_ROOT>/.iaka/observation/.
// Refuse ~/.claude/ (frontiere reutilisee de memory.js) ET le canon review-gate ~/.iaka/memory/
// (le store d'observation en est PHYSIQUEMENT distinct : jamais de collision).
export function resolveObservationHome(opt, rootOpt) {
  const raw = opt || path.join(resolveRoot(rootOpt), '.iaka', 'observation');
  const resolved = path.resolve(raw);
  if (isUnderClaudeHome(resolved)) {
    throw new Error(
      `Observation interdite sous ~/.claude/ : ${resolved}. Le store d'observation est un substrat ` +
      `NEUTRE au niveau chapeau (defaut <IAKAFRAME_ROOT>/.iaka/observation/) ; jamais couple a un runner.`,
    );
  }
  if (resolved === path.resolve(defaultMemoryHome())) {
    throw new Error(
      `Observation distincte du canon review-gate : ${resolved} ne doit pas etre ~/.iaka/memory/. ` +
      `Le canon est review-gate (proposals/ + review) ; l'observation est silencieuse et non-gatee.`,
    );
  }
  return resolved;
}

// Nom de fichier sur (un fichier par projet). Conserve lettres/chiffres/._- ; le reste -> '-'.
function slug(name) {
  return String(name).trim().replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '') || 'projet';
}

export function projectPath(home, project) { return path.join(home, `${slug(project)}.md`); }
export function portfolioPath(home) { return path.join(home, PORTFOLIO_FILE); }

// En-tete d'un fichier d'observation (pose une seule fois, non destructif).
function head(title) {
  return `# ${title}\n\n` +
    `<!-- Observation SILENCIEUSE d'Odin (substrat non-gate, DISTINCT du canon review-gate ` +
    `~/.iaka/memory/). Ecrit sans consentement par \`iakaframe observe\`. Entrees = puces datees ` +
    `idempotentes. Nourrit une PROPOSITION de DIFF de STRATEGIE.md validee par l'utilisateur SEUL. -->\n`;
}

function readLines(file, title) {
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : head(title);
  return text.replace(/\n+$/, '').split('\n');
}

function writeLines(file, lines) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, serializeLines(lines), 'utf8');
}

// Ecrit une note d'observation (idempotente). scope = { project: <nom> } ou { portfolio: true }.
// Aucune interaction, aucun reservoir : append direct d'une puce datee si absente.
export function observe(home, scope, note) {
  const text = String(note || '').trim();
  if (!text) throw new Error('Note vide : rien a observer.');
  const isPortfolio = !!scope.portfolio;
  if (!isPortfolio && !scope.project) throw new Error('Preciser --project <nom> ou --portfolio.');
  const file = isPortfolio ? portfolioPath(home) : projectPath(home, scope.project);
  const title = isPortfolio ? 'OBSERVATION — portefeuille (transverse)' : `OBSERVATION — ${scope.project}`;
  const before = readLines(file, title);
  const { lines, changed } = appendBullet(before, text);
  if (changed) writeLines(file, lines);
  return { ok: true, home, file, scope: isPortfolio ? 'portfolio' : scope.project, changed };
}

// Liste les entrees. Sans scope : agrege l'ensemble des fichiers du store.
export function observeList(home, scope = {}) {
  const files = [];
  if (scope.portfolio) files.push(portfolioPath(home));
  else if (scope.project) files.push(projectPath(home, scope.project));
  else if (fs.existsSync(home)) {
    for (const f of fs.readdirSync(home)) if (f.endsWith('.md')) files.push(path.join(home, f));
  }
  return files.map((file) => {
    if (!fs.existsSync(file)) return { file, entries: [] };
    const entries = fs.readFileSync(file, 'utf8').split('\n').filter(isEntryLine).map(entryContent);
    return { file, entries };
  });
}
