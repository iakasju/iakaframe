// Fan-out d'ecriture (lot 0 « trois canaux synchrones », 0.a) + les TROIS contrefactuels
// obligatoires de l'instruction (§ 9).
//
// ARENE. Aucun de ces cas n'est simule par un drapeau. Les cibles VIVANTES sont des depots
// bare LOCAUX (chemin de fichier : git y pousse sans une once de reseau). Les cibles MORTES
// sont des adresses qui ne peuvent PAS repondre — une machine reellement eteinte et un hote
// non routable par la norme (cf. MORTE_FORGE / MORTE_WEB ci-dessous). On n'imite pas une
// panne : on s'en sert. Regle de surete qui en decoule : une cible de test n'est JAMAIS un
// depot reel, meme repute injoignable — l'etat du reseau change, pas le contrat du banc.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  masquerSecrets, ordonnerRemotes, classerEchec, verdictFanout, formaterFanout,
  pousserFanout, listerRemotes,
} from '../src/lib/canaux.js';

// Cibles injoignables. Deux natures, et la difference est une regle de surete, pas un detail :
//
//  - MORTE_FORGE est une machine REELLEMENT hors service (l'ancienne iakabox, eteinte pour de
//    bon) : la panne est vraie, jamais simulee par un drapeau, conformement au § 9 de
//    l'instruction. Aucun depot n'y vit, aucun credential ne peut y repondre.
//  - MORTE_WEB est une adresse VOLONTAIREMENT NON ROUTABLE : un hote en `.invalid`, TLD reserve
//    par la RFC 2606 dont la norme garantit qu'il ne resout jamais. C'est une CORRECTION : ce
//    banc pointait auparavant `https://github.com/iakasju/iakaframe.git` — le VRAI miroir de
//    production — sous un commentaire « TCP sortant coupe » qui a cesse d'etre vrai quand le
//    reseau est revenu. Des lors, chaque execution de la suite tentait une POUSSEE REELLE ET
//    AUTHENTIFIEE (le trousseau repond) vers ce depot, et n'echouait que parce que le distant
//    etait en avance : motif `refus-non-fast-forward` la ou le banc croyait lire `injoignable`.
//    Rien n'a ete ecrit, mais un test ne doit JAMAIS avoir pour filet de securite l'avance du
//    distant. Une cible morte doit etre morte par construction, pas par circonstance.
const MORTE_FORGE = 'http://192.168.2.11:3001/sjupin/iakaframe.git';        // machine eteinte
const MORTE_WEB = 'https://forge-hors-service.invalid/sjupin/iakaframe.git'; // RFC 2606 : ne resout jamais

const tmp = (p) => fs.mkdtempSync(path.join(os.tmpdir(), p));
const git = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8' });
const jetables = [];

function bareVivant() {
  const b = tmp('iaka-bare-'); git(b, ['init', '--bare', '-q']); jetables.push(b); return b;
}

// Depot de travail + N remotes nommes. `cibles` = [[nom, url], ...].
function depot(cibles) {
  const dir = tmp('iaka-fan-');
  jetables.push(dir);
  git(dir, ['init', '-q']);
  git(dir, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
  git(dir, ['config', 'user.email', 'test@example.invalid']);
  git(dir, ['config', 'user.name', 'Test']);
  fs.writeFileSync(path.join(dir, 'README.md'), '# test\n');
  git(dir, ['add', '-A']); git(dir, ['commit', '-q', '-m', 'seed']);
  for (const [nom, url] of cibles) git(dir, ['remote', 'add', nom, url]);
  return dir;
}

const recu = (bare) => {
  try { execFileSync('git', ['--git-dir=' + bare, 'rev-parse', '--verify', 'refs/heads/main'], { stdio: 'ignore' }); return true; }
  catch { return false; }
};

// --- Garde de SECRET : le token vit dans l'URL des remotes de ce portefeuille ----------------

test('SECRET : le credential d une URL de remote n apparait jamais dans une sortie', () => {
  // Jeton FABRIQUE, de la meme forme qu'un vrai (40 hex-ish) : un test qui a besoin d'un vrai
  // secret pour prouver qu'on masque les secrets serait sa propre contradiction.
  const faux = 'f4k370k3nf4k370k3nf4k370k3nf4k370k3nf4k3';
  const masque = masquerSecrets(`fatal: unable to access 'http://sjupin:${faux}@192.168.2.11:3001/sjupin/iakaframe.git/'`);
  assert.ok(!masque.includes(faux), masque);
  assert.ok(masque.includes('sjupin:***@192.168.2.11:3001'), masque);
});

test('SECRET : le masque tient sur https et sur plusieurs occurrences', () => {
  const m = masquerSecrets('a http://u:secret1@h1/x et https://v:secret2@h2/y');
  assert.ok(!/secret1|secret2/.test(m), m);
});

// --- Fonctions pures --------------------------------------------------------------------------

test('ordre des cibles : origin d abord, puis les autres, sans doublon', () => {
  assert.deepEqual(ordonnerRemotes(['github', 'iakabox', 'origin']), ['origin', 'github', 'iakabox']);
  assert.deepEqual(ordonnerRemotes(['a', 'a', 'b']), ['a', 'b']);
  assert.deepEqual(ordonnerRemotes([]), []);
});

test('classement d echec : injoignable, non-fast-forward et delai ne se confondent pas', () => {
  assert.equal(classerEchec({ expire: true, err: '' }), 'delai-depasse');
  assert.equal(classerEchec({ err: 'fatal: unable to access ...' }), 'injoignable');
  assert.equal(classerEchec({ err: '! [rejected] main -> main (non-fast-forward)' }), 'refus-non-fast-forward');
  assert.equal(classerEchec({ err: 'fatal: Authentication failed' }), 'refus-authentification');
  assert.equal(classerEchec({ err: 'quelque chose d inedit' }), 'echec');
});

test('R7 : sans aucune cible servie, la sortie ne dit JAMAIS sauvegarde', () => {
  const res = [{ remote: 'origin', ok: false, motif: 'injoignable', detail: '' },
               { remote: 'github', ok: false, motif: 'injoignable', detail: '' }];
  const v = verdictFanout(res);
  assert.equal(v.aucune, true);
  const txt = formaterFanout(res, 'main').join('\n');
  assert.match(txt, /AUCUNE des 2 cibles n a recu/);
  assert.ok(!/Recu par/.test(txt), txt);
});

test('R7 : une sortie qui annonce un succes NOMME les cibles servies et les non servies', () => {
  const res = [{ remote: 'origin', ok: true, motif: '', detail: '' },
               { remote: 'github', ok: false, motif: 'injoignable', detail: '' }];
  const txt = formaterFanout(res, 'main').join('\n');
  assert.match(txt, /Recu par : origin/);
  assert.match(txt, /non servi : github/);
});

// --- Les TROIS contrefactuels de l'instruction (§ 9) -------------------------------------------

test('CONTREFACTUEL 1 - UNE cible off : le fan-out aboutit, les deux autres recoivent, la morte est NOMMEE', () => {
  const b1 = bareVivant(), b2 = bareVivant();
  const dir = depot([['origin', b1], ['nas', b2], ['iakabox', MORTE_FORGE]]);
  const res = pousserFanout(dir, 'main', listerRemotes(dir), { timeoutMs: 15000 });
  assert.equal(res.length, 3);
  assert.equal(recu(b1), true, 'origin doit avoir recu');
  assert.equal(recu(b2), true, 'nas doit avoir recu');
  const morte = res.find(r => r.remote === 'iakabox');
  assert.equal(morte.ok, false);
  const v = verdictFanout(res);
  assert.deepEqual(v.servies.sort(), ['nas', 'origin']);
  assert.deepEqual(v.nonServies, ['iakabox']);
  assert.equal(v.aucune, false, 'le checkpoint ne casse pas pour une cible morte (CA-9)');
  assert.match(formaterFanout(res, 'main').join('\n'), /\[--\] iakabox NON servi/);
});

test('CONTREFACTUEL 2 - DEUX cibles off : la troisieme recoit, les deux mortes sont NOMMEES', () => {
  const b1 = bareVivant();
  const dir = depot([['origin', b1], ['iakabox', MORTE_FORGE], ['github', MORTE_WEB]]);
  const res = pousserFanout(dir, 'main', listerRemotes(dir), { timeoutMs: 15000 });
  assert.equal(recu(b1), true, 'la cible vivante doit avoir recu');
  const v = verdictFanout(res);
  assert.deepEqual(v.servies, ['origin']);
  assert.deepEqual(v.nonServies.sort(), ['github', 'iakabox']);
  assert.equal(v.aucune, false);
});

test('CONTREFACTUEL 3 - LES TROIS off : rien n est pretendu sauvegarde (R7)', () => {
  const dir = depot([['origin', MORTE_FORGE], ['iakabox', MORTE_FORGE], ['github', MORTE_WEB]]);
  const res = pousserFanout(dir, 'main', listerRemotes(dir), { timeoutMs: 15000 });
  const v = verdictFanout(res);
  assert.deepEqual(v.servies, []);
  assert.equal(v.aucune, true);
  const txt = formaterFanout(res, 'main').join('\n');
  assert.match(txt, /AUCUNE des 3 cibles n a recu : le commit n existe QUE localement/);
  // Et aucun credential n'a fui au passage : on cherche la FORME « user:secret@hote », sans
  // avoir a citer un vrai jeton dans un fichier versionne.
  assert.ok(!/:\/\/[^\s/@:]+:[^\s/@*]+@/.test(txt), `credential en clair dans la sortie : ${txt}`);
});

// --- Garde de SURETE du banc lui-meme : une cible morte doit l'etre PAR CONSTRUCTION ---------

test('SURETE : la cible morte du Web est non routable par la norme, jamais un depot reel', () => {
  // Le defaut repare : viser un vrai depot en pariant sur l'etat du reseau. Un hote `.invalid`
  // (RFC 2606) ne resout jamais — aucune poussee ne peut partir vers un distant qui existe.
  const hote = new URL(MORTE_WEB).hostname;
  assert.ok(hote.endsWith('.invalid'), `cible de test routable : ${hote}`);
});

test('SURETE : le motif rendu par la cible morte est bien injoignable (mesure, pas lecture)', () => {
  const b = bareVivant();
  const dir = depot([['origin', b], ['mort', MORTE_WEB]]);
  const res = pousserFanout(dir, 'main', listerRemotes(dir), { timeoutMs: 15000 });
  const mort = res.find((r) => r.remote === 'mort');
  assert.equal(mort.ok, false);
  // C'est CE motif qui etait faux avant la correction : le banc obtenait
  // `refus-non-fast-forward`, preuve qu'une poussee authentifiee partait pour de bon.
  assert.equal(mort.motif, 'injoignable', `motif inattendu : ${mort.motif} / ${mort.detail}`);
});

test('CHAQUE cible est independante : une morte au MILIEU n empeche pas la suivante', () => {
  const b = bareVivant();
  const dir = depot([['origin', MORTE_FORGE], ['zz-vivant', b]]);
  const res = pousserFanout(dir, 'main', listerRemotes(dir), { timeoutMs: 15000 });
  assert.equal(res[0].ok, false);
  assert.equal(res[1].ok, true);
  assert.equal(recu(b), true);
});

test.after(() => { for (const d of jetables) fs.rmSync(d, { recursive: true, force: true }); });
