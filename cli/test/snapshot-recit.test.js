// Le bloc « Reprise du travail » est la SEULE partie de l'etat des lieux que la machine ne sait
// pas reconstruire. `doSnapshot` reecrit le fichier entier a chaque passage : sans preservation
// explicite, chaque checkpoint effacait le recit de la pause precedente.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { doSnapshot, extractRecit, formatRecit } from '../src/commands/snapshot.js';

function arena() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'iaka-recit-'));
  fs.mkdirSync(path.join(dir, 'specs'), { recursive: true });
  return dir;
}
const mdOf = (root) => path.join(root, 'specs', 'etat-des-lieux.md');
const recitOf = (txt) => txt.slice(txt.indexOf('## Reprise du travail'), txt.indexOf('## Journal'));

test('extractRecit : rend le corps humain, ignore le gabarit intact', () => {
  const gabarit = ['## Reprise du travail (a completer par Cowork)', '',
    "- **Ce qui vient d'etre fait** : <!-- ... -->",
    '- **En cours / a reprendre** : <!-- ... -->',
    '- **Prochaine etape concrete** : <!-- premiere action a faire en reprenant -->',
    '- **Pieges connus** : <!-- ... -->', '', '## Journal (versions & pauses)', ''].join('\n');
  assert.equal(extractRecit(gabarit), '', 'gabarit intact -> rien a preserver');
  assert.equal(extractRecit(''), '', 'fichier vide');
  assert.equal(extractRecit('# Etat\n\n## Journal\n'), '', 'bloc absent');

  const rempli = gabarit.replace('- **Pieges connus** : <!-- ... -->', '- **Pieges connus** : le LAN tombe.');
  const got = extractRecit(rempli);
  assert.match(got, /le LAN tombe\./, 'la ligne humaine est rendue');
  assert.match(got, /Ce qui vient d'etre fait/, 'les lignes de gabarit voisines sont rendues avec');
});

test('extractRecit : ancre large, un titre retouche a la main ne perd pas le recit', () => {
  const txt = '## Reprise du travail\n\n- **Pieges connus** : garde-moi.\n\n## Journal\n';
  assert.match(extractRecit(txt), /garde-moi\./);
});

test('doSnapshot : un recit deja redige SURVIT au checkpoint suivant', () => {
  const root = arena();
  doSnapshot({ projectPath: root, reason: 'manual', cadenceRun: () => ({}), projectCadenceRun: () => ({}) });
  const vierge = fs.readFileSync(mdOf(root), 'utf8');
  assert.match(vierge, /Ce qui vient d'etre fait\*\* : <!-- \.\.\. -->/, 'premier passage : gabarit');

  // L'humain redige.
  const RECIT = "- **Ce qui vient d'etre fait** : L36 cadre, en attente d'arbitrage.\n"
              + '- **En cours / a reprendre** : quatre chantiers ouverts.\n'
              + '- **Prochaine etape concrete** : trancher AR-1 et AR-2.\n'
              + '- **Pieges connus** : trois remotes, deux Forgejo.';
  fs.writeFileSync(mdOf(root), vierge.replace(recitOf(vierge),
    '## Reprise du travail (a completer par Cowork)\n\n' + RECIT + '\n\n'), 'utf8');

  // Checkpoint suivant : c'est ICI que le recit disparaissait.
  const r = doSnapshot({ projectPath: root, reason: 'pause', note: 'checkpoint', cadenceRun: () => ({}), projectCadenceRun: () => ({}) });
  const apres = fs.readFileSync(mdOf(root), 'utf8');
  assert.match(apres, /trancher AR-1 et AR-2/, 'le recit a survecu');
  assert.match(apres, /trois remotes, deux Forgejo/);
  assert.equal(r.recit.preserved, true);
  assert.equal(r.recit.lines, 4);
  assert.match(formatRecit(r.recit), /conserve \(4 lignes\)/);

  // ... et les faits, eux, se sont bien regeneres autour.
  assert.match(apres, /motif: pause/, 'les faits sont rafraichis');
  assert.match(apres, /\| Note \| checkpoint \|/);
  assert.equal(apres.match(/## Reprise du travail/g).length, 1, 'un seul bloc recit, pas de doublon');

  // Troisieme passage : idempotent, le recit ne se degrade pas.
  doSnapshot({ projectPath: root, reason: 'reprise', cadenceRun: () => ({}), projectCadenceRun: () => ({}) });
  assert.equal(recitOf(fs.readFileSync(mdOf(root), 'utf8')), recitOf(apres), 'bloc identique au tour suivant');
  fs.rmSync(root, { recursive: true, force: true });
});

test('doSnapshot : sans recit, le gabarit reste ecrit (aucune regression)', () => {
  const root = arena();
  const r = doSnapshot({ projectPath: root, reason: 'manual', cadenceRun: () => ({}), projectCadenceRun: () => ({}) });
  assert.equal(r.recit.preserved, false);
  assert.match(formatRecit(r.recit), /gabarit vierge/);
  assert.match(fs.readFileSync(mdOf(root), 'utf8'), /- \*\*Pieges connus\*\* : <!-- \.\.\. -->/);
  fs.rmSync(root, { recursive: true, force: true });
});
