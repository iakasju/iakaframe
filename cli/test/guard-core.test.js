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
  keySig, foldChantier, mainRoleOf, parsePromptDirectives, parseChantierLines,
  detectRepoMentions, classifyShell, verdictChantier, verdictDispatch, READONLY_BUILTINS,
  PORTFOLIO_VERBS, isOdinSolicitation, voiceOf, isAnchoredKey,
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
// CHANTIER (specs/instructions/declaration-chantier-session.md, 2e amendement — Lot 1bis).
// =============================================================================================

// --- CA-1 : foldChantier -----------------------------------------------------

test('CA-1 : foldChantier — launch(main_role), declare (segments), ligne corrompue, 2e launch, dispatch/bind ignores', () => {
  const lines = fs.readFileSync(FIX_CHANTIER('fold-ca1.jsonl'), 'utf8').split('\n');
  const state = foldChantier(lines);

  // actif = repoB (declare a ouvert le segment 2), pas repoA (1er launch) ni "other" (2e launch
  // ignore : le fixture porte un 2e `launch` sur "other", sans effet, premier gagnant).
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

  // `launch` (Lot 1bis) : IMMUABLE pour la session — reste repoA/odin malgre le 2e launch ignore
  // et malgre le fait que `active` ait glisse vers repoB.
  assert.deepEqual(state.launch, { key: REPO_A, main_role: 'odin', main_agent_type: null });

  // Lot 1bis : plus de `bindings`/`dispatches` dans l'etat — les lignes `dispatch`/`bind` du
  // fixture (heritage) sont des types INCONNUS pour le fold, ignorees sans effet ni erreur.
  assert.equal('bindings' in state, false);
  assert.equal('dispatches' in state, false);
});

test('CA-1 : foldChantier — declare repetee sur la cle deja active = sans effet', () => {
  const lines = [
    JSON.stringify({ v: 1, at: 't1', type: 'launch', key: REPO_A, main_role: 'odin' }),
    JSON.stringify({ v: 1, at: 't2', type: 'declare', key: REPO_A, by: 'user' }),
  ];
  const state = foldChantier(lines);
  assert.equal(state.active.segment, 1); // pas de 2e segment
  assert.equal(state.segments.length, 1);
});

test('CA-1 : foldChantier — pas de launch dans les lignes -> launch:null (repli D-1 "cas theorique" gere par l\'adaptateur)', () => {
  const state = foldChantier([JSON.stringify({ v: 1, at: 't1', type: 'grant', key: REPO_A, by: 'user' })]);
  assert.equal(state.launch, null);
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

// --- CA-4 (Lot 1bis) : selfInvoke elargi (D-7/D-9) ---------------------------

test('CA-4 : classifyShell — selfInvoke elargi (D-7/D-9)', () => {
  assert.equal(classifyShell('claude --resume abc -p "x"', 'bash').selfInvoke, true);
  assert.equal(classifyShell('claude --agent aragorn "x"', 'bash').selfInvoke, true);
  assert.equal(classifyShell('claude "x"', 'bash').selfInvoke, true);
  assert.equal(classifyShell('wt -d C:\\work\\x claude', 'bash').selfInvoke, true);
  assert.equal(classifyShell('Start-Process claude -ArgumentList x', 'powershell').selfInvoke, true);
  assert.equal(classifyShell('iakaframe go naonedge --do x', 'bash').selfInvoke, true);

  const version = classifyShell('claude --version', 'bash');
  assert.equal(version.kind, 'READ');
  assert.equal(version.selfInvoke, false);

  const gitClaude = classifyShell('git commit -m "fix claude"', 'bash');
  assert.equal(gitClaude.selfInvoke, false);
});

// --- CA-4 (Lot 1bis) : forme par chemin du CLI (D-7, "iakastart", M-17) -----

test('CA-4 : classifyShell — forme par chemin du CLI traitee comme `iakaframe <verbe>`', () => {
  const banner = classifyShell('node C:\\work\\iakaframe\\cli\\src\\index.js banner IAKAFRAME', 'bash');
  assert.equal(banner.kind, 'READ');

  const modelsRead = classifyShell('iakaframe models --path C:\\work\\x --json', 'bash');
  assert.equal(modelsRead.kind, 'READ');

  const modelsWrite = classifyShell('iakaframe models set x y', 'bash');
  assert.equal(modelsWrite.kind, 'MUTATE');
});

// --- CA-4 (Lot 1bis) : `iakaframe launch` en portfolioVerb (D-14, sauf forme par chemin) ------

test('CA-4 : classifyShell — `iakaframe launch <repo>` portfolioVerb litteral ; forme par chemin exclue', () => {
  const launch = classifyShell('iakaframe launch naonedge --mission-file f.md', 'bash');
  assert.equal(launch.portfolioVerb, true);
  assert.equal(launch.segments, 1);
  assert.ok(launch.paths.includes('naonedge'));

  const launchByPath = classifyShell('node C:\\work\\iakaframe\\cli\\src\\index.js launch naonedge', 'bash');
  assert.equal(launchByPath.portfolioVerb, false); // "la forme par chemin reste MUTATE ordinaire" (D-7)
  assert.equal(launchByPath.kind, 'MUTATE');
});

// --- Remarque Legolas : PORTFOLIO_VERBS <-> classifyShell, alignement bidirectionnel ---------

test('PORTFOLIO_VERBS <-> classifyShell : chaque verbe de la constante est reconnu portfolioVerb, et inversement', () => {
  // Chaque entree de PORTFOLIO_VERBS, avec un argument plausible, doit etre reconnue.
  const sample = {
    'iakaframe onboard': 'iakaframe onboard --path C:\\work\\neuf',
    'iakaframe init': 'iakaframe init --path C:\\work\\neuf',
    'iakaframe agents fullteam': 'iakaframe agents fullteam --project C:\\work\\x',
    'iakaframe agents --action fullteam': 'iakaframe agents --action fullteam --project C:\\work\\x',
    'iakaframe launch': 'iakaframe launch naonedge',
  };
  assert.deepEqual(Object.keys(sample).sort(), [...PORTFOLIO_VERBS].sort());
  for (const verb of PORTFOLIO_VERBS) {
    assert.equal(classifyShell(sample[verb], 'bash').portfolioVerb, true, `verb=${verb}`);
  }
  // Inversement : un verbe `iakaframe` HORS de la liste n'est jamais portfolioVerb.
  for (const cmd of ['iakaframe list', 'iakaframe show', 'iakaframe models --path x', 'iakaframe install']) {
    assert.equal(classifyShell(cmd, 'bash').portfolioVerb, false, `cmd=${cmd}`);
  }
});

// --- CA-5 : verdictChantier (les HUIT regles de D-5, 2e amendement) ----------

test('CA-5 regle 1 : SHELL_READ -> ALLOW', () => {
  assert.deepEqual(
    verdictChantier({ gesture: 'SHELL_READ', actor: 'MAIN', sessionRole: 'odin', launch: REPO_A, state: { active: null, grants: new Set() }, keys: [REPO_B] }),
    { decision: 'ALLOW' },
  );
});

test('CA-5 regle 2 : keys vide -> ALLOW', () => {
  assert.deepEqual(
    verdictChantier({ gesture: 'EDIT', actor: 'MAIN', sessionRole: 'odin', launch: REPO_A, state: { active: { key: REPO_A }, grants: new Set() }, keys: [] }),
    { decision: 'ALLOW' },
  );
});

test('CA-5 regle 3 : commande portefeuille (D-14) -> ALLOW PORTFOLIO_VERB', () => {
  const state = { active: null, grants: new Set() };
  assert.deepEqual(
    verdictChantier({
      gesture: 'SHELL_MUTATE', actor: 'MAIN', sessionRole: 'odin', launch: PORTEFEUILLE, state,
      keys: [key('dir', '/work/neuf', 'neuf')], portfolioVerb: true, segments: 1,
    }),
    { decision: 'ALLOW', code: 'PORTFOLIO_VERB' },
  );
});

test('CA-5 regle 4 : session d\'equipe hors depot -> DENY TEAM_NEEDS_REPO', () => {
  const state = { active: { key: PORTEFEUILLE }, grants: new Set() };
  assert.deepEqual(
    verdictChantier({ gesture: 'EDIT', actor: 'MAIN', sessionRole: 'team', launch: PORTEFEUILLE, state, keys: [REPO_A] }),
    { decision: 'DENY', code: 'TEAM_NEEDS_REPO' },
  );
});

test('CA-5 regle 5 : pas d\'effectif -> DENY NO_CHANTIER', () => {
  const state = { active: null, grants: new Set() };
  assert.deepEqual(
    verdictChantier({ gesture: 'EDIT', actor: 'MAIN', sessionRole: 'odin', launch: null, state, keys: [REPO_A] }),
    { decision: 'DENY', code: 'NO_CHANTIER' },
  );
});

test('CA-5 regle 6 : cle touchee != effective -> DENY CHANTIER_MISMATCH', () => {
  const state = { active: { key: REPO_A, segment: 1 }, grants: new Set() };
  assert.deepEqual(
    verdictChantier({ gesture: 'EDIT', actor: 'MAIN', sessionRole: 'odin', launch: REPO_A, state, keys: [REPO_B] }),
    { decision: 'DENY', code: 'CHANTIER_MISMATCH' },
  );
});

test('CA-5 regle 7 : regime Odin (session portefeuille ayant derive) -> DENY ODIN_DIRECT', () => {
  const state = { active: { key: REPO_A, segment: 1 }, grants: new Set() };
  assert.deepEqual(
    verdictChantier({ gesture: 'EDIT', actor: 'MAIN', sessionRole: 'odin', launch: PORTEFEUILLE, state, keys: [REPO_A] }),
    { decision: 'DENY', code: 'ODIN_DIRECT' },
  );
});

test('CA-5 regle 7 bis : meme derive mais avec un grant sur l\'actif -> ALLOW (regle 8)', () => {
  const grants = new Set([keySig(REPO_A)]);
  const state = { active: { key: REPO_A, segment: 1 }, grants };
  assert.deepEqual(
    verdictChantier({ gesture: 'EDIT', actor: 'MAIN', sessionRole: 'odin', launch: PORTEFEUILLE, state, keys: [REPO_A] }),
    { decision: 'ALLOW' },
  );
});

test('CA-5 regle 8 : "chez soi" (active == launch) -> ALLOW', () => {
  const state = { active: { key: REPO_A, segment: 1 }, grants: new Set() };
  assert.deepEqual(
    verdictChantier({ gesture: 'EDIT', actor: 'MAIN', sessionRole: 'odin', launch: REPO_A, state, keys: [REPO_A] }),
    { decision: 'ALLOW' },
  );
});

test('CA-5 : role team, lance dans A — Edit A par le thread principal -> ALLOW (jamais ODIN_DIRECT) ; Edit B -> CHANTIER_MISMATCH', () => {
  const state = { active: { key: REPO_A, segment: 1 }, grants: new Set() }; // en team, active == launch
  assert.deepEqual(
    verdictChantier({ gesture: 'EDIT', actor: 'MAIN', sessionRole: 'team', launch: REPO_A, state, keys: [REPO_A] }),
    { decision: 'ALLOW' },
  );
  assert.deepEqual(
    verdictChantier({ gesture: 'EDIT', actor: 'MAIN', sessionRole: 'team', launch: REPO_A, state, keys: [REPO_B] }),
    { decision: 'DENY', code: 'CHANTIER_MISMATCH' },
  );
});

// --- CA-6 : verdictDispatch (les SIX regles de D-6, 2e amendement) -----------

const emptyState = () => ({ active: null, grants: new Set(), named: new Set() });
// Etat "regime Odin" : session odin lancee au portefeuille, ayant derive vers repoA
// (declare/odin-direct non accorde) — condition necessaire pour ODIN_DISPATCH/DISPATCH_UNNAMED
// (D-6 regle 3 exige un chantier actif AVANT de juger le regime Odin, regle 4).
const odinDriftedState = () => ({ active: { key: REPO_A }, grants: new Set(), named: new Set() });

test('CA-6 : Explore sans chantier -> ALLOW sans dispatch', () => {
  assert.deepEqual(
    verdictDispatch({ actor: 'MAIN', sessionRole: 'odin', target: 'Explore', requested: { key: null, ambiguous: false }, state: emptyState(), launch: PORTEFEUILLE }),
    { decision: 'ALLOW' },
  );
  assert.ok(READONLY_BUILTINS.includes('Explore'));
});

test('CA-6 : regime Odin -> gimli / general-purpose / claude / statusline-setup / AGENT_UNSET -> ODIN_DISPATCH', () => {
  const state = odinDriftedState();
  for (const target of ['gimli', 'general-purpose', 'claude', 'statusline-setup', null]) {
    assert.deepEqual(
      verdictDispatch({ actor: 'MAIN', sessionRole: 'odin', target, requested: { key: null, ambiguous: false }, state, launch: PORTEFEUILLE }),
      { decision: 'DENY', code: 'ODIN_DISPATCH' },
      `target=${target}`,
    );
  }
});

test('CA-6 : regime Odin -> aragorn sans ligne Chantier: -> DISPATCH_UNNAMED', () => {
  assert.deepEqual(
    verdictDispatch({ actor: 'MAIN', sessionRole: 'odin', target: 'aragorn', requested: { key: null, ambiguous: false }, state: odinDriftedState(), launch: PORTEFEUILLE }),
    { decision: 'DENY', code: 'DISPATCH_UNNAMED' },
  );
});

test('CA-6 : regime Odin, aragorn — ligne = actif -> ALLOW ; ligne != actif -> CHANTIER_MISMATCH', () => {
  const state = odinDriftedState(); // active = REPO_A
  assert.deepEqual(
    verdictDispatch({ actor: 'MAIN', sessionRole: 'odin', target: 'aragorn', requested: { key: REPO_A, ambiguous: false }, state, launch: PORTEFEUILLE }),
    { decision: 'ALLOW' },
  );
  assert.deepEqual(
    verdictDispatch({ actor: 'MAIN', sessionRole: 'odin', target: 'aragorn', requested: { key: REPO_B, ambiguous: false }, state, launch: PORTEFEUILLE }),
    { decision: 'DENY', code: 'CHANTIER_MISMATCH' },
  );
});

test('CA-6 : deux lignes Chantier: divergentes -> DISPATCH_AMBIGUOUS', () => {
  assert.deepEqual(
    verdictDispatch({ actor: 'MAIN', sessionRole: 'odin', target: 'aragorn', requested: { key: null, ambiguous: true }, state: emptyState(), launch: PORTEFEUILLE }),
    { decision: 'DENY', code: 'DISPATCH_AMBIGUOUS' },
  );
});

test('CA-6 : avec un grant sur l\'actif -> gimli ALLOW (hors regime Odin)', () => {
  const grants = new Set([keySig(PORTEFEUILLE)]);
  const state = { active: { key: PORTEFEUILLE }, grants, named: new Set() };
  assert.deepEqual(
    verdictDispatch({ actor: 'MAIN', sessionRole: 'odin', target: 'gimli', requested: { key: null, ambiguous: false }, state, launch: PORTEFEUILLE }),
    { decision: 'ALLOW' },
  );
});

test('CA-6 : role team, thread principal — gimli SANS ligne -> ALLOW ; ligne != lancement -> CHANTIER_MISMATCH', () => {
  const state = { active: { key: REPO_A }, grants: new Set(), named: new Set() }; // en team, active == launch
  assert.deepEqual(
    verdictDispatch({ actor: 'MAIN', sessionRole: 'team', target: 'gimli', requested: { key: null, ambiguous: false }, state, launch: REPO_A }),
    { decision: 'ALLOW' },
  );
  assert.deepEqual(
    verdictDispatch({ actor: 'MAIN', sessionRole: 'team', target: 'gimli', requested: { key: REPO_B, ambiguous: false }, state, launch: REPO_A }),
    { decision: 'DENY', code: 'CHANTIER_MISMATCH' },
  );
});

test('CA-6 : aucun chantier actif -> DENY NO_CHANTIER', () => {
  assert.deepEqual(
    verdictDispatch({ actor: 'MAIN', sessionRole: 'team', target: 'gimli', requested: { key: null, ambiguous: false }, state: emptyState(), launch: REPO_A }),
    { decision: 'DENY', code: 'NO_CHANTIER' },
  );
});

test('CA-6 : aucun resultat ALLOW/DENY ne porte de champ `dispatch` (aucun evenement a ecrire)', () => {
  const allow = verdictDispatch({ actor: 'MAIN', sessionRole: 'team', target: 'gimli', requested: { key: null, ambiguous: false }, state: { active: { key: REPO_A }, grants: new Set(), named: new Set() }, launch: REPO_A });
  assert.equal(allow.decision, 'ALLOW');
  assert.equal('dispatch' in allow, false);
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
  // Lot 1bis : la liaison par sous-agent (ex-D-13) est retiree du coeur.
  assert.doesNotMatch(src, /\bpickBinding\b/);
  assert.doesNotMatch(src, /\bbindings\b/);
});

// CA-8 (parite octet-pour-octet kit-claude <-> kit-codex) est verrouille par
// cli/test/guard-core-parity.test.js — inchange par ce lot (cf. § Fichiers concernes).

// --- CA-9 : mainRoleOf (Q-F) --------------------------------------------------

test('CA-9 : mainRoleOf — absent/odin -> "odin" ; toute autre valeur -> "team"', () => {
  assert.equal(mainRoleOf(undefined), 'odin');
  assert.equal(mainRoleOf(null), 'odin');
  assert.equal(mainRoleOf(''), 'odin');
  assert.equal(mainRoleOf('odin'), 'odin');
  assert.equal(mainRoleOf('Odin'), 'odin');
  assert.equal(mainRoleOf('aragorn'), 'team');
  assert.equal(mainRoleOf('gimli'), 'team');
  assert.equal(mainRoleOf('Explore'), 'team');
});

// =============================================================================================
// 3e amendement (declaration-chantier-session.md § 2, Lot 1ter) — ancrage des dossiers hors
// depot. Fixtures du § "3e amendement — dossiers hors depot" de l'instruction.
// =============================================================================================

const HORS_A = key('hors', '/x/horsA', '@hors:horsA');
const HORS_B = key('hors', '/x/horsB', '@hors:horsB');
const HORS_0 = key('hors', null, '@hors'); // non ancree (heritee, ou ancre refusee A3-9)

// --- CA-34 : verdictChantier, launch = actif = hA -----------------------------

test('CA-34 : launch=actif=hA, role odin, MAIN, EDIT sur [hA] -> ALLOW', () => {
  const state = { active: { key: HORS_A, segment: 1 }, grants: new Set() };
  assert.deepEqual(
    verdictChantier({ gesture: 'EDIT', actor: 'MAIN', sessionRole: 'odin', launch: HORS_A, state, keys: [HORS_A] }),
    { decision: 'ALLOW' },
  );
});

test('CA-34 : launch=actif=hA, EDIT sur [hB]/[h0]/[repoA]/[@portefeuille] -> DENY CHANTIER_MISMATCH', () => {
  const state = { active: { key: HORS_A, segment: 1 }, grants: new Set() };
  for (const touched of [HORS_B, HORS_0, REPO_A, PORTEFEUILLE]) {
    assert.deepEqual(
      verdictChantier({ gesture: 'EDIT', actor: 'MAIN', sessionRole: 'odin', launch: HORS_A, state, keys: [touched] }),
      { decision: 'DENY', code: 'CHANTIER_MISMATCH' },
      `touched=${JSON.stringify(touched)}`,
    );
  }
});

test('CA-34 : memes verdicts en SUB et en SHELL_MUTATE', () => {
  const state = { active: { key: HORS_A, segment: 1 }, grants: new Set() };
  assert.deepEqual(
    verdictChantier({ gesture: 'SHELL_MUTATE', actor: 'SUB', sessionRole: 'odin', launch: HORS_A, state, keys: [HORS_A] }),
    { decision: 'ALLOW' },
  );
  assert.deepEqual(
    verdictChantier({ gesture: 'SHELL_MUTATE', actor: 'SUB', sessionRole: 'odin', launch: HORS_A, state, keys: [HORS_B] }),
    { decision: 'DENY', code: 'CHANTIER_MISMATCH' },
  );
});

test('CA-34 : SHELL_READ sur [hB] -> ALLOW (lecture toujours libre)', () => {
  const state = { active: { key: HORS_A, segment: 1 }, grants: new Set() };
  assert.deepEqual(
    verdictChantier({ gesture: 'SHELL_READ', actor: 'MAIN', sessionRole: 'odin', launch: HORS_A, state, keys: [HORS_B] }),
    { decision: 'ALLOW' },
  );
});

test('CA-34 : role team avec launch=hA -> DENY TEAM_NEEDS_REPO', () => {
  const state = { active: { key: HORS_A, segment: 1 }, grants: new Set() };
  assert.deepEqual(
    verdictChantier({ gesture: 'EDIT', actor: 'MAIN', sessionRole: 'team', launch: HORS_A, state, keys: [HORS_A] }),
    { decision: 'DENY', code: 'TEAM_NEEDS_REPO' },
  );
});

test('CA-34 : isAnchoredKey', () => {
  assert.equal(isAnchoredKey(HORS_A), true);
  assert.equal(isAnchoredKey(HORS_0), false);
  assert.equal(isAnchoredKey(REPO_A), true);
  assert.equal(isAnchoredKey(null), false);
});

// --- CA-35 : cle non ancree ----------------------------------------------------

test('CA-35 : launch=actif=h0 -> EDIT sur [hA] ou [h0] -> DENY NO_CHANTIER', () => {
  const state = { active: { key: HORS_0, segment: 1 }, grants: new Set() };
  for (const touched of [HORS_A, HORS_0]) {
    assert.deepEqual(
      verdictChantier({ gesture: 'EDIT', actor: 'MAIN', sessionRole: 'odin', launch: HORS_0, state, keys: [touched] }),
      { decision: 'DENY', code: 'NO_CHANTIER' },
      `touched=${JSON.stringify(touched)}`,
    );
  }
});

test('CA-35 : verdictDispatch — launch=actif=h0 : Explore -> ALLOW, gimli -> DENY NO_CHANTIER', () => {
  const state = { active: { key: HORS_0 }, grants: new Set(), named: new Set() };
  assert.deepEqual(
    verdictDispatch({ actor: 'MAIN', sessionRole: 'odin', target: 'Explore', requested: { key: null, ambiguous: false }, state, launch: HORS_0 }),
    { decision: 'ALLOW' },
  );
  assert.deepEqual(
    verdictDispatch({ actor: 'MAIN', sessionRole: 'odin', target: 'gimli', requested: { key: null, ambiguous: false }, state, launch: HORS_0 }),
    { decision: 'DENY', code: 'NO_CHANTIER' },
  );
});

test('CA-35 : verdictDispatch — launch=actif=hA, thread principal -> gimli -> ALLOW (chez soi, pas de regime Odin)', () => {
  const state = { active: { key: HORS_A }, grants: new Set(), named: new Set() };
  assert.deepEqual(
    verdictDispatch({ actor: 'MAIN', sessionRole: 'odin', target: 'gimli', requested: { key: null, ambiguous: false }, state, launch: HORS_A }),
    { decision: 'ALLOW' },
  );
});

// CA-8 (parite octet-pour-octet) est verrouille par guard-core-parity.test.js, verifie
// SANS MODIFICATION par ce lot (le fichier est copie a l'identique cote Codex).

// =============================================================================================
// VOIX (specs/instructions/prise-de-parole-odin-aragorn.md, Lot P1 — cle pure).
// =============================================================================================

// --- CA-P1 : isOdinSolicitation ------------------------------------------------

test('CA-P1 : isOdinSolicitation — vrai sur la 1ere ligne non vide, mot "odin" isole', () => {
  assert.equal(isOdinSolicitation('odin, où en sont mes projets ?'), true);
  assert.equal(isOdinSolicitation('Odin : point'), true);
  assert.equal(isOdinSolicitation('odin'), true);
  assert.equal(isOdinSolicitation('\n\n  ODIN, x'), true);
});

test('CA-P1 : isOdinSolicitation — faux (odin-direct, odinson, mention en phrase ou hors 1ere ligne, vide)', () => {
  assert.equal(isOdinSolicitation('odin-direct naonedge'), false);
  assert.equal(isOdinSolicitation('odinson'), false);
  assert.equal(isOdinSolicitation("je pense qu'odin a raison"), false);
  assert.equal(isOdinSolicitation('regarde ça\nodin, x'), false); // pas en 1ere ligne non vide
  assert.equal(isOdinSolicitation(''), false);
  assert.equal(isOdinSolicitation(null), false);
});

// --- CA-P2 : voiceOf ------------------------------------------------------------

test('CA-P2 : voiceOf — repo sans agentType -> aragorn, royaume MAJUSCULE, turnVoice aragorn', () => {
  assert.deepEqual(
    voiceOf({ launchKey: key('repo', '/work/naonedge', 'naonedge') }),
    { voice: 'aragorn', royaume: 'NAONEDGE', turnVoice: 'aragorn' },
  );
});

test('CA-P2 : voiceOf — repo + prompt "odin, x" -> turnVoice odin (voice reste aragorn)', () => {
  assert.deepEqual(
    voiceOf({ launchKey: key('repo', '/work/naonedge', 'naonedge'), prompt: 'odin, x' }),
    { voice: 'aragorn', royaume: 'NAONEDGE', turnVoice: 'odin' },
  );
});

test('CA-P2 : voiceOf — agentType "aragorn" sur repo + prompt "Odin" -> voice aragorn, turnVoice odin', () => {
  assert.deepEqual(
    voiceOf({ launchKey: key('repo', '/work/naonedge', 'naonedge'), agentType: 'aragorn', prompt: 'Odin, x' }),
    { voice: 'aragorn', royaume: 'NAONEDGE', turnVoice: 'odin' },
  );
});

test('CA-P2 : voiceOf — agentType hors {odin,aragorn} -> tout generic', () => {
  assert.deepEqual(
    voiceOf({ launchKey: key('repo', '/work/naonedge', 'naonedge'), agentType: 'gimli' }),
    { voice: 'generic', royaume: null, turnVoice: 'generic' },
  );
});

test('CA-P2 : voiceOf — kind "dir" -> aragorn, royaume MAJUSCULE', () => {
  assert.deepEqual(
    voiceOf({ launchKey: key('dir', '/work/nouveau', 'nouveau') }),
    { voice: 'aragorn', royaume: 'NOUVEAU', turnVoice: 'aragorn' },
  );
});

test('CA-P2 : voiceOf — portefeuille et hors -> odin/PORTEFEUILLE, avec ou sans sollicitation', () => {
  assert.deepEqual(
    voiceOf({ launchKey: PORTEFEUILLE }),
    { voice: 'odin', royaume: 'PORTEFEUILLE', turnVoice: 'odin' },
  );
  assert.deepEqual(
    voiceOf({ launchKey: PORTEFEUILLE, prompt: 'odin, x' }),
    { voice: 'odin', royaume: 'PORTEFEUILLE', turnVoice: 'odin' },
  );
  assert.deepEqual(
    voiceOf({ launchKey: key('hors', null, null) }),
    { voice: 'odin', royaume: 'PORTEFEUILLE', turnVoice: 'odin' },
  );
});

test('CA-P2 : voiceOf — launchKey absent -> tout generic', () => {
  assert.deepEqual(voiceOf({ launchKey: null }), { voice: 'generic', royaume: null, turnVoice: 'generic' });
  assert.deepEqual(voiceOf({}), { voice: 'generic', royaume: null, turnVoice: 'generic' });
});
