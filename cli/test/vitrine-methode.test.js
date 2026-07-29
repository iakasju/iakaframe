// Garde anti-derive de la vitrine methode-de-travail.html
// (specs/instructions/generateur-vitrine-methode-md-html.md § 5).
//
// Calque de parite-generateurs / parite-skills : la ZONE entre les marqueurs CODE_BLOCKS EST le
// golden (pas de fixture separee). On regenere la zone EN MEMOIRE (buildZone, pure) et on la compare
// a la zone lue SUR DISQUE. Rouge si une persona (contrat) ou un SKILL.md change sans regeneration,
// ou si un skill est ajoute/retire du canon. Prouve du meme geste la non-derive ET l'idempotence.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildZone, extractZone, esc } from '../scripts/gen-methode-vitrine.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..');
const VITRINE = path.join(REPO, 'methode-de-travail.html');

test('A7 zone regeneree == zone sur disque (la zone EST le golden)', () => {
  const html = fs.readFileSync(VITRINE, 'utf8');
  const onDisk = extractZone(html);
  const live = buildZone({ root: REPO });
  assert.equal(live, onDisk,
    'derive vitrine non regeneree : lancer `node cli/scripts/gen-methode-vitrine.mjs`');
});

test('A3 idempotence : deux buildZone consecutifs sont byte-identiques', () => {
  assert.equal(buildZone({ root: REPO }), buildZone({ root: REPO }));
});

test('A5 fraicheur : la zone ne contient plus de prescription .ps1 ni la charte perime', () => {
  const zone = extractZone(fs.readFileSync(VITRINE, 'utf8'));
  assert.ok(!/iakaframe-update\.ps1/.test(zone), 'prescription pwsh ...ps1 encore presente');
  assert.ok(!/NaonEdge est la charte par d/.test(zone), 'assertion charte par defaut perimee');
});

test('A4 sources canon vivantes : aucun data-path racine agents/ ou skills/ ; fpath en library/', () => {
  const zone = extractZone(fs.readFileSync(VITRINE, 'utf8'));
  assert.ok(!/data-path="agents\//.test(zone), 'data-path racine agents/ encore present');
  assert.ok(!/data-path="skills\//.test(zone), 'data-path racine skills/ encore present');
  assert.ok(/data-path="library\/personas\//.test(zone), 'fpath library/personas attendu');
  assert.ok(/data-path="library\/skills\//.test(zone), 'fpath library/skills attendu');
});

test('slack : zero occurrence dans la zone regeneree (canon purge, non reintroduit)', () => {
  const zone = extractZone(fs.readFileSync(VITRINE, 'utf8'));
  assert.equal((zone.match(/slack/gi) || []).length, 0, 'slack reintroduit dans la zone');
});

test('roster 9 : le bloc agents porte les 9 personas dont feanor (contrat rendu)', () => {
  const zone = buildZone({ root: REPO });
  for (const id of ['aragorn', 'feanor', 'gandalf', 'gimli', 'helm', 'legolas', 'loki', 'nathalie', 'odin']) {
    assert.ok(zone.includes(`id="code-agent-${id}"`), `carte agent manquante : ${id}`);
  }
});

test('esc : ordre & d\'abord, puis < puis > (pas de double-echappement)', () => {
  assert.equal(esc('a < b & c > d'), 'a &lt; b &amp; c &gt; d');
  assert.equal(esc('&lt;'), '&amp;lt;');
});
