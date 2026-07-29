#!/usr/bin/env node
// Producteur UNIQUE de la zone CODE_BLOCKS de methode-de-travail.html
// (specs/instructions/generateur-vitrine-methode-md-html.md).
//
// Rejoue le role de l'ancien iakaframe-build-methode-code.ps1 (retire avec tous les .ps1) : il
// reconstruit, ENTRE les marqueurs <!--CODE_BLOCKS_START-->/<!--CODE_BLOCKS_END-->, les cartes de
// code des agents et des skills, HTML-echappees, depuis les SOURCES CANON VIVANTES :
//   - bloc agents  = le CONTRAT rendu par generateAll (Option B, arbitre) — l'exact
//     `.claude/agents/<id>.md` deploye, meme referent que le golden parite-generateurs ;
//   - bloc skills  = TOUS les library/skills/<id>/SKILL.md (bruts), tries par id.
//
// Calque de gen-agents-golden.mjs / gen-skills-golden.mjs : REPO atteint par ../.. ; fonction pure
// exportee (buildZone) rejouable en memoire par la garde ; main() n'ecrit qu'en lancement DIRECT.
//
// Non destructif : SEULE la zone entre les deux marqueurs est remplacee ; tout le HTML autour
// (marqueurs compris) reste byte-intact. Idempotent : ids tries + rendu deterministe => re-run sans
// changement de source = diff vide.
//
// Regenerer : node cli/scripts/gen-methode-vitrine.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateAll } from '../src/lib/generate-agents.js';
import { scan, pathFor } from '../src/lib/library.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..'); // depot iakaframe (vraie bibliotheque)
const VITRINE = path.join(REPO, 'methode-de-travail.html');

const START = '<!--CODE_BLOCKS_START-->';
const END = '<!--CODE_BLOCKS_END-->';

// Echappement HTML des `<pre>` : ordre IMPOSE `&` d'abord (sinon double-echappement), puis `<`,
// puis `>`. Aucun util reutilisable dans cli/src/lib -> helper local (verrouille par la garde).
export function esc(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Une carte = tete (fname/fpath + bouton download) + <pre id data-path> contenu echappe </pre></div>.
// Gabarit byte-a-byte identique a la zone mesuree (methode-de-travail.html § 2.1 de l'instruction) :
// le contenu est GLUE au `>` du <pre> (le fichier commence par `---`) ; `</pre></div>` suit le `\n`
// final du contenu, donc s'affiche sur sa propre ligne.
function renderCard({ fname, fpath, preId, dataPath, dlName, body }) {
  return '<div class="codecard"><div class="codecard-head">'
    + `<span><span class="fname">${fname}</span><span class="fpath">${fpath}</span></span>`
    + `<button class="dlbtn" onclick="iakaDL('${preId}','${dlName}')">&#x2B07; download</button>`
    + `</div><pre id="${preId}" data-path="${dataPath}">${esc(body)}</pre></div>`;
}

// Fonction PURE : reconstruit la chaine exacte a placer ENTRE les marqueurs (leading + trailing
// `\n` compris). Rejouable en memoire par la garde vitrine-methode.test.js.
export function buildZone({ root = REPO } = {}) {
  const parts = [];

  // --- Bloc agents : contrat rendu (Option B, arbitre) — roster de la frame default, ids tries.
  parts.push('<div class="code-group">agents/ &mdash; definitions de subagents</div>');
  const contracts = generateAll({ root });
  for (const id of [...contracts.keys()].sort()) {
    parts.push(renderCard({
      fname: `${id}.md`,
      fpath: `library/personas/${id}.md`,
      preId: `code-agent-${id}`,
      dataPath: `library/personas/${id}.md`,
      dlName: `${id}.md`,
      body: contracts.get(id),
    }));
  }

  // --- Bloc skills : TOUS les library/skills/<id>/SKILL.md bruts, tries par id (scan trie deja).
  parts.push('<div class="code-group">skills/ &mdash; savoir-faire (SKILL.md)</div>');
  for (const { id } of scan('skills', root)) {
    const raw = fs.readFileSync(pathFor('skills', id, root), 'utf8');
    parts.push(renderCard({
      fname: id,
      fpath: `library/skills/${id}/SKILL.md`,
      preId: `code-skill-${id}`,
      dataPath: `library/skills/${id}/SKILL.md`,
      dlName: `${id}-SKILL.md`,
      body: raw,
    }));
  }

  return '\n' + parts.join('\n') + '\n';
}

// Extrait le texte ENTRE les marqueurs (sans les marqueurs). Sert a la garde et au splice.
export function extractZone(html) {
  const s = html.indexOf(START);
  const e = html.indexOf(END);
  if (s < 0 || e < 0 || e < s) throw new Error('marqueurs CODE_BLOCKS introuvables ou inverses');
  return html.slice(s + START.length, e);
}

// Splice byte-exact : ne remplace QUE l'entre-deux-marqueurs ; preambule, marqueurs et postambule
// restent byte-intacts.
export function spliceZone(html, zone) {
  const s = html.indexOf(START);
  const e = html.indexOf(END);
  if (s < 0 || e < 0 || e < s) throw new Error('marqueurs CODE_BLOCKS introuvables ou inverses');
  return html.slice(0, s + START.length) + zone + html.slice(e);
}

function main() {
  const html = fs.readFileSync(VITRINE, 'utf8');
  const next = spliceZone(html, buildZone({ root: REPO }));
  fs.writeFileSync(VITRINE, next);
  process.stdout.write(`vitrine : zone CODE_BLOCKS regeneree dans ${VITRINE}\n`);
}

// Execute uniquement en direct (import par la garde = pas d'ecriture).
if (import.meta.url === `file://${process.argv[1]}`) main();
