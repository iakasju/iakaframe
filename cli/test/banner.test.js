// Confronte le moteur FIGfont maison a la sortie figlet de reference (fixtures pyfiglet).
// Comparaison normalisee : espaces de fin de ligne + lignes vides terminales ignores
// (egalite visuelle), le rendu ASCII restant identique au pixel pres.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderText, renderBanner } from '../src/lib/banner.js';

const FIX = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const FONTS = ['ansi_shadow', 'standard', 'slant', 'small', 'big', 'doom', 'bloody'];
const SAMPLES = ['iakaIDE', 'PORTEFEUILLE', 'Abc 123'];

function norm(s) {
  return s.replace(/\r\n/g, '\n').split('\n').map(l => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '');
}

for (const font of FONTS) {
  for (const sample of SAMPLES) {
    const fx = path.join(FIX, `${font}__${sample.replace(/ /g, '_')}.txt`);
    test(`${font} / "${sample}" == reference figlet`, () => {
      const expected = norm(fs.readFileSync(fx, 'utf8'));
      const got = norm(renderText(sample, font));
      assert.equal(got, expected);
    });
  }
}

test('police inconnue -> repli sans crash', () => {
  const out = renderBanner('Hi', 'police-qui-nexiste-pas');
  assert.ok(out.length > 0);
});
