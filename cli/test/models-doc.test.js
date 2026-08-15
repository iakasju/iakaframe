// Garde d'ACTUALITE de docs/modeles-ia-des-agents.md.
//
// Ce lot a trouve la meme table de modeles recopiee dans 3 fichiers (toutes perimees), puis 4
// autres et 6 JSON de configuration au gate qualite. Une doc ecrite a la main serait la copie
// suivante. Elle est donc GENEREE, et ce test verifie qu'elle est a jour : modifier une
// suggestion ou un binding sans regenerer la doc fait rougir la suite.
//
// C'est la meme discipline que le reste du lot : ce qui peut diverger en silence doit avoir une
// garde qui le dit tout haut.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..');
const GEN = path.join(HERE, '..', 'scripts', 'gen-models-doc.mjs');
const DOC = path.join(REPO, 'docs', 'modeles-ia-des-agents.md');

test('la doc des modeles est A JOUR (regeneration byte-a-byte)', () => {
  // --check sort 1 si le fichier sur disque differe de la regeneration : l'appel EST l'assertion.
  const out = execFileSync('node', [GEN, '--check'], { cwd: REPO, encoding: 'utf8' });
  assert.match(out, /a jour/);
});

test('la doc porte les affectations REELLES, AGENT PAR AGENT', () => {
  // GATE QUALITE 4e passe : ce test verifiait qu'une CHAINE de modele « apparait quelque part »
  // dans la doc. Deux docs fausses passaient au vert :
  //   - une doc affichant un modele PIEGE pour Gimli (le regex gourmand retenait, lui, la bonne
  //     valeur plus loin sur la ligne : le test et le generateur se contredisaient) ;
  //   - une doc ayant PERDU Gimli entierement (ses modeles etant portes par d'autres personas,
  //     rien ne manquait a ses yeux — un agent pouvait s'evaporer sans rougir).
  // On compare desormais LIGNE PAR LIGNE : chaque persona du roster doit avoir SA ligne, avec
  // SES deux modeles, lus avec la MEME regle que le generateur.
  const doc = fs.readFileSync(DOC, 'utf8');
  const MODEL_RE = /\bmodel\s*:\s*("([^"]*)"|'([^']*)'|([^,}\s]+))/;

  const team = fs.readFileSync(path.join(REPO, 'teams', 'iakaframe-8.md'), 'utf8');
  const roster = (team.match(/^personas:\s*\[([^\]]+)\]/m) || [, ''])[1]
    .split(',').map(x => x.trim()).filter(Boolean);
  assert.ok(roster.length >= 9, `roster lu : ${roster.length}`);

  const lire = (id) => {
    const src = fs.readFileSync(path.join(REPO, 'bindings', `${id}.md`), 'utf8');
    const out = {};
    for (const line of src.split(/\r?\n/)) {
      const p = line.match(/personaId:\s*([\w-]+)/);
      const m = line.match(MODEL_RE);
      if (p && m) out[p[1]] = m[2] ?? m[3] ?? m[4];
    }
    return out;
  };
  const claude = lire('iakaframe-claude-default');
  const ollama = lire('iakaframe-ollama-default');

  for (const id of roster) {
    const persona = fs.readFileSync(path.join(REPO, 'library', 'personas', `${id}.md`), 'utf8');
    const nom = (persona.match(/^name:\s*(.+)$/m) || [, id])[1].trim();
    // La ligne de CET agent doit exister...
    const ligne = doc.split('\n').find(l => l.includes(`| ${nom} |`) || l.includes(`${nom} |`));
    assert.ok(ligne, `agent « ${nom} » ABSENT de la doc (un agent ne doit pas pouvoir s'evaporer)`);
    // ...et porter SES modeles, pas ceux d'un autre.
    assert.ok(ligne.includes(`\`${claude[id]}\``),
      `${nom} : la doc n'affiche pas son modele claude (${claude[id]}) — ligne lue : ${ligne}`);
    assert.ok(ligne.includes(`\`${ollama[id]}\``),
      `${nom} : la doc n'affiche pas son modele ollama (${ollama[id]}) — ligne lue : ${ligne}`);
  }
});

test('le generateur REFUSE les sources qui produiraient une doc amputee ou ambigue', () => {
  // Les deux garde-fous ajoutes apres le gate : mieux vaut pas de doc qu'une doc fausse.
  const src = fs.readFileSync(GEN, 'utf8');
  assert.match(src, /throw new Error\([^)]*introuvable ou sans/,
    'une persona du roster non resolue doit faire SORTIR le script, pas disparaitre de la doc');
  assert.match(src, /throw new Error\([^)]*deux affectations differentes/,
    'deux affectations contradictoires doivent etre refusees, pas arbitrees en silence');
  assert.match(src, /sans affectation dans le\(s\) binding\(s\)/,
    'une case vide se lit « pas de modele » : il faut la refuser');
  // Le parseur doit lire les TROIS formes de valeur, comme replaceModelInLine.
  assert.match(src, /\\bmodel\\s\*:/, 'la lecture doit etre bornee au mot `model` (pas `basemodel`)');
  assert.match(src, /'\(\[\^'\]\*\)'/, 'la forme a quote simple doit etre lue');
});

test('la doc explique CHAQUE statut que la commande peut afficher', () => {
  const doc = fs.readFileSync(DOC, 'utf8');
  const src = fs.readFileSync(path.join(HERE, '..', 'src', 'commands', 'models.js'), 'utf8');
  const bloc = src.slice(src.indexOf('export function buildState'), src.indexOf('export function summarize'));
  const statuts = new Set([...bloc.matchAll(/status = '([a-z-]+)'/g)].map(m => m[1]));
  assert.ok(statuts.size >= 5);
  for (const s of statuts) {
    assert.ok(doc.includes(`\`${s}\``), `statut « ${s} » affichable mais absent de la doc utilisateur`);
  }
});

test('la doc ne se presente pas comme editable a la main', () => {
  const doc = fs.readFileSync(DOC, 'utf8');
  assert.match(doc, /Fichier généré/, 'un fichier genere doit le dire en tete');
  assert.match(doc, /gen-models-doc\.mjs/, 'et dire comment le regenerer');
});
