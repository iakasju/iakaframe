// Le verbe `canaux` (lot 0 « trois canaux synchrones », 0.c) : mesure EN DIRECT des depots
// synchrones + rattrapage en AVANCE RAPIDE seulement.
//
// ARENE. Les cibles VIVANTES sont des bare LOCAUX (git y pousse sans reseau) : c'est ce qui
// permet de fabriquer honnetement « en retard », « en avance » et « divergent », qu'une panne
// reelle ne peut pas produire. La cible MORTE est la VRAIE ancienne iakabox, hors service.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mesurerCanal, mesurerCanaux, accord, rattraper } from '../src/lib/canaux.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, '..', 'src', 'index.js');
const MORTE = 'http://192.168.2.11:3001/sjupin/iakaframe.git';   // reellement hors service

const jetables = [];
const tmp = (p) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), p)); jetables.push(d); return d; };
const git = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

function commit(dir, nom) {
  fs.writeFileSync(path.join(dir, nom), nom);
  git(dir, ['add', '-A']); git(dir, ['commit', '-q', '-m', nom]);
}
function depotNu() { const b = tmp('iaka-nu-'); git(b, ['init', '--bare', '-q']); return b; }
function depot() {
  const dir = tmp('iaka-mes-');
  git(dir, ['init', '-q']);
  git(dir, ['symbolic-ref', 'HEAD', 'refs/heads/main']);
  git(dir, ['config', 'user.email', 't@e.invalid']); git(dir, ['config', 'user.name', 'T']);
  commit(dir, 'c1');
  return dir;
}
const shaTete = (bare) => execFileSync('git', ['--git-dir=' + bare, 'rev-parse', 'refs/heads/main'], { encoding: 'utf8' }).trim();

// --- Mesure : les etats ne se confondent pas ---------------------------------------------------

test('etat a-jour : cible qui porte exactement le meme commit', () => {
  const dir = depot(), b = depotNu();
  git(dir, ['remote', 'add', 'origin', b]); git(dir, ['push', '-q', 'origin', 'main']);
  const c = mesurerCanal(dir, 'origin', 'main');
  assert.equal(c.etat, 'a-jour');
  assert.equal(c.retard, 0);
  assert.equal(c.distant, c.local);
});

test('etat en-retard : la cible a N commits de moins, et N est EXACT', () => {
  const dir = depot(), b = depotNu();
  git(dir, ['remote', 'add', 'origin', b]); git(dir, ['push', '-q', 'origin', 'main']);
  commit(dir, 'c2'); commit(dir, 'c3');
  const c = mesurerCanal(dir, 'origin', 'main');
  assert.equal(c.etat, 'en-retard');
  assert.equal(c.retard, 2);
  assert.equal(c.avance, 0);
});

test('etat en-avance : la cible porte des commits que NOUS n avons pas', () => {
  const dir = depot(), b = depotNu();
  git(dir, ['remote', 'add', 'origin', b]); git(dir, ['push', '-q', 'origin', 'main']);
  const autre = tmp('iaka-autre-');
  execFileSync('git', ['clone', '-q', b, autre]);
  git(autre, ['config', 'user.email', 't@e.invalid']); git(autre, ['config', 'user.name', 'T']);
  commit(autre, 'distant1'); git(autre, ['push', '-q', 'origin', 'main']);
  const c = mesurerCanal(dir, 'origin', 'main');
  assert.equal(c.etat, 'en-avance');
  assert.equal(c.avance, 1);
});

test('etat divergent : chacun a ses commits, aucun n est ancetre de l autre', () => {
  const dir = depot(), b = depotNu();
  git(dir, ['remote', 'add', 'origin', b]); git(dir, ['push', '-q', 'origin', 'main']);
  const autre = tmp('iaka-autre2-');
  execFileSync('git', ['clone', '-q', b, autre]);
  git(autre, ['config', 'user.email', 't@e.invalid']); git(autre, ['config', 'user.name', 'T']);
  commit(autre, 'leur'); git(autre, ['push', '-q', 'origin', 'main']);
  commit(dir, 'notre');
  const c = mesurerCanal(dir, 'origin', 'main');
  assert.equal(c.etat, 'divergent');
  assert.equal(c.avance, 1);
  assert.equal(c.retard, 1);
});

test('etat branche-absente : la cible repond mais ne porte pas la branche', () => {
  const dir = depot(), b = depotNu();
  git(dir, ['remote', 'add', 'origin', b]);
  assert.equal(mesurerCanal(dir, 'origin', 'main').etat, 'branche-absente');
});

test('etat injoignable : cible REELLEMENT hors service, nommee et non confondue avec un retard', () => {
  const dir = depot();
  git(dir, ['remote', 'add', 'iakabox', MORTE]);
  const c = mesurerCanal(dir, 'iakabox', 'main', { timeoutMs: 15000 });
  assert.equal(c.etat, 'injoignable');
  assert.equal(c.retard, null, 'aucun chiffre de retard ne doit etre fabrique pour une cible muette');
  assert.equal(c.distant, null);
});

// --- Garde d'honnetete (heritee de `range`) ----------------------------------------------------

test('HONNETETE : la mesure porte sa date, et le souvenir d une ref locale est RANGE A PART', () => {
  const dir = depot(), b = depotNu();
  git(dir, ['remote', 'add', 'origin', b]); git(dir, ['push', '-q', 'origin', 'main']);
  git(dir, ['fetch', '-q', 'origin']);                      // cree refs/remotes/origin/main
  git(dir, ['remote', 'set-url', 'origin', MORTE]);         // la meme cible devient injoignable
  const c = mesurerCanal(dir, 'origin', 'main', { timeoutMs: 15000 });
  assert.equal(c.etat, 'injoignable');
  assert.ok(c.dernierConnu, 'le dernier etat connu doit etre rendu');
  assert.match(c.dernierConnu.sha, /^[0-9a-f]{40}$/);
  // Le souvenir n'est JAMAIS promu en etat : `etat` reste « injoignable ».
  assert.notEqual(c.etat, 'a-jour');
  const m = mesurerCanaux(dir, ['origin'], 'main', { timeoutMs: 15000 });
  assert.match(m.mesureLe, /^\d{4}-\d{2}-\d{2}T/);
});

test('ACCORD : un canal injoignable INTERDIT de conclure a l accord (R7)', () => {
  assert.equal(accord([{ etat: 'a-jour' }, { etat: 'a-jour' }]), true);
  assert.equal(accord([{ etat: 'a-jour' }, { etat: 'injoignable' }]), false);
  assert.equal(accord([]), false);
});

// --- Rattrapage : CA-13 / R8 --------------------------------------------------------------------

test('RATTRAPAGE : une cible en retard recoit, en AVANCE RAPIDE', () => {
  const dir = depot(), b = depotNu();
  git(dir, ['remote', 'add', 'origin', b]); git(dir, ['push', '-q', 'origin', 'main']);
  commit(dir, 'c2');
  const m = mesurerCanaux(dir, ['origin'], 'main');
  const actes = rattraper(dir, m);
  assert.equal(actes[0].action, 'pousse');
  assert.equal(shaTete(b), m.local);
});

test('🛑 RATTRAPAGE : une cible EN AVANCE est REFUSEE, et rien n est ecrase (CA-13)', () => {
  const dir = depot(), b = depotNu();
  git(dir, ['remote', 'add', 'origin', b]); git(dir, ['push', '-q', 'origin', 'main']);
  const autre = tmp('iaka-autre3-');
  execFileSync('git', ['clone', '-q', b, autre]);
  git(autre, ['config', 'user.email', 't@e.invalid']); git(autre, ['config', 'user.name', 'T']);
  commit(autre, 'travail-d-une-autre-machine'); git(autre, ['push', '-q', 'origin', 'main']);
  const avant = shaTete(b);

  const actes = rattraper(dir, mesurerCanaux(dir, ['origin'], 'main'));
  assert.equal(actes[0].action, 'refuse');
  assert.match(actes[0].motif, /avance rapide/);
  assert.match(actes[0].motif, /Jamais de --force/);
  // PREUVE POSITIVE : le commit de l'autre machine est toujours la.
  assert.equal(shaTete(b), avant, 'le rattrapage ne doit RIEN avoir ecrase');
});

test('🛑 RATTRAPAGE : une divergence est REFUSEE, et rien n est ecrase', () => {
  const dir = depot(), b = depotNu();
  git(dir, ['remote', 'add', 'origin', b]); git(dir, ['push', '-q', 'origin', 'main']);
  const autre = tmp('iaka-autre4-');
  execFileSync('git', ['clone', '-q', b, autre]);
  git(autre, ['config', 'user.email', 't@e.invalid']); git(autre, ['config', 'user.name', 'T']);
  commit(autre, 'leur'); git(autre, ['push', '-q', 'origin', 'main']);
  commit(dir, 'notre');
  const avant = shaTete(b);
  const actes = rattraper(dir, mesurerCanaux(dir, ['origin'], 'main'));
  assert.equal(actes[0].action, 'refuse');
  assert.match(actes[0].motif, /divergence/i);
  assert.equal(shaTete(b), avant);
});

test('RATTRAPAGE : une cible injoignable est declaree impossible, jamais tentee en boucle', () => {
  const dir = depot();
  git(dir, ['remote', 'add', 'iakabox', MORTE]);
  const actes = rattraper(dir, mesurerCanaux(dir, ['iakabox'], 'main', { timeoutMs: 15000 }), { timeoutMs: 15000 });
  assert.equal(actes[0].action, 'impossible');
});

test('🛑 GARDE DE SOURCE : ni --force ni push +refs nulle part dans la mecanique des canaux', () => {
  for (const f of ['../src/lib/canaux.js', '../src/commands/canaux.js']) {
    const src = fs.readFileSync(path.join(HERE, f), 'utf8');
    // On cherche un USAGE, pas une mention : les commentaires disent « jamais de --force ».
    assert.ok(!/'--force'|"--force"|'\+refs|--force-with-lease/.test(src), `--force present dans ${f}`);
  }
});

// --- Surface CLI ---------------------------------------------------------------------------------

function cli(args, cwd) {
  return spawnSync('node', [CLI, ...args], { cwd, encoding: 'utf8' });
}

test('CLI : sortie humaine — chaque cible NOMMEE, verdict, date de mesure', () => {
  const dir = depot(), b = depotNu();
  git(dir, ['remote', 'add', 'origin', b]); git(dir, ['push', '-q', 'origin', 'main']);
  git(dir, ['remote', 'add', 'iakabox', MORTE]);
  const r = cli(['canaux', '--path', dir, '--timeout', '15'], dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /mesure EN DIRECT le \d{4}-/);
  assert.match(r.stdout, /origin\s+a jour/);
  assert.match(r.stdout, /iakabox\s+injoignable/);
  assert.match(r.stdout, /VERDICT : les 2 canaux ne sont PAS tous d accord/);
});

test('CLI : --json respecte C-JSON (objet, ok:true, count = longueur, date de mesure)', () => {
  const dir = depot(), b = depotNu();
  git(dir, ['remote', 'add', 'origin', b]); git(dir, ['push', '-q', 'origin', 'main']);
  const r = cli(['canaux', '--path', dir, '--json'], dir);
  const o = JSON.parse(r.stdout);
  assert.equal(o.ok, true);
  assert.ok(!Array.isArray(o));
  assert.equal(o.count, o.canaux.length);
  assert.equal(o.canaux[0].etat, 'a-jour');
  assert.equal(o.accord, true);
  assert.match(o.mesureLe, /^\d{4}-\d{2}-\d{2}T/);
});

test('CLI : hors depot git -> erreur C-JSON { ok:false, error } sur stdout, exit 1, stderr vide', () => {
  const vide = tmp('iaka-vide-');
  const r = cli(['canaux', '--path', vide, '--json'], vide);
  assert.equal(r.status, 1);
  assert.equal(r.stderr.trim(), '');
  const o = JSON.parse(r.stdout);
  assert.equal(o.ok, false);
  assert.match(o.error, /pas un depot git/);
});

test('CLI : depot git SANS remote -> refus explicite (aucun canal a mesurer)', () => {
  const dir = depot();
  const r = cli(['canaux', '--path', dir, '--json'], dir);
  assert.equal(r.status, 1);
  assert.match(JSON.parse(r.stdout).error, /aucun remote configure/);
});

test.after(() => { for (const d of jetables) fs.rmSync(d, { recursive: true, force: true }); });
