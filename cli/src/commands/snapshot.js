// iakaframe snapshot - etat des lieux (journal append-only + MD + HTML). Iso PS.
import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { isRepo, out } from '../lib/git.js';
import { now } from '../lib/date.js';
import { runCadence, formatCadence, runProjectCadence, formatProjectCadence } from '../lib/cadence.js';

const REASONS = ['version', 'pause', 'reprise', 'manual'];

const USAGE = `Usage : iakaframe snapshot [options]

Etat des lieux : journal append-only + specs/etat-des-lieux.md + .html.
A regenerer a chaque changement de version et a chaque pause/reprise.

Options :
  --path <dir>       Racine du projet (defaut : dossier courant)
  --reason <motif>   version | pause | reprise | manual (defaut : manual)
  --version <vX.Y.Z> Version a inscrire (sinon deduite du package/tag git)
  --note <txt>       Note libre ajoutee au journal
  --home <dir>       Canon de cadence (sinon IAKA_MEMORY_HOME, sinon ~/.iaka/memory/)`;

function flattenEntries(node, acc) {
  if (node == null) return;
  if (Array.isArray(node)) { for (const x of node) flattenEntries(x, acc); return; }
  if (typeof node === 'object') {
    if ('date' in node && 'reason' in node) {
      acc.push({ date: node.date, reason: node.reason, version: node.version, branch: node.branch,
                 commit: node.commit, dirty: node.dirty, files: node.files, note: node.note });
      return;
    }
    if ('value' in node) flattenEntries(node.value, acc);
  }
}

function enc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// Source unique de verite du projet iakaframe lui-meme : cli/package.json (champ version).
// On la lit AVANT de retomber sur `git describe` -> supprime la voie de la regression silencieuse
// (une cloture sans --version ne peut plus faire retomber la version sur un vieux tag).
// Pour tout AUTRE projet (pas de cli/package.json @naonedge/iakaframe), on rend '' et le flux
// `git describe` d'origine s'applique tel quel : aucune regression pour les projets tiers.
function authorityVersion(root) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'cli', 'package.json'), 'utf8'));
    if (pkg && pkg.name === '@naonedge/iakaframe' && pkg.version) return 'v' + pkg.version;
  } catch { /* pas l'autorite iakaframe -> repli git describe */ }
  return '';
}

// DERNIER recours, pour un projet TIERS : son propre package.json racine. Sans lui, tout projet
// non tague rendait « Version : - » — le cas de iakaFrameGUI, et de tout projet du portefeuille
// qui ne tague pas. Place APRES `git describe` a dessein : un projet qui tague deja garde son
// comportement mot pour mot, donc ce repli n'ajoute que du renseigne la ou il n'y avait rien.
// (Le manifeste npm seulement : un projet Rust/Go sans package.json reste sur `-`.)
function projectPackageVersion(root) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    if (pkg && typeof pkg.version === 'string' && /^\d+\.\d+\.\d+/.test(pkg.version)) return 'v' + pkg.version;
  } catch { /* pas de manifeste npm lisible -> '-' */ }
  return '';
}

function countFiles(dir) {
  let n = 0;
  const walk = (d) => {
    let entries; try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.name === '.git' || e.name === 'node_modules') continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p); else n++;
    }
  };
  walk(dir);
  return n;
}

// Coeur reutilisable par onboard/update.
// `home` (optionnel) cible le canon de la boucle d'apprentissage pour la CADENCE (T6, § 6) ; sinon
// IAKA_MEMORY_HOME, sinon ~/.iaka/memory/. `cadenceRun` est un point d'injection (defaut = runCadence).
export function doSnapshot({ projectPath, reason = 'manual', version = '', note = '', home, cadenceRun = runCadence, projectCadenceRun = runProjectCadence }) {
  const root = path.resolve(projectPath);
  const specs = path.join(root, 'specs');
  fs.mkdirSync(specs, { recursive: true });
  const journalFile = path.join(specs, '.iakaframe-journal.json');

  const git = isRepo(root);
  const branch = git ? (out(root, ['rev-parse', '--abbrev-ref', 'HEAD']) || '-') : '-';
  if (!version) version = authorityVersion(root);
  if (!version) version = git ? (out(root, ['describe', '--tags', '--abbrev=0']) || '') : '';
  if (!version) version = projectPackageVersion(root);
  if (!version) version = '-';
  const lastCommit = git ? (out(root, ['log', '-1', '--pretty=format:%h %s']) || '-') : '-';
  const dirty = git ? out(root, ['status', '--porcelain']) !== '' : false;
  const fileCount = countFiles(root);
  const ts = now();
  const project = path.basename(root);

  const recent = [];
  if (git) {
    const raw = out(root, ['log', '-10', '--pretty=format:%h|%ad|%s', '--date=short']);
    for (const l of raw.split(/\r?\n/)) { if (l) { const p = l.split('|'); recent.push({ hash: p[0], date: p[1], subject: p.slice(2).join('|') }); } }
  }

  const entries = [];
  if (fs.existsSync(journalFile)) {
    try { flattenEntries(JSON.parse(fs.readFileSync(journalFile, 'utf8')), entries); } catch { /* repart */ }
  }
  entries.push({ date: ts, reason, version, branch, commit: lastCommit, dirty, files: fileCount, note });
  fs.writeFileSync(journalFile, JSON.stringify(entries, null, 2), 'utf8');

  const byDateDesc = [...entries].sort((a, b) => String(b.date).localeCompare(String(a.date)));

  // ---- MD ----
  const md = [];
  md.push(`# Etat des lieux - ${project}`, '');
  md.push(`> Genere par iakaframe (CLI) le ${ts} (motif: ${reason}).`);
  md.push('> A regenerer a chaque changement de version et a chaque pause/reprise.', '');
  md.push('## Etat courant', '', '| Champ | Valeur |', '|---|---|');
  md.push(`| Version | ${version} |`);
  md.push(`| Branche | ${branch} |`);
  md.push(`| Dernier commit | ${lastCommit} |`);
  md.push(`| Arbre | ${dirty ? 'MODIFICATIONS NON COMMITEES' : 'propre'} |`);
  md.push(`| Fichiers (hors .git/node_modules) | ${fileCount} |`);
  if (note) md.push(`| Note | ${note} |`);
  md.push('');
  if (recent.length) {
    md.push('## Commits recents', '', '| Hash | Date | Sujet |', '|---|---|---|');
    for (const c of recent) md.push(`| \`${c.hash}\` | ${c.date} | ${c.subject} |`);
    md.push('');
  }
  md.push('## Reprise du travail (a completer par Cowork)', '');
  md.push("- **Ce qui vient d'etre fait** : <!-- ... -->");
  md.push('- **En cours / a reprendre** : <!-- ... -->');
  md.push('- **Prochaine etape concrete** : <!-- premiere action a faire en reprenant -->');
  md.push('- **Pieges connus** : <!-- ... -->', '');
  md.push('## Journal (versions & pauses)', '', '| Date | Motif | Version | Branche | Note |', '|---|---|---|---|---|');
  for (const e of byDateDesc) md.push(`| ${e.date} | ${e.reason} | ${e.version} | ${e.branch} | ${String(e.note || '').replace(/\|/g, '/')} |`);
  md.push('');
  fs.writeFileSync(path.join(specs, 'etat-des-lieux.md'), md.join('\n'), 'utf8');

  // ---- HTML ----
  let rows = '';
  for (const e of byDateDesc) rows += `<tr><td>${enc(e.date)}</td><td><span class='r r-${enc(e.reason)}'>${enc(e.reason)}</span></td><td>${enc(e.version)}</td><td>${enc(e.branch)}</td><td>${enc(e.note)}</td></tr>\n`;
  let commitRows = '';
  for (const c of recent) commitRows += `<tr><td><code>${enc(c.hash)}</code></td><td>${enc(c.date)}</td><td>${enc(c.subject)}</td></tr>\n`;
  const dirtyTxt = dirty ? "<span class='bad'>modifications non commitees</span>" : "<span class='ok'>propre</span>";
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Etat des lieux - ${enc(project)}</title>
<style>
:root{--gold:#c8a44e;}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:Inter,-apple-system,Segoe UI,sans-serif;background:#0a0a0a;color:#f0f0f0;line-height:1.6;padding:2.5rem 1.5rem;max-width:60rem;margin:0 auto;}
h1{font-size:1.9rem;font-weight:800;letter-spacing:-.02em;}
h1 .accent{background:linear-gradient(135deg,#c8a44e,#e8c960);-webkit-background-clip:text;background-clip:text;color:transparent;}
.sub{color:#777;font-size:.85rem;margin:.4rem 0 2rem;}
h2{font-size:1.1rem;font-weight:700;margin:2.2rem 0 .8rem;color:var(--gold);}
table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid #2a2a2a;border-radius:10px;overflow:hidden;font-size:.88rem;margin:.5rem 0;}
th{background:#161616;color:#888;text-transform:uppercase;font-size:.7rem;letter-spacing:.06em;padding:.6rem .9rem;text-align:left;}
td{padding:.6rem .9rem;border-top:1px solid #1f1f1f;color:#bbb;}
code{font-family:'SF Mono',Consolas,monospace;background:rgba(200,164,78,.1);color:var(--gold);padding:.1rem .35rem;border-radius:4px;font-size:.82rem;}
.kv{display:grid;grid-template-columns:max-content 1fr;gap:.3rem 1.2rem;font-size:.92rem;background:#141414;border:1px solid #2a2a2a;border-radius:10px;padding:1.1rem 1.3rem;}
.kv .k{color:#888;}
.ok{color:#2ecc71;}.bad{color:#e74c3c;font-weight:600;}
.r{font-size:.7rem;font-weight:600;text-transform:uppercase;padding:.1rem .5rem;border-radius:999px;}
.r-version{background:rgba(46,204,113,.15);color:#2ecc71;}
.r-pause{background:rgba(230,126,34,.15);color:#e67e22;}
.r-reprise{background:rgba(52,152,219,.15);color:#3498db;}
.r-manual{background:rgba(150,150,150,.15);color:#aaa;}
footer{margin-top:3rem;padding-top:1.2rem;border-top:1px solid #1f1f1f;color:#555;font-size:.78rem;}
</style></head><body>
<h1>Etat des lieux - <span class="accent">${enc(project)}</span></h1>
<div class="sub">Genere le ${enc(ts)} - motif : ${enc(reason)} - a regenerer a chaque version et a chaque pause/reprise.</div>
<h2>Etat courant</h2>
<div class="kv">
  <div class="k">Version</div><div>${enc(version)}</div>
  <div class="k">Branche</div><div>${enc(branch)}</div>
  <div class="k">Dernier commit</div><div><code>${enc(lastCommit)}</code></div>
  <div class="k">Arbre</div><div>${dirtyTxt}</div>
  <div class="k">Fichiers</div><div>${fileCount} (hors .git / node_modules)</div>
  ${note ? `<div class='k'>Note</div><div>${enc(note)}</div>` : ''}
</div>
${commitRows ? `<h2>Commits recents</h2><table><tr><th>Hash</th><th>Date</th><th>Sujet</th></tr>${commitRows}</table>` : ''}
<h2>Journal (versions &amp; pauses)</h2>
<table><tr><th>Date</th><th>Motif</th><th>Version</th><th>Branche</th><th>Note</th></tr>
${rows}</table>
<footer>iakaframe - etat des lieux automatique. Le recit de reprise est tenu dans specs/etat-des-lieux.md et specs/PROJET.md.</footer>
</body></html>`;
  fs.writeFileSync(path.join(specs, 'etat-des-lieux.html'), html, 'utf8');

  // ---- CADENCE (T6, § 6) : brancher `close` sur le rituel APRES generation de l'etat des lieux ----
  // Declenchee sur `pause`/`version` (pilote par cadence.close_on), JAMAIS sur `reprise`. Garantie
  // NON-BLOQUANTE (double filet) : runCadence ne leve jamais, et on la ceinture ici aussi — meme une
  // erreur inattendue de la cadence ne doit pas casser le rituel d'etat des lieux (deja ecrit ci-dessus).
  let cadence;
  try { cadence = cadenceRun({ reason, home }); }
  catch (e) { cadence = { triggered: false, skipped: 'guarded', reason, error: e.message }; }

  // ---- CANON PROJET (lot A) : la connaissance INCREMENTALE du produit, greffee sur le MEME rituel.
  // Point d'appui : `doSnapshot` recoit DEJA `projectPath` ET `reason` — les deux seules entrees
  // necessaires. Le canon projet se resout donc SANS NOUVELLE PLOMBERIE, ce qui rend le lot petit.
  // Sur pause|version -> cloture ; sur reprise -> RATTRAPAGE d'une cloture manquee, et seulement
  // s'il y a une dette. Meme double filet non-bloquant que la cadence globale.
  let projectCadence;
  try { projectCadence = projectCadenceRun({ projectPath: root, reason, home }); }
  catch (e) { projectCadence = { triggered: false, skipped: 'guarded', reason, error: e.message }; }

  return { version, branch, fileCount, dirty, cadence, projectCadence };
}

export function runSnapshot(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      path: { type: 'string' },
      reason: { type: 'string', default: 'manual' },
      version: { type: 'string' },
      note: { type: 'string' },
      home: { type: 'string' },
      help: { type: 'boolean', default: false },
    },
  });
  if (values.help) { console.log(USAGE); return; }
  if (!REASONS.includes(values.reason)) {
    console.error(`reason invalide : ${values.reason} (attendu: ${REASONS.join('|')})`); process.exitCode = 1; return;
  }
  const r = doSnapshot({ projectPath: values.path || process.cwd(), reason: values.reason, version: values.version || '', note: values.note || '', home: values.home });
  console.log(`Snapshot OK (${values.reason}) -> specs/etat-des-lieux.md + .html`);
  console.log(`  version=${r.version} branche=${r.branch} fichiers=${r.fileCount}${r.dirty ? ' [arbre sale]' : ''}`);
  console.log(`  ${formatCadence(r.cadence)}`);
  console.log(`  ${formatProjectCadence(r.projectCadence)}`);
}
