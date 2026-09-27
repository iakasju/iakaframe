// Tests d'unite du coeur PUR guard-core (Lot 0 + Lot 1 chantier). Verrouillent la logique de
// decision runner-agnostique (verdictIdentity / verdictPerimeter / verdictDelegation / verdict
// CHANTIER) independamment de tout runner. Le coeur canonique vit dans kit-claude ; kit-codex en
// detient une copie identique (parite verifiee par guard-core-parity.test.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  verdictIdentity, verdictPerimeter, verdictDelegation, isPerimeterBlocking,
  ROSTER, BUILTINS, AGENT_UNSET,
  keySig, foldChantier, pickBinding, parsePromptDirectives, parseChantierLines,
  detectRepoMentions, classifyShell, verdictChantier, verdictDispatch, READONLY_BUILTINS,
} from '../../kits/iakaframe-claude/global/hooks/guard-core.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const FIX_CHANTIER = (name) => path.resolve(here, 'fixtures', 'chantier', name);
const key = (kind, root, name) => ({ kind, root, name });
const REPO_A = key('repo', '/work/repoA', 'repoA');
const REPO_B = key('repo', '/work/repoB', 'repoB');
const PORTEFEUILLE = key('portefeuille', '/work', '@portefeuille');

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
test('roster iakaframe = 9 agents attendus (charon depuis la scission du squad prod)', () => {
  assert.deepEqual([...ROSTER].sort(),
    ['aragorn', 'charon', 'gandalf', 'gimli', 'helm', 'legolas', 'loki', 'nathalie', 'odin'].sort());
  assert.ok(BUILTINS.includes('general-purpose'));
});

// CA-19 : les DEUX postes du squad prod sont delegables, et `feanor` reste ABSENT — dette
// `ROSTER-FEANOR`, ANTERIEURE a la scission. Elle est asseree ici pour qu'elle ne se corrige pas
// en passant : `Task(agent: feanor)` est refuse aujourd'hui, et le corriger changerait le
// comportement de delegation de Feanor, ce que personne n'a arbitre. Le jour ou ce sera decide,
// CE TEST DOIT ROUGIR.
test('CA-19 : charon et helm sont delegables ; feanor reste refuse (ROSTER-FEANOR)', () => {
  assert.deepEqual(verdictDelegation('charon'), { known: true, refused: false });
  assert.deepEqual(verdictDelegation('helm'), { known: true, refused: false });
  assert.deepEqual(verdictDelegation('feanor'), { known: false, refused: true });
});

// =============================================================================================
// CHANTIER (Lot 1, specs/instructions/declaration-chantier-session.md § « Mecanique retenue »).
// =============================================================================================

// --- CA-1 : foldChantier -----------------------------------------------------

test('CA-1 : foldChantier — launch, declare (segments), ligne corrompue, 2e launch, dispatch+bind', () => {
  const lines = fs.readFileSync(FIX_CHANTIER('fold-ca1.jsonl'), 'utf8').split('\n');
  const state = foldChantier(lines);

  // actif = repoB (declare a ouvert le segment 2), pas repoA (1er launch) ni "other" (2e launch ignore).
  assert.deepEqual(state.active.key, REPO_B);
  assert.equal(state.active.segment, 2);
  assert.equal(state.active.by, 'user');

  // segments : 1 clos (repoA, until = at du declare) + le courant (repoB, sans until).
  assert.equal(state.segments.length, 2);
  assert.deepEqual(state.segments[0].key, REPO_A);
  assert.equal(state.segments[0].by, 'launch');
  assert.equal(state.segments[0].until, '2026-09-27T10:01:00Z'); // `at` du declare qui l'a clos
  assert.deepEqual(state.segments[1].key, REPO_B);
  assert.equal(state.segments[1].until, undefined);

  // dispatch consomme par le 1er bind ; bindings[s1].key = cle du dispatch (repoB).
  assert.equal(state.dispatches.length, 0);
  assert.deepEqual(state.bindings.get('s1').key, REPO_B);
  assert.equal(state.bindings.get('s1').toolUseId, 'tu1');
});

test('CA-1 : foldChantier — declare repetee sur la cle deja active = sans effet', () => {
  const lines = [
    JSON.stringify({ v: 1, at: 't1', type: 'launch', key: REPO_A }),
    JSON.stringify({ v: 1, at: 't2', type: 'declare', key: REPO_A, by: 'user' }),
  ];
  const state = foldChantier(lines);
  assert.equal(state.active.segment, 1); // pas de 2e segment
  assert.equal(state.segments.length, 1);
});

test('CA-1 : foldChantier — deux bind pour le meme agent_id -> le premier gagne', () => {
  const lines = [
    JSON.stringify({ v: 1, at: 't1', type: 'launch', key: REPO_A }),
    JSON.stringify({ v: 1, at: 't2', type: 'bind', agent_id: 's1', agent_type: 'aragorn', key: REPO_A, tool_use_id: null }),
    JSON.stringify({ v: 1, at: 't3', type: 'bind', agent_id: 's1', agent_type: 'aragorn', key: REPO_B, tool_use_id: null }),
  ];
  const state = foldChantier(lines);
  assert.deepEqual(state.bindings.get('s1').key, REPO_A);
});

test('CA-1 : foldChantier — grant et named alimentent des Set de signatures', () => {
  const lines = [
    JSON.stringify({ v: 1, at: 't1', type: 'grant', key: REPO_A, by: 'user' }),
    JSON.stringify({ v: 1, at: 't2', type: 'named', keys: [REPO_A, REPO_B] }),
  ];
  const state = foldChantier(lines);
  assert.equal(state.grants.has(keySig(REPO_A)), true);
  assert.equal(state.named.has(keySig(REPO_A)), true);
  assert.equal(state.named.has(keySig(REPO_B)), true);
});

test('pickBinding (D-13 §2-4) : un seul candidat -> single ; meme cle -> single (FIFO) ; cles differentes -> ambiguous ; aucun -> none', () => {
  const dOne = [{ toolUseId: 'tu1', target: 'aragorn', key: REPO_A }];
  assert.deepEqual(pickBinding(dOne, 'aragorn'), { status: 'single', key: REPO_A, toolUseId: 'tu1' });

  const dSame = [
    { toolUseId: 'tu1', target: 'aragorn', key: REPO_A },
    { toolUseId: 'tu2', target: 'aragorn', key: REPO_A },
  ];
  assert.deepEqual(pickBinding(dSame, 'aragorn'), { status: 'single', key: REPO_A, toolUseId: 'tu1' });

  const dDiff = [
    { toolUseId: 'tu1', target: 'aragorn', key: REPO_A },
    { toolUseId: 'tu2', target: 'aragorn', key: REPO_B },
  ];
  assert.deepEqual(pickBinding(dDiff, 'aragorn'), { status: 'ambiguous' });

  assert.deepEqual(pickBinding([], 'aragorn'), { status: 'none' });
  assert.deepEqual(pickBinding(dOne, 'gimli'), { status: 'none' }); // agent_type different
});

// --- CA-2 : parsePromptDirectives / parseChantierLines -----------------------

test('CA-2 : parsePromptDirectives — ligne seule uniquement, sensible a la casse', () => {
  assert.deepEqual(parsePromptDirectives('odin-direct naonedge'), { declare: null, grant: 'naonedge' });
  assert.deepEqual(
    parsePromptDirectives('on pourrait faire odin-direct naonedge'),
    { declare: null, grant: null },
  );
  assert.deepEqual(parsePromptDirectives('Odin-Direct naonedge'), { declare: null, grant: null });
  assert.deepEqual(parsePromptDirectives('chantier portefeuille'), { declare: '@portefeuille', grant: null });
});

test('CA-2 : parseChantierLines — ligne `Chantier:` en 2e ligne, ambiguite si divergentes', () => {
  const prompt = 'Durée estimée : ~10 min\nChantier: repoA\nSuite du texte…';
  assert.deepEqual(parseChantierLines(prompt), { repo: 'repoA', ambiguous: false });

  const divergent = 'Durée estimée : ~10 min\nChantier: repoA\nChantier: repoB\n';
  assert.deepEqual(parseChantierLines(divergent), { repo: null, ambiguous: true });

  assert.deepEqual(parseChantierLines('rien ici'), { repo: null, ambiguous: false });
});

// --- CA-3 : detectRepoMentions -----------------------------------------------

test('CA-3 : detectRepoMentions — mot entier, phrases reservees retirees', () => {
  const known = ['naonedge', 'naonedge-clients', 'iakacockpit', 'iakaframe'];
  assert.deepEqual(detectRepoMentions('regarde naonedge-clients', known), ['naonedge-clients']);
  assert.deepEqual(detectRepoMentions('update iakaframe', known), []);
  assert.deepEqual(detectRepoMentions('regarde iakacockpit', known), ['iakacockpit']);
});

// --- CA-4 : classifyShell -----------------------------------------------------

test('CA-4 : classifyShell — cas bash READ/MUTATE et drapeaux', () => {
  assert.equal(classifyShell('git status && git log -3', 'bash').kind, 'READ');

  const gitC = classifyShell('git -C C:/work/x log', 'bash');
  assert.equal(gitC.kind, 'READ');
  assert.ok(gitC.paths.includes('C:/work/x'));

  const cdGit = classifyShell('cd C:/work/x && git log', 'bash');
  assert.equal(cdGit.kind, 'READ');
  assert.ok(cdGit.paths.includes('C:/work/x'));

  assert.equal(classifyShell('git commit -m x', 'bash').kind, 'MUTATE');
  assert.equal(classifyShell('cat a > b', 'bash').kind, 'MUTATE');
  assert.equal(classifyShell('ls 2>&1', 'bash').kind, 'READ');
  assert.equal(classifyShell('npm test', 'bash').kind, 'MUTATE');
  assert.equal(classifyShell('Set-Content C:\\x y', 'powershell').kind, 'MUTATE');

  const cdMutate = classifyShell('cd C:/work/naonedge && git commit', 'bash');
  assert.equal(cdMutate.kind, 'MUTATE');
  assert.ok(cdMutate.paths.includes('C:/work/naonedge'));

  assert.equal(classifyShell('claude --resume abc -p "odin-direct x"', 'bash').selfInvoke, true);

  const echoRegistry = classifyShell('echo > ~/.claude/iakaframe-sessions/s.jsonl', 'bash');
  assert.equal(echoRegistry.kind, 'MUTATE');
  assert.equal(echoRegistry.registryRef, true);

  const catRegistry = classifyShell('cat ~/.claude/iakaframe-sessions/s.jsonl', 'bash');
  assert.equal(catRegistry.kind, 'READ');
  assert.equal(catRegistry.registryRef, true);

  assert.equal(classifyShell('node install.mjs --overwrite --yes', 'bash').installerInvoke, true);
  assert.equal(classifyShell('node C:\\work\\iakaframe\\install.mjs', 'bash').installerInvoke, true);
  assert.equal(classifyShell('iakaframe install', 'bash').installerInvoke, true);

  const onboard = classifyShell('iakaframe onboard --path C:\\work\\neuf', 'bash');
  assert.equal(onboard.portfolioVerb, true);
  assert.equal(onboard.segments, 1);
  assert.ok(onboard.paths.includes('C:\\work\\neuf'));

  const fullteam = classifyShell('iakaframe agents --action fullteam --project C:\\work\\x', 'bash');
  assert.equal(fullteam.portfolioVerb, true);
});

test('CA-4 : classifyShell — cas PowerShell READ (Set-Location ; puis Get-ChildItem | Select-String)', () => {
  const r1 = classifyShell('Set-Location C:\\work\\x; Get-ChildItem', 'powershell');
  assert.equal(r1.kind, 'READ');
  assert.ok(r1.paths.includes('C:\\work\\x'));

  const r2 = classifyShell('Get-ChildItem C:\\work | Select-String x', 'powershell');
  assert.equal(r2.kind, 'READ');
});

// --- CA-5 : verdictChantier (les 7 regles de D-5) ----------------------------

test('CA-5 regle 1 : SHELL_READ -> ALLOW', () => {
  assert.deepEqual(
    verdictChantier({ gesture: 'SHELL_READ', actor: 'MAIN', launch: REPO_A, state: { active: null, grants: new Set(), bindings: new Map() }, keys: [REPO_B] }),
    { decision: 'ALLOW' },
  );
});

test('CA-5 regle 2 : keys vide -> ALLOW', () => {
  assert.deepEqual(
    verdictChantier({ gesture: 'EDIT', actor: 'MAIN', launch: REPO_A, state: { active: { key: REPO_A }, grants: new Set(), bindings: new Map() }, keys: [] }),
    { decision: 'ALLOW' },
  );
});

test('CA-5 regle 3 : commande portefeuille (D-14) -> ALLOW PORTFOLIO_VERB', () => {
  const state = { active: null, grants: new Set(), bindings: new Map() };
  assert.deepEqual(
    verdictChantier({
      gesture: 'SHELL_MUTATE', actor: 'MAIN', launch: PORTEFEUILLE, state,
      keys: [key('dir', '/work/neuf', 'neuf')], portfolioVerb: true, segments: 1,
    }),
    { decision: 'ALLOW', code: 'PORTFOLIO_VERB' },
  );
});

test('CA-5 regle 4 : pas d\'effectif -> DENY NO_CHANTIER', () => {
  const state = { active: null, grants: new Set(), bindings: new Map() };
  assert.deepEqual(
    verdictChantier({ gesture: 'EDIT', actor: 'MAIN', launch: null, state, keys: [REPO_A] }),
    { decision: 'DENY', code: 'NO_CHANTIER' },
  );
});

test('CA-5 regle 5 : cle touchee != effective -> DENY CHANTIER_MISMATCH', () => {
  const state = { active: { key: REPO_A, segment: 1 }, grants: new Set(), bindings: new Map() };
  assert.deepEqual(
    verdictChantier({ gesture: 'EDIT', actor: 'MAIN', launch: REPO_A, state, keys: [REPO_B] }),
    { decision: 'DENY', code: 'CHANTIER_MISMATCH' },
  );
});

test('CA-5 regle 6 : regime Odin (session portefeuille ayant derive) -> DENY ODIN_DIRECT', () => {
  const state = { active: { key: REPO_A, segment: 1 }, grants: new Set(), bindings: new Map() };
  assert.deepEqual(
    verdictChantier({ gesture: 'EDIT', actor: 'MAIN', launch: PORTEFEUILLE, state, keys: [REPO_A] }),
    { decision: 'DENY', code: 'ODIN_DIRECT' },
  );
});

test('CA-5 regle 6 bis : meme derive mais avec un grant sur l\'actif -> ALLOW (regle 7)', () => {
  const grants = new Set([keySig(REPO_A)]);
  const state = { active: { key: REPO_A, segment: 1 }, grants, bindings: new Map() };
  assert.deepEqual(
    verdictChantier({ gesture: 'EDIT', actor: 'MAIN', launch: PORTEFEUILLE, state, keys: [REPO_A] }),
    { decision: 'ALLOW' },
  );
});

test('CA-5 regle 7 : "chez soi" (active == launch) -> ALLOW', () => {
  const state = { active: { key: REPO_A, segment: 1 }, grants: new Set(), bindings: new Map() };
  assert.deepEqual(
    verdictChantier({ gesture: 'EDIT', actor: 'MAIN', launch: REPO_A, state, keys: [REPO_A] }),
    { decision: 'ALLOW' },
  );
});

test('CA-5 : sous-agent lie sur B ALLOW alors que le chantier de SESSION est A', () => {
  const bindings = new Map([['s1', { key: REPO_B }]]);
  const state = { active: { key: REPO_A, segment: 1 }, grants: new Set(), bindings };
  assert.deepEqual(
    verdictChantier({ gesture: 'EDIT', actor: 'SUB', agentId: 's1', launch: REPO_A, state, keys: [REPO_B] }),
    { decision: 'ALLOW' },
  );
});

// --- CA-6 : verdictDispatch (D-6) ---------------------------------------------

const emptyState = () => ({ active: null, grants: new Set(), named: new Set(), bindings: new Map() });

test('CA-6 : Explore sans chantier -> ALLOW sans dispatch', () => {
  assert.deepEqual(
    verdictDispatch({ actor: 'MAIN', target: 'Explore', requested: { key: null, ambiguous: false }, state: emptyState(), launch: PORTEFEUILLE }),
    { decision: 'ALLOW' },
  );
  assert.ok(READONLY_BUILTINS.includes('Explore'));
});

test('CA-6 : regime Odin -> gimli / general-purpose / claude / statusline-setup / AGENT_UNSET -> ODIN_DISPATCH', () => {
  const state = emptyState();
  for (const target of ['gimli', 'general-purpose', 'claude', 'statusline-setup', null]) {
    assert.deepEqual(
      verdictDispatch({ actor: 'MAIN', target, requested: { key: null, ambiguous: false }, state, launch: PORTEFEUILLE }),
      { decision: 'DENY', code: 'ODIN_DISPATCH' },
      `target=${target}`,
    );
  }
});

test('CA-6 : regime Odin -> aragorn sans ligne Chantier: -> DISPATCH_UNNAMED', () => {
  assert.deepEqual(
    verdictDispatch({ actor: 'MAIN', target: 'aragorn', requested: { key: null, ambiguous: false }, state: emptyState(), launch: PORTEFEUILLE }),
    { decision: 'DENY', code: 'DISPATCH_UNNAMED' },
  );
});

test('CA-6 : ligne Chantier: X, X dans named -> ALLOW + dispatch{key:X} ; X hors named -> NOT_DESIGNATED', () => {
  const state = { active: { key: PORTEFEUILLE }, grants: new Set(), named: new Set([keySig(REPO_A)]), bindings: new Map() };
  assert.deepEqual(
    verdictDispatch({ actor: 'MAIN', target: 'aragorn', requested: { key: REPO_A, ambiguous: false }, state, launch: PORTEFEUILLE }),
    { decision: 'ALLOW', dispatch: { key: REPO_A, target: 'aragorn' } },
  );
  assert.deepEqual(
    verdictDispatch({ actor: 'MAIN', target: 'aragorn', requested: { key: REPO_B, ambiguous: false }, state, launch: PORTEFEUILLE }),
    { decision: 'DENY', code: 'NOT_DESIGNATED' },
  );
});

test('CA-6 : deux lignes Chantier: divergentes -> DISPATCH_AMBIGUOUS', () => {
  assert.deepEqual(
    verdictDispatch({ actor: 'MAIN', target: 'aragorn', requested: { key: null, ambiguous: true }, state: emptyState(), launch: PORTEFEUILLE }),
    { decision: 'DENY', code: 'DISPATCH_AMBIGUOUS' },
  );
});

test('CA-6 : avec un grant sur l\'actif -> gimli ALLOW (hors regime Odin)', () => {
  const grants = new Set([keySig(PORTEFEUILLE)]);
  const state = { active: { key: PORTEFEUILLE }, grants, named: new Set(), bindings: new Map() };
  assert.deepEqual(
    verdictDispatch({ actor: 'MAIN', target: 'gimli', requested: { key: null, ambiguous: false }, state, launch: PORTEFEUILLE }),
    { decision: 'ALLOW', dispatch: { key: PORTEFEUILLE, target: 'gimli' } },
  );
});

test('CA-6 : sous-agent aragorn lie a A -> dispatch gimli SANS ligne -> ALLOW + dispatch{key:A}', () => {
  const bindings = new Map([['s1', { key: REPO_A }]]);
  const state = { active: { key: REPO_B }, grants: new Set(), named: new Set(), bindings };
  assert.deepEqual(
    verdictDispatch({ actor: 'SUB', agentId: 's1', target: 'gimli', requested: { key: null, ambiguous: false }, state, launch: REPO_B }),
    { decision: 'ALLOW', dispatch: { key: REPO_A, target: 'gimli' } },
  );
});

// --- CA-7 : purete de source (aucune E/S dans guard-core.mjs) -----------------

test('CA-7 : guard-core.mjs ne contient aucun import fs/os/child_process ni `process.`', () => {
  const src = fs.readFileSync(path.resolve(here, '..', '..', 'kits', 'iakaframe-claude', 'global', 'hooks', 'guard-core.mjs'), 'utf8');
  assert.doesNotMatch(src, /from\s+["']node:(fs|os|child_process)["']/);
  // Code reel seulement : les lignes de commentaire (`//...`) peuvent CITER `process.exit` en
  // exemple sans que ce soit un usage. On ne juge que le code hors commentaire (CRLF normalise :
  // `.` ne matche pas `\r`, qui bloquerait sinon l'ancre `$` de fin de ligne).
  const codeOnly = src.replace(/\r\n/g, '\n').split('\n')
    .map((l) => l.replace(/\/\/.*$/, ''))
    .join('\n');
  assert.doesNotMatch(codeOnly, /\bprocess\./);
});

// CA-8 (parite octet-pour-octet kit-claude <-> kit-codex) est verrouille par
// cli/test/guard-core-parity.test.js — inchange par ce lot (cf. § Fichiers concernes).
