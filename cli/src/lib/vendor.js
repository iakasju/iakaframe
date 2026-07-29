// Garde de VENDORAGE cross-repo (specs/instructions/garde-vendor-check-cross-repo.md).
//
// PROBLEME FERME ICI : les fixtures de test de iakaFrameGUI sont des COPIES d'artefacts canon de
// iakaframe. Un drift injecte a travers binding + golden + sha256 RECALCULES ENSEMBLE laisse la
// suite GUI verte (475/475, constate au gate v0.17.14) : la GUI ne compare jamais ses copies a la
// SOURCE, seulement a elles-memes. Aucune garde vivant DANS la GUI ne peut le detecter. Celle-ci
// lit LES DEUX depots, depuis la source, qui est l'autorite.
//
// LIMITE ASSUMEE (§ 8) : un drift injecte simultanement et de facon coherente dans les DEUX depots
// reste indetectable — plus aucun referentiel externe ne permet de le juger. La garde ramene le
// cout d'un drift silencieux de « un commit dans un depot » a « deux commits coherents dans deux
// depots ». C'est le maximum atteignable sans depot tiers d'ancrage.
//
// DEUX NATURES DE FIXTURES, deux traitements (§ 3.3) — ne jamais les confondre :
//   - 78 COPIES (9 personas + 9 goldens + 1 binding + 1 workflow + 18 principles + 6 rituals +
//     3 scaffolds + 9 roles + 3 guardrails + 19 skills) -> comparaison BYTE-A-BYTE. Les 3 pools
//     plats a parseur (principles/rituals/scaffolds) sont vendorises au Lot 5b ; les 3 pools SANS
//     parseur (roles/guardrails/skills) au Lot 5c (persistance-5c-roles-guardrails-skills.md § 6),
//     tous sur l'ENSEMBLE REFERENCE par la methode canonique iakaframe (principleIds/ritualIds/
//     scaffoldIds/roleKeys/guardrailIds + union persona.skills fermee sur subskills), exactement
//     comme les 9 personas vendorisent le casting de la team active (jamais tout le pool) ;
//   - 4 DERIVEES (methode, methode wrapped, team, kit) -> ce sont des formes canoniques
//     SERIALISEES, pas des copies. Comparaison de FRONTMATTER SEMANTIQUE, corps EXEMPTE.
//     Exception : le kit, seul cas ou une egalite byte est definie, et elle l'est contre le
//     GOLDEN CLI DEPOUILLE DE SON EN-TETE — jamais contre kits/iakaframe-claude.md, qui n'a de
//     relation d'egalite avec aucun des deux (A21).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { parseFrontmatter } from './frontmatter.js';
import { generateAgent, loadDefaultBinding } from './generate-agents.js';

// Meme liste et meme ordre que le test d'inventaire de cli/test/parite-generateurs.test.js.
export const IDS = ['aragorn', 'feanor', 'gandalf', 'gimli', 'helm', 'legolas', 'loki', 'nathalie', 'odin'];

// Pools plats a parseur vendorises au Lot 5b : l'ENSEMBLE REFERENCE par la methode canonique
// (methods/iakaframe.md : principleIds/ritualIds/scaffoldIds) — pas tout le pool disque, exactement
// comme IDS ci-dessus vendorise le casting de la team, pas les 34 personas de library/personas.
export const PRINCIPLE_IDS = [
  'qualite', 'gestion-backlog', 'documentation', 'commits-versionnement', 'isolation-docker',
  'self-hosted-first', 'reutilisation-existant', 'mvp-first', 'identite-badges', 'perimetres-etanches',
  'langue', 'mock-en-dev', 'cadrage-avant-code', 'confirmation-actes-destructifs',
  'interruption-minimale-odin', 'merge-versionnement', 'canon-avant-citation', 'preuve-avant-declaration',
];
export const RITUAL_IDS = ['iakastart', 'init', 'update', 'snapshot', 'log-conversation', 'retrospective'];
export const SCAFFOLD_IDS = ['portefeuille', 'projet', 'recette-guidee'];

// Pools SANS parseur vendorises au Lot 5c (persistance-5c-roles-guardrails-skills.md § 6) : le meme
// principe que ci-dessus — l'ENSEMBLE REFERENCE par la methode canonique iakaframe, pas tout le pool.
//   - roles     : les 9 `roleKeys` de methods/iakaframe.md (identite = `key`, fichier `<key>.md`) ;
//   - guardrails: les 3 `guardrailIds` de la methode (identite = `id`, fichier `<id>.md`) ;
//   - skills    : l'union des `persona.skills` des 9 personas de la team active + la FERMETURE des
//     `subskills` (mesuree sur le disque) — stockees en DOSSIER `<id>/SKILL.md` (le walk recursif de
//     `listFixtureFiles` la supporte nativement ; chaque `skills/<id>/SKILL.md` est une copie valide).
export const ROLE_KEYS = [
  'portefeuille', 'coordination', 'cadrage', 'dev', 'qualite', 'deploiement', 'design',
  'documentation', 'frame',
];
export const GUARDRAIL_IDS = ['identity', 'perimeter', 'delegation'];
export const SKILL_IDS = [
  // Union des `persona.skills` du casting (9 personas de teams/iakaframe-8.md) ...
  'iakaframe-aragorn', 'iakaframe-frame', 'iakaframe-cadrage', 'iakaframe-lecture-maquettes',
  'iakaframe-fabrication', 'iakaframe-deploiement', 'iakaframe-qualite', 'iakaframe-naonedge',
  'iakaframe-nathalie', 'iakaframe-memoire-humaine', 'iakaframe-odin', 'iakastart',
  // ... + fermeture des `subskills` (mesuree) : jalon, gestion-de-source->git->forgejo,
  // conteneurisation->docker, appflowy-doc.
  'iakaframe-jalon', 'iakaframe-gestion-de-source', 'iakaframe-conteneurisation',
  'iakaframe-appflowy-doc', 'iakaframe-git', 'iakaframe-docker', 'iakaframe-forgejo',
];

// 20 (9 personas + 9 goldens + 1 binding + 1 workflow) + 18 principles + 6 rituals + 3 scaffolds
// + 9 roles + 3 guardrails + 19 skills (Lot 5c) = 78.
export const EXPECTED_COPIES = 78;
export const EXPECTED_DERIVED = 4;   // methode, methode wrapped, team, kit

const FIXTURES_REL = path.join('packages', 'core', '__tests__', 'fixtures');

export function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

// --- Resolution du depot frere (§ 4.1) --------------------------------------------------------
// Calquee sur cli/test/vocab-parity.test.js : override d'environnement, puis depots voisins sous
// le meme dossier chapeau, casse alternative comprise. Un candidat n'est retenu que si son
// dossier de fixtures existe (evite de designer un dossier homonyme vide).
// L'override d'environnement, S'IL EST POSE, est AUTORITAIRE : il n'est jamais suivi d'un repli.
// L'instruction dit « premier chemin existant gagne » (§ 4.1) ET « IAKAFRAME_GUI_ROOT inexistant
// => SKIP » (A8). Sur une machine de dev ou le frere reel est a cote, les deux sont incompatibles.
// Tranche en faveur de l'override autoritaire, pour deux raisons :
//   1. retomber en silence sur un AUTRE depot que celui explicitement designe ferait juger la
//      garde sur un referentiel que l'operateur n'a pas choisi, et rendre un verdict confiant
//      dessus — precisement la classe de defaut que ce lot ferme ;
//   2. sinon le chemin « frere absent » serait INTESTABLE des qu'un frere existe, et la
//      degradation gracieuse ne serait jamais eprouvee.
// Le « premier existant gagne » garde tout son sens entre les deux candidats IMPLICITES.
export function guiCandidates(root, env = process.env) {
  const override = env.IAKAFRAME_GUI_ROOT;
  if (override && String(override).trim() !== '') return [override];
  return [
    path.resolve(root, '..', 'iakaFrameGUI'),
    path.resolve(root, '..', 'iakaframegui'),
  ];
}

// Un candidat n'est retenu que si son dossier de fixtures existe : un dossier homonyme vide ne
// doit jamais etre pris pour le miroir.
export function resolveGuiRoot(root, env = process.env) {
  for (const cand of guiCandidates(root, env)) {
    try {
      if (fs.existsSync(path.join(cand, FIXTURES_REL))) return cand;
    } catch { /* candidat illisible : ignore */ }
  }
  return null;
}

// --- Table des 22 fixtures (§ 4.2, source de verite du lot) -----------------------------------
// `kind` : 'copy' (byte-a-byte) | 'derived' (frontmatter semantique, corps exempte).
// `mode` pour les derivees : 'frontmatter' | 'bytes' (le kit seul).
export function fixtureTable() {
  const rows = [];
  for (const id of IDS) {
    rows.push({
      family: 'personas', kind: 'copy', fixture: path.join('personas', `${id}.md`),
      source: path.join('library', 'personas', `${id}.md`), id,
    });
  }
  for (const id of IDS) {
    rows.push({
      family: 'goldens', kind: 'copy', fixture: path.join('agents-golden', `${id}.md`),
      source: path.join('cli', 'test', 'fixtures', 'agents-golden', `${id}.md`), id,
    });
  }
  rows.push({
    family: 'binding', kind: 'copy',
    fixture: path.join('binding', 'iakaframe-claude-default.md'),
    source: path.join('bindings', 'iakaframe-claude-default.md'),
  });
  // Workflow : COPIE byte-a-byte du canon (etape 3bis, reconciliation GUI <- frame). Le corps
  // n'est PAS exempte : c'est une copie conforme, pas une derivee serialisee.
  rows.push({
    family: 'workflow', kind: 'copy',
    fixture: 'workflow.iakaframe-3phases.md',
    source: path.join('library', 'workflows', 'iakaframe-3phases.md'),
  });
  rows.push({
    family: 'methode', kind: 'derived', mode: 'frontmatter',
    fixture: 'method.iakaframe.md', source: path.join('methods', 'iakaframe.md'),
  });
  rows.push({
    family: 'methode-wrapped', kind: 'derived', mode: 'frontmatter',
    fixture: 'method.iakaframe-wrapped.md', source: path.join('methods', 'iakaframe.md'),
  });
  rows.push({
    family: 'team', kind: 'derived', mode: 'frontmatter',
    fixture: 'team.iakaframe-8.md', source: path.join('teams', 'iakaframe-8.md'),
  });
  // Kit : reference = golden CLI DEPOUILLE de son en-tete, byte-a-byte (A21).
  rows.push({
    family: 'kit', kind: 'derived', mode: 'bytes', strip: true,
    fixture: 'kit.iakaframe-claude.md',
    source: path.join('cli', 'test', 'fixtures', 'kit.iakaframe-claude.golden.md'),
  });
  // Pools plats a parseur (Lot 5b) : COPIES byte-a-byte du canon library/<pool>/<id>.md. Le corps
  // n'est PAS exempte (ce sont des copies conformes, pas des derivees serialisees) : le round-trip
  // non-destructif cote GUI (patchFrontmatter) preserve frontmatter + corps a l'octet.
  for (const id of PRINCIPLE_IDS) {
    rows.push({
      family: 'principles', kind: 'copy', fixture: path.join('principles', `${id}.md`),
      source: path.join('library', 'principles', `${id}.md`), id,
    });
  }
  for (const id of RITUAL_IDS) {
    rows.push({
      family: 'rituals', kind: 'copy', fixture: path.join('rituals', `${id}.md`),
      source: path.join('library', 'rituals', `${id}.md`), id,
    });
  }
  for (const id of SCAFFOLD_IDS) {
    rows.push({
      family: 'scaffolds', kind: 'copy', fixture: path.join('scaffolds', `${id}.md`),
      source: path.join('library', 'scaffolds', `${id}.md`), id,
    });
  }
  // Pools SANS parseur (Lot 5c) : COPIES byte-a-byte du canon. roles/guardrails sont plats
  // (`library/<pool>/<id>.md`) ; skills est un DOSSIER (`library/skills/<id>/SKILL.md`). Le corps
  // n'est PAS exempte : le round-trip non-destructif cote GUI (patchFrontmatter) preserve
  // frontmatter + corps a l'octet (cf. parse{Role,Guardrail,Skill} + <pool>FrontmatterPatch).
  for (const key of ROLE_KEYS) {
    rows.push({
      family: 'roles', kind: 'copy', fixture: path.join('roles', `${key}.md`),
      source: path.join('library', 'roles', `${key}.md`), id: key,
    });
  }
  for (const id of GUARDRAIL_IDS) {
    rows.push({
      family: 'guardrails', kind: 'copy', fixture: path.join('guardrails', `${id}.md`),
      source: path.join('library', 'guardrails', `${id}.md`), id,
    });
  }
  for (const id of SKILL_IDS) {
    rows.push({
      family: 'skills', kind: 'copy', fixture: path.join('skills', id, 'SKILL.md'),
      source: path.join('library', 'skills', id, 'SKILL.md'), id,
    });
  }
  return rows;
}

// Contenu utile d'un fichier a en-tete de provenance : tout depuis le 1er `---\n` (l'en-tete n'en
// contient jamais). Sert au golden du kit (A21) et au niveau 2 sur les goldens d'agents.
export function stripHeader(raw) {
  const i = String(raw).indexOf('---\n');
  return i < 0 ? null : String(raw).slice(i);
}

// Egalite SEMANTIQUE de deux frontmatters parses : le re-wrapping d'une liste flow ne doit JAMAIS
// produire de faux positif (A17) — parseFrontmatter rend deja les listes multi-lignes sous forme
// de tableaux, la comparaison porte donc sur les valeurs, pas sur la mise en page.
export function frontmatterDiff(a, b) {
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
  const diffs = [];
  for (const k of keys) {
    const va = JSON.stringify(a[k] === undefined ? null : a[k]);
    const vb = JSON.stringify(b[k] === undefined ? null : b[k]);
    if (va !== vb) diffs.push({ field: k, source: JSON.parse(va), fixture: JSON.parse(vb) });
  }
  return diffs;
}

// --- Verification complete --------------------------------------------------------------------
// Retourne un rapport C-JSON-able. `ok` ne vaut JAMAIS true sans verification reelle (A.1/A19) :
// il implique status 'clean' ET checked == EXPECTED_COPIES ET derived == EXPECTED_DERIVED —
// l'attendu EXACT, jamais un minimum.
export function checkVendor({ root, guiRoot = undefined, env = process.env } = {}) {
  const gui = guiRoot === undefined ? resolveGuiRoot(root, env) : guiRoot;
  if (!gui) {
    // Frere absent : rien n'a ete compare. ok:false (« je n'ai pas verifie »), et le code de
    // sortie reste 0 cote appelant (« je ne te bloque pas ») — deux questions, deux valeurs.
    return {
      ok: false,
      status: 'skipped',
      reason: 'depot iakaFrameGUI introuvable (clone isole) - aucune comparaison effectuee',
      guiRoot: null,
      checked: 0, derived: 0, drift: 0,
      count: 0, files: [], derivedFixtures: [],
      candidates: guiCandidates(root, env),
    };
  }

  const fixturesDir = path.join(gui, FIXTURES_REL);
  const rows = fixtureTable();
  const files = [];            // fixtures en derive (une entree par fixture, raisons agregees)
  const derivedFixtures = [];  // declaration explicite du statut des 4 derivees (A18)
  let checked = 0;
  let derivedChecked = 0;

  const record = (row, reason, extra = {}) => {
    let entry = files.find((f) => f.fixture === row.fixture);
    if (!entry) {
      entry = {
        fixture: row.fixture, family: row.family, kind: row.kind,
        source: row.source, reasons: [],
      };
      files.push(entry);
    }
    entry.reasons.push({ reason, ...extra });
  };

  for (const row of rows) {
    const fixturePath = path.join(fixturesDir, row.fixture);
    const sourcePath = path.join(root, row.source);
    const hasFixture = fs.existsSync(fixturePath);
    const hasSource = fs.existsSync(sourcePath);

    // Anti-regression d'inventaire (§ 4.3) : fixture manquante = rouge, jamais un compte allege.
    if (!hasFixture) { record(row, 'fixture-manquante'); continue; }
    if (!hasSource) { record(row, 'source-introuvable'); continue; }

    const fixtureRaw = fs.readFileSync(fixturePath, 'utf8');
    const sourceRaw = fs.readFileSync(sourcePath, 'utf8');

    if (row.kind === 'copy') {
      checked++;
      if (fixtureRaw !== sourceRaw) record(row, 'contenu-different');
      continue;
    }

    // --- derivees ---
    derivedChecked++;
    const note = { fixture: row.fixture, family: row.family, status: 'derived', mode: row.mode };

    if (row.mode === 'bytes') {
      const expected = row.strip ? stripHeader(sourceRaw) : sourceRaw;
      if (expected == null) {
        record(row, 'en-tete-golden-illisible');
        note.frontmatterOk = false;
      } else {
        const same = fixtureRaw === expected;
        note.frontmatterOk = same;
        note.bodyExempt = false; // egalite byte definie : rien n'est exempte pour le kit
        if (!same) record(row, 'contenu-different-vs-golden-depouille');
      }
      derivedFixtures.push(note);
      continue;
    }

    // Frontmatter semantique, corps EXEMPTE (A17/A18/A20) : une derive de frontmatter est un
    // drift ; un ecart de corps est DECLARE mais jamais compte en drift.
    const src = parseFrontmatter(sourceRaw);
    const fix = parseFrontmatter(fixtureRaw);
    const diffs = frontmatterDiff(src.data, fix.data);
    note.frontmatterOk = diffs.length === 0;
    note.bodyExempt = true;
    note.bodyDiffers = src.body !== fix.body;
    if (diffs.length) {
      note.fields = diffs.map((d) => d.field);
      record(row, 'frontmatter-different', { fields: diffs });
    }
    derivedFixtures.push(note);
  }

  // Fixture SURNUMERAIRE (§ 4.3) : un fichier .md non attendu dans l'arbre de fixtures vendorees.
  const expectedRel = new Set(rows.map((r) => r.fixture));
  for (const rel of listFixtureFiles(fixturesDir)) {
    if (!expectedRel.has(rel)) {
      files.push({
        fixture: rel, family: 'inconnue', kind: 'unexpected', source: null,
        reasons: [{ reason: 'fixture-surnumeraire' }],
      });
    }
  }

  // --- Niveau 2 : fidelite au rendu VIVANT (A12, § 3.3) ----------------------------------------
  // Ancre la comparaison sur le CANON (library/personas + bindings), jamais sur un artefact
  // derive : c'est ce niveau qui defait le drift mutuellement coherent. Un golden vendore
  // re-signe cote GUI passe le niveau 1 contre un golden CLI lui aussi drifte, mais echoue ici.
  try {
    const binding = loadDefaultBinding(root);
    for (const id of IDS) {
      const row = rows.find((r) => r.family === 'goldens' && r.id === id);
      const fixturePath = path.join(fixturesDir, row.fixture);
      if (!fs.existsSync(fixturePath)) continue; // deja signale au niveau 1
      const useful = stripHeader(fs.readFileSync(fixturePath, 'utf8'));
      if (useful == null) { record(row, 'golden-vendore-sans-frontmatter'); continue; }
      const live = generateAgent(id, { root, binding });
      if (sha256(useful) !== sha256(live)) {
        record(row, 'niveau2-contrat-vivant-different', {
          vendoredSha: sha256(useful), liveSha: sha256(live),
        });
      }
    }
  } catch (e) {
    files.push({
      fixture: '(niveau 2)', family: 'goldens', kind: 'copy', source: null,
      reasons: [{ reason: 'niveau2-injouable', detail: String(e && e.message ? e.message : e) }],
    });
  }

  const drift = files.length;
  const inventoryOk = checked === EXPECTED_COPIES && derivedChecked === EXPECTED_DERIVED;
  const ok = drift === 0 && inventoryOk;

  return {
    ok,
    status: ok ? 'clean' : 'drift',
    guiRoot: gui,
    checked, derived: derivedChecked,
    expected: { copies: EXPECTED_COPIES, derived: EXPECTED_DERIVED },
    drift,
    count: files.length,
    files,
    derivedFixtures,
  };
}

// Liste recursive des .md sous le dossier de fixtures, en chemins relatifs POSIX-ises pour la
// comparaison a la table. `raw-md.d.ts` et consorts (non .md) sont hors sujet.
function listFixtureFiles(dir) {
  const out = [];
  const walk = (cur, rel) => {
    let entries = [];
    try { entries = fs.readdirSync(cur, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const child = path.join(cur, e.name);
      const childRel = rel ? path.join(rel, e.name) : e.name;
      if (e.isDirectory()) walk(child, childRel);
      else if (e.name.endsWith('.md')) out.push(childRel);
    }
  };
  walk(dir, '');
  return out.sort();
}
