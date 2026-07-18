// Tests d'unite du coeur PUR guard-core (Lot 0). Verrouillent la logique de decision
// runner-agnostique (verdictIdentity / verdictPerimeter / verdictDelegation) independamment de
// tout runner. Le coeur canonique vit dans kit-claude ; kit-codex en detient une copie identique
// (parite verifiee par guard-core-parity.test.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  verdictIdentity, verdictPerimeter, verdictDelegation, isPerimeterBlocking,
  ROSTER, BUILTINS, AGENT_UNSET,
} from '../../kits/iakaframe-claude/global/hooks/guard-core.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));

// --- verdictIdentity ---------------------------------------------------------
// Rappel : `turn` = messages-texte assistant du tour, ANTI-CHRONO (turn[0] = dernier message).

test('verdictIdentity : tour vide -> skip', () => {
  assert.deepEqual(verdictIdentity([]), { skip: true });
  assert.deepEqual(verdictIdentity(null), { skip: true });
});

test('verdictIdentity : message conforme (ouverture + cloture) -> startOk & stopOk', () => {
  const msg = "🟡 [PORTEFEUILLE][Odin] — j'ouvre.\n\ntravail\n\nfini [PORTEFEUILLE][Odin] 🟡";
  assert.deepEqual(verdictIdentity([msg]), { skip: false, startOk: true, stopOk: true });
});

test('verdictIdentity : cloture manquante -> stopOk false', () => {
  const msg = "🟡 [PORTEFEUILLE][Odin] — j'ouvre.\n\ntravail\n\nvoila sans badge final.";
  assert.deepEqual(verdictIdentity([msg]), { skip: false, startOk: true, stopOk: false });
});

test('verdictIdentity : ouverture manquante -> startOk false', () => {
  const msg = "je commence sans badge.\n\ntravail\n\nfini [PORTEFEUILLE][Odin] 🟡";
  assert.deepEqual(verdictIdentity([msg]), { skip: false, startOk: false, stopOk: true });
});

test('verdictIdentity : ouverture portee par un message ANTERIEUR du tour', () => {
  // turn anti-chrono : dernier message (turn[0]) clot ; un message plus ancien ouvre.
  const dernier = "suite du travail\n\nfini [PORTEFEUILLE][Odin] 🟡";
  const ancien = "🟡 [PORTEFEUILLE][Odin] — j'ouvre le tour.";
  assert.deepEqual(verdictIdentity([dernier, ancien]), { skip: false, startOk: true, stopOk: true });
});

test('verdictIdentity : one-liner unique badge -> tolere ouverture OU cloture pour les deux', () => {
  assert.deepEqual(verdictIdentity(["🟡 [PORTEFEUILLE][Odin] — un seul badge"]),
    { skip: false, startOk: true, stopOk: true });
});

// --- verdictPerimeter --------------------------------------------------------

const permOpts = {
  portfolioDir: '/home/u/.claude',
  harnessSettings: '/home/u/.claude/settings.json',
  relativeFn: path.posix.relative,
  isAbsoluteFn: path.posix.isAbsolute,
};

test('verdictPerimeter : chemin sous le projet -> ALLOW_PROJECT', () => {
  assert.equal(verdictPerimeter('/repo/src/a.js', '/repo', permOpts), 'ALLOW_PROJECT');
});
test('verdictPerimeter : settings du harnais -> DENY_HARNESS (prime)', () => {
  assert.equal(verdictPerimeter('/home/u/.claude/settings.json', '/repo', permOpts), 'DENY_HARNESS');
});
test('verdictPerimeter : sous le portefeuille (hors settings) -> ALLOW_PORTFOLIO', () => {
  assert.equal(verdictPerimeter('/home/u/.claude/agents/x.md', '/repo', permOpts), 'ALLOW_PORTFOLIO');
});
test('verdictPerimeter : ailleurs -> HORS', () => {
  assert.equal(verdictPerimeter('/etc/passwd', '/repo', permOpts), 'HORS');
});
test('isPerimeterBlocking : HORS et DENY_HARNESS bloquent, les ALLOW non', () => {
  assert.equal(isPerimeterBlocking('HORS'), true);
  assert.equal(isPerimeterBlocking('DENY_HARNESS'), true);
  assert.equal(isPerimeterBlocking('ALLOW_PROJECT'), false);
  assert.equal(isPerimeterBlocking('ALLOW_PORTFOLIO'), false);
});

// --- verdictDelegation -------------------------------------------------------

test('verdictDelegation : agent du roster -> known, non refuse', () => {
  assert.deepEqual(verdictDelegation('gimli'), { known: true, refused: false });
  assert.deepEqual(verdictDelegation('Gandalf'), { known: true, refused: false }); // insensible a la casse
});
test('verdictDelegation : sous-agent natif tolere -> known', () => {
  assert.deepEqual(verdictDelegation('Explore'), { known: true, refused: false });
});
test('verdictDelegation : agent hors roster -> refuse', () => {
  assert.deepEqual(verdictDelegation('hacker'), { known: false, refused: true });
});
test('verdictDelegation : agent non precise -> ni known ni refuse', () => {
  assert.deepEqual(verdictDelegation(AGENT_UNSET), { known: false, refused: false });
  assert.deepEqual(verdictDelegation(null), { known: false, refused: false });
});
test('roster iakaframe = 8 agents attendus', () => {
  assert.deepEqual([...ROSTER].sort(),
    ['aragorn', 'gandalf', 'gimli', 'helm', 'legolas', 'loki', 'nathalie', 'odin'].sort());
  assert.ok(BUILTINS.includes('general-purpose'));
});

void here;
