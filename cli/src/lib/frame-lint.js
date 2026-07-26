// frame lint - validateur de GRAPHE frame (Lot 1, outillage-forge-frame.md § 3). Ce module HISSE
// `checkRefs` (le noyau I1 de library.js, inchange) au niveau de `checkFrameRefs`
// (@iakaframe/core packages/core/src/frame.ts), en COMPLETANT les refs sortantes des atomes de
// pool (T1 persona / T5 workflow / T3 skill) que le CLI ne couvrait pas. Ce n'est PAS un 3e
// moteur : le noyau method/team/binding/frame reste `checkRefs` ; la parite avec le coeur GUI est
// VERROUILLEE par cli/test/frame-lint-parity.test.js (charge le vrai checkFrameRefs via esbuild).
// Zero dependance runtime. NE MUTE JAMAIS le disque (calque de `frame verify`, AC1.12).
import {
  checkRefs, scan, readEntry, assemble, toArray, bindingRows,
} from './library.js';
import { frameDescriptor } from './frame-active.js';
import { checkDocSchema, checkStepFields, SOURCE_TO_TYPE } from './frontmatter-schema.js';

// Miroir des CLES de WORKFLOW_CATALOG du coeur (@iakaframe/core workflow.ts, WORKFLOW_CATALOG /
// workflowById). ARB-2 : un `workflowId` connu de ce catalogue partage mais ABSENT du pool est
// TOLERE (avertissement, jamais un blocage), a parite avec checkFrameRefs. Toute derive de ce
// catalogue cote coeur rougit frame-lint-parity.test.js (qui charge le vrai WORKFLOW_CATALOG).
export const WORKFLOW_CATALOG_IDS = ['iakaframe-canonical'];

// Collections de POOL soumises au controle d'unicite inter-collections (Finding 3, AC1.8). Les
// collections d'ASSEMBLAGE (frames/methods/teams/bindings/kits) partagent LEGITIMEMENT le nom de
// base d'une frame (ex. iakaframe.md en frames/ ET methods/) : elles sont exclues.
export const POOL_TYPES = [
  'personas', 'skills', 'principles', 'rituals', 'guardrails', 'roles', 'workflows', 'scaffolds',
];

// roleKeys sortantes d'un workflow (modele AGNOSTIQUE, correction-biais-modele-frame.md § 3.1).
// Lecture ALIAS-AWARE, miroir EXACT de parseWorkflowRefs du coeur (@iakaframe/core frame.ts) :
//   - conteneur d'etapes unifie : `phases` (canon, A-1) OU `stages` (alias Kanban) ;
//   - champ d'acteurs unifie : `actorsRoleKeys` (canon, A-2) OU `agentsRoleKeys` (alias retro-compat).
// AVANT ce lot, seul `phases[].agentsRoleKeys` etait lu : les refs d'acteurs des 8 frames forges (qui
// portent `actorsRoleKeys`, et `stages` pour Kanban) ECHAPPAIENT au lint (vacuite § 1.3). Ce
// correctif de justesse ferme le trou : une roleKey pendante dans un `actorsRoleKeys` forge rougit
// desormais reellement (AC4). Le libelle de finding reste `agentsRoleKeys` (stable, parite CLI<->GUI).
function workflowRoleKeys(data) {
  const out = [];
  const steps = data.phases != null ? data.phases : data.stages;
  for (const ph of toArray(steps)) {
    if (ph && typeof ph === 'object') {
      const actors = ph.actorsRoleKeys != null ? ph.actorsRoleKeys : ph.agentsRoleKeys;
      for (const k of toArray(actors)) if (!out.includes(k)) out.push(k);
    }
  }
  return out;
}

// --- Lint d'UNE frame : resout le graphe tire par le descripteur et agrege tous les findings. ----
// Retourne { ok, frame, found, checked, findings:[{severity, source, field, id, kind}] }.
//   severity : 'blocking' (exit 1) | 'warning' (exit 0, liste).
//   source   : frame:<id> | method:<id> | team:<id> | binding:<id> | persona:<id> | workflow:<id>
//              | skill:<id> | pool:<id>.
export function lintFrame(frameId, root, { strict = false } = {}) {
  const findings = [];
  const add = (severity, source, field, id, kind) =>
    findings.push({ severity, source, field, id, kind });

  const desc = frameDescriptor(frameId, root);
  if (!desc) {
    return {
      ok: false, frame: frameId, found: false, checked: 0,
      findings: [{ severity: 'blocking', source: `frame:${frameId}`, field: 'id', id: frameId, kind: 'frame-not-found' }],
    };
  }

  // Ensembles d'ids des collections de pool, precalcules une fois (refs sortantes + unicite).
  const pools = {};
  for (const t of POOL_TYPES) pools[t] = new Set(scan(t, root).map(e => e.id));

  // Documents du graphe (pour l'invariant id == nom de fichier, AC1.7).
  const docs = [];
  const pushDoc = (source, entry) => { if (entry) docs.push({ source, entry }); };
  pushDoc(`frame:${desc.id}`, desc);

  // 1) Noyau frame : methodId ∈ methods, teamId ∈ teams (checkRefs, reutilise inchange).
  for (const m of checkRefs('frame', desc.data, root).missing) {
    add('blocking', `frame:${desc.id}`, m.field, m.id, 'missing-ref');
  }

  const methodId = desc.data.methodId;
  const teamId = desc.data.teamId;
  const method = methodId ? readEntry('methods', methodId, root) : null;
  const team = teamId ? readEntry('teams', teamId, root) : null;
  pushDoc(`method:${methodId}`, method);
  pushDoc(`team:${teamId}`, team);

  // 2) Refs de la methode (checkRefs, reutilise) + ARB-2 : workflowId catalogue-connu, pool-absent
  //    => avertissement, pas blocage (parite checkFrameRefs).
  if (method) {
    for (const m of checkRefs('method', method.data, root).missing) {
      if (m.field === 'workflowId' && WORKFLOW_CATALOG_IDS.includes(m.id)) {
        add('warning', `method:${method.id}`, m.field, m.id, 'workflow-catalog');
      } else {
        add('blocking', `method:${method.id}`, m.field, m.id, 'missing-ref');
      }
    }
  }

  // 3) Refs de la team (checkRefs, reutilise) : personas/coordinator/guardrails.
  if (team) {
    for (const m of checkRefs('team', team.data, root).missing) {
      add('blocking', `team:${team.id}`, m.field, m.id, 'missing-ref');
    }
  }

  // 4) Binding(s) apparie(s) au couple (method, team) : refs + runner (checkRefs, reutilise).
  const bindings = scan('bindings', root)
    .map(e => readEntry('bindings', e.id, root))
    .filter(b => b && b.data.methodId === methodId && b.data.teamId === teamId);
  for (const b of bindings) {
    pushDoc(`binding:${b.id}`, b);
    const bref = checkRefs('binding', b.data, root);
    for (const m of bref.missing) add('blocking', `binding:${b.id}`, m.field, m.id, 'missing-ref');
    for (const br of bref.badRunners) add('blocking', `binding:${b.id}`, 'runner', br.runner, 'bad-runner');
  }

  // 5) Couverture du casting (reutilise `assemble` plutot que de la refaire, § 3.3.3) : un role
  //    requis par la methode non couvert (ni persona dediee, ni coordinateur) est orphelin
  //    bloquant ; couvert par le coordinateur => avertissement. Persona inexistante deja captee
  //    par checkRefs('team'). Incoherence de binding => bloquant.
  if (method && team) {
    const asm = assemble(methodId, teamId, bindings[0] ? bindings[0].id : undefined, root);
    for (const r of asm.orphans || []) add('blocking', `team:${teamId}`, 'roleKeys', r, 'casting-orphan');
    for (const r of asm.coveredByCoordinator || []) add('warning', `team:${teamId}`, 'roleKeys', r, 'coordinator-covered');
    if (asm.error) add('blocking', `binding:${bindings[0] ? bindings[0].id : '?'}`, 'binding', asm.error, 'binding-incoherent');
  }

  // 6) Refs SORTANTES des atomes de pool, frame-scopees (T1/T5/T3 - trous que checkRefs ne couvrait
  //    pas). Ensemble reachable = atomes REFERENCES par l'assemblage.
  const reachP = new Set();
  if (team) {
    for (const p of toArray(team.data.personas)) reachP.add(p);
    if (team.data.coordinator) reachP.add(team.data.coordinator);
  }
  for (const b of bindings) for (const row of bindingRows(b.data)) if (row && row.personaId) reachP.add(row.personaId);

  const personaEntries = [];
  for (const pid of reachP) {
    const p = readEntry('personas', pid, root);
    if (!p) continue; // persona inexistante deja bloquee par checkRefs('team')/binding
    personaEntries.push(p);
    pushDoc(`persona:${p.id}`, p);
    if (p.data.roleKey && !pools.roles.has(p.data.roleKey)) {
      add('blocking', `persona:${p.id}`, 'roleKey', p.data.roleKey, 'missing-ref');
    }
    for (const s of toArray(p.data.skills)) if (!pools.skills.has(s)) add('blocking', `persona:${p.id}`, 'skills', s, 'missing-ref');
    for (const g of toArray(p.data.guardrails)) if (!pools.guardrails.has(g)) add('blocking', `persona:${p.id}`, 'guardrails', g, 'missing-ref');
  }

  // Skills reachable = cloture des `skills` des personas castees via `subskills`.
  const reachS = new Set();
  const queue = [];
  for (const p of personaEntries) for (const s of toArray(p.data.skills)) if (!reachS.has(s)) { reachS.add(s); queue.push(s); }
  while (queue.length) {
    const sid = queue.shift();
    const s = readEntry('skills', sid, root);
    if (!s) continue;
    for (const sub of toArray(s.data.subskills)) if (!reachS.has(sub)) { reachS.add(sub); queue.push(sub); }
  }
  for (const sid of reachS) {
    const s = readEntry('skills', sid, root);
    if (!s) continue; // skill pendante deja bloquee comme persona.skills / subskills missing-ref
    pushDoc(`skill:${s.id}`, s);
    const subs = toArray(s.data.subskills);
    if (subs.includes(s.id)) add('blocking', `skill:${s.id}`, 'subskills', s.id, 'self-ref');
    for (const sub of subs) if (sub !== s.id && !pools.skills.has(sub)) add('blocking', `skill:${s.id}`, 'subskills', sub, 'missing-ref');
  }

  // Workflow reachable = method.workflowId (T5), seulement s'il est dans le pool (le cas
  // catalogue-connu/pool-absent est un avertissement traite en 2, sans agentsRoleKeys a lire).
  if (method && method.data.workflowId && pools.workflows.has(method.data.workflowId)) {
    const wf = readEntry('workflows', method.data.workflowId, root);
    if (wf) {
      pushDoc(`workflow:${wf.id}`, wf);
      for (const rk of workflowRoleKeys(wf.data)) if (!pools.roles.has(rk)) add('blocking', `workflow:${wf.id}`, 'agentsRoleKeys', rk, 'missing-ref');
      // D-6 : `soleActor` promu first-class ET verifie comme ref persona (meme classe que le trou
      // d'acteurs de v0.26.0). Sa cible doit resoudre dans le pool des personas ; sinon bloquant.
      if (wf.data.soleActor && !pools.personas.has(wf.data.soleActor)) {
        add('blocking', `workflow:${wf.id}`, 'soleActor', wf.data.soleActor, 'missing-ref');
      }
    }
  }

  // 7) id interne == nom de fichier, pour CHAQUE document du graphe (invariant I2, AC1.7).
  for (const { source, entry } of docs) {
    if (entry.data.id !== entry.id) {
      add('blocking', source, 'id', entry.data.id == null ? '(absent)' : String(entry.data.id), 'id-filename');
    }
  }

  // 8) Unicite inter-collections de POOL (Finding 3, AC1.8) : un id present dans >1 collection de
  //    pool est SIGNALE. AVERTISSEMENT (non bloquant) et non blocage : le reservoir reel partage
  //    DELIBEREMENT des ids (`qualite`/`documentation` = principe ET role, `portefeuille` = role
  //    ET scaffold, `iakastart` = skill ET rituel). Cf. compte rendu (tension § 3.4 vs AC1.8).
  //    Scope aux ids REFERENCES par le graphe.
  const referenced = new Set([...reachP, ...reachS]);
  if (method) {
    for (const f of ['principleIds', 'ritualIds', 'guardrailIds', 'roleKeys', 'scaffoldIds']) {
      for (const id of toArray(method.data[f])) referenced.add(id);
    }
    if (method.data.workflowId) referenced.add(method.data.workflowId);
  }
  if (team) for (const g of toArray(team.data.guardrails)) referenced.add(g);
  for (const p of personaEntries) {
    if (p.data.roleKey) referenced.add(p.data.roleKey);
    for (const g of toArray(p.data.guardrails)) referenced.add(g);
  }
  for (const id of referenced) {
    const cols = POOL_TYPES.filter(t => pools[t].has(id));
    if (cols.length > 1) add('warning', `pool:${id}`, 'id', id, 'id-collision');
  }

  // 9) Passe de SCHEMA de frontmatter (Finding 3) : pour CHAQUE document du graphe, type les champs
  //    connus (bad-type / missing-field bloquants, AC2) et signale l'inconnu (unknown-field :
  //    WARN par defaut, bloquant sous --strict, AC3). Le schema est la table-donnee faisant autorite
  //    (library/_schema/frontmatter.json, source unique 5a). Fork A : les 8 frames rangees portent
  //    des champs connus/types => ni warning ni blocage (invariant AC6 tenu par construction).
  for (const { source, entry } of docs) {
    const type = SOURCE_TO_TYPE[source.split(':')[0]];
    if (!type || !entry || !entry.data) continue;
    for (const f of checkDocSchema(type, entry.data, { strict })) add(f.severity, source, f.field, f.id, f.kind);
    if (type === 'workflows') for (const f of checkStepFields(type, entry.data)) add(f.severity, source, f.field, f.id, f.kind);
  }

  const ok = !findings.some(f => f.severity === 'blocking');
  return { ok, frame: desc.id, found: true, checked: docs.length, findings };
}

// --- Lint de TOUTES les frames de frames/ (kind flat : ignore frames/releases/ par construction,
//     le scan `flat` ne lit que les *.md directs). Agrege ; exit 1 si au moins une est bloquante.
export function lintAllFrames(root, { strict = false } = {}) {
  const results = scan('frames', root).map(e => lintFrame(e.id, root, { strict }));
  const findings = [];
  for (const r of results) for (const f of r.findings) findings.push({ ...f, frame: r.frame });
  return { ok: results.every(r => r.ok), checked: results.length, results, findings };
}
