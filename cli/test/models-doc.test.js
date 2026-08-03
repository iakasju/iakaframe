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

test('la doc porte les affectations REELLES des deux bindings', () => {
  const doc = fs.readFileSync(DOC, 'utf8');
  for (const id of ['iakaframe-claude-default', 'iakaframe-ollama-default']) {
    const src = fs.readFileSync(path.join(REPO, 'bindings', `${id}.md`), 'utf8');
    const models = [...src.matchAll(/personaId:\s*([\w-]+)[^}]*model:\s*"([^"]+)"/g)];
    assert.ok(models.length >= 9, `${id} : ${models.length} affectations lues`);
    for (const [, persona, model] of models) {
      assert.ok(doc.includes(`\`${model}\``),
        `${persona} : le modele ${model} du binding ${id} n'apparait pas dans la doc`);
    }
  }
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
