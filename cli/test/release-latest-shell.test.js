// release-latest-shell.test.js — AR-5(a) : LA JAMBE « EXECUTION » du gate CI de
// `.github/workflows/release.yml`, absente jusqu'ici (instruction ci-release-latest-non-maitrise.md).
//
// CONTEXTE MESURE (§ 0/§ 2 de l'instruction, runs REELS `33959443438` v0.40.0 et `34001818646`
// v0.41.0) : l'etape `rang` calcule `make_latest` en comparant `$TAG` au plus haut semver tire de
// la population des RELEASES DEJA PUBLIEES — une population qui NE CONTIENT JAMAIS le tag qu'on
// est en train de publier, puisque cette etape tourne AVANT que `softprops` cree sa release.
// Consequence structurelle : `$TAG = $PLUS_HAUT` n'est JAMAIS vrai sur une publication normale, la
// branche `elif` est MORTE, et le flot tombe systematiquement sur `make_latest=false`. Mesure au
// mot pres (run `34001818646`) :
//   DECISION : v0.41.0 n'est PAS le plus haut (v0.40.0) -> make_latest=false.
// AR-1(a) corrige la COMPARAISON (faire entrer `$TAG` dans la population AVANT le tri) ; AR-2(a)
// pose le filet (l'etape « Verifier » RATTRAPE elle-meme puis RE-MESURE).
//
// POURQUOI LA GARDE DE TEXTE NE POUVAIT PAS VOIR CA (AR-5, motif refuse (b)) : le YAML
// `make_latest: ${{ steps.rang.outputs.make_latest }}` est PARFAITEMENT correct en texte — c'est
// exactement ce que le cartouche exige. Ce qui est faux, c'est la VALEUR CALCULEE trois lignes
// plus haut. Seule une garde qui EXECUTE l'etape `rang` et LIT ce qu'elle ecrit dans
// `$GITHUB_OUTPUT` peut voir la difference. Meme discipline de limite declaree que la sœur
// `iakaInstall/scripts/__tests__/release-publier-shell.test.mjs` (run reel `34026373514`).
//
// METHODE : on EXTRAIT le script shell de chaque etape concernee directement depuis le TEXTE
// ACTUEL de `.github/workflows/release.yml` (extraction PAR MARQUEUR, `extraireEtapeRun` de
// `../scripts/lib/release-shell.js`, jamais par numero de ligne), et on l'EXECUTE en `bash -c`
// avec un FAUX `gh` place en tete de PATH (`FAKE_GH_SOURCE`, meme module). Ce faux `gh` :
//   - reproduit la MEME regle d'arite que le vrai sur `gh api` (un SEUL argument positionnel,
//     l'endpoint) — la classe de defaut CA-L5 qui a fait rougir le run `34026373514` de la sœur ;
//   - simule un petit monde de releases (fichier JSON local, JAMAIS de reseau) ;
//   - journalise CHAQUE invocation (verification apres coup de CE QUI A ETE APPELE) ;
//   - un mode `EDIT_NOOP` pour simuler `gh release edit` qui REUSSIT SANS RIEN CHANGER (le
//     contrefactuel de CA-L4).
// Le VRAI `jq` du poste est utilise (jamais un faux) — ABSENT => les tests de ce fichier sont
// SKIP, EXPLICITEMENT NOMMES (jamais un vert silencieux). Idem pour `bash`.
//
// CE QUE CE FICHIER NE PROUVE PAS (limite DECLAREE, § 7.3 de l'instruction) : que le VRAI `gh` de
// GitHub Actions se comporte comme ce double sur CHAQUE detail (pagination reelle, latence,
// semantique serveur de `make_latest`). Il prouve UNE chose precise et suffisante : ce que
// l'etape CALCULE ET ECRIT sous la meme regle d'arite que le vrai `gh`. Le gate humain
// (CA-L11/CA-L12, § 8 de l'instruction) reste du — jamais remplace par ce fichier.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  entreesInertes,
  estSha40,
  etapeAction,
  extraireEtapeRun,
  FAKE_GH_SOURCE,
  resoudreExpressionsGithub,
} from '../scripts/lib/release-shell.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..');
const WORKFLOW_PATH = resolve(ROOT, '.github', 'workflows', 'release.yml');
const WORKFLOW = readFileSync(WORKFLOW_PATH, 'utf8');
const REPO_TEST = 'acme/test-depot';

const ANCRE_RANG = /^ {6}-\s*name:\s*Le tag publie est-il le plus haut semver \?\s*$/;
const ANCRE_VERIFIER = /^ {6}-\s*name:\s*Verifier ce qu'est devenu le latest\s*$/;

const SCRIPT_RANG_ACTUEL = resoudreExpressionsGithub(extraireEtapeRun(WORKFLOW, ANCRE_RANG), {
  repository: REPO_TEST,
});
const SCRIPT_VERIFIER_ACTUEL = resoudreExpressionsGithub(extraireEtapeRun(WORKFLOW, ANCRE_VERIFIER), {
  repository: REPO_TEST,
});

// Copie FIGEE, EN DUR, du script EXACT de l'etape `rang` TEL QUE MESURE aux runs `33959443438`
// (v0.40.0) et `34001818646` (v0.41.0) — AVANT correctif AR-1(a). JAMAIS re-extraite depuis le
// fichier reel (qui, une fois corrige, ne le porte plus). Recopie verbatim des lignes du texte
// AVANT ce lot (`git show a1e0072:.github/workflows/release.yml`, lignes 147-173). Temoin
// historique PERMANENT : meme si `release.yml` change encore de forme demain, ce texte-ci continue
// de prouver que CE defaut precis rougissait bien de cette facon (CA-L2, contrefactuel).
const SCRIPT_RANG_AVANT_CORRECTIF_a1e0072 = [
  'set -euo pipefail',
  'RELEASES=$(gh api "repos/' + REPO_TEST + '/releases" --paginate \\',
  "  --jq '.[] | select(.draft|not) | select(.prerelease|not) | .tag_name')",
  "PLUS_HAUT=$(printf '%s\\n' \"$RELEASES\" \\",
  "  | grep -E '^v[0-9]+\\.[0-9]+\\.[0-9]+$' | sort -V | tail -1 || true)",
  'echo "tag publie      : $TAG"',
  'echo "plus haut semver publie (hors le tag courant, pas encore cree) : ${PLUS_HAUT:-(aucun)}"',
  'if [ -z "$PLUS_HAUT" ]; then',
  '  echo "AUCUNE release non-brouillon non-preversion portant un tag de version pour l\'instant :"',
  '  echo "  $TAG sera donc la premiere -> make_latest=true"',
  '  echo "make_latest=true" >> "$GITHUB_OUTPUT"',
  'elif [ "$TAG" = "$PLUS_HAUT" ]; then',
  '  echo "DECISION : $TAG EST le plus haut -> make_latest=true"',
  '  echo "make_latest=true" >> "$GITHUB_OUTPUT"',
  'else',
  '  echo "DECISION : $TAG n\'est PAS le plus haut ($PLUS_HAUT) -> make_latest=false."',
  '  echo "           Sans cette ligne, le defaut de l\'API aurait VOLE le latest a $PLUS_HAUT."',
  '  echo "make_latest=false" >> "$GITHUB_OUTPUT"',
  'fi',
].join('\n');

function jqDisponible() {
  const r = spawnSync('which', ['jq']);
  return r.status === 0;
}
function bashDisponible() {
  const r = spawnSync('which', ['bash']);
  return r.status === 0;
}
const JQ_OK = jqDisponible();
const BASH_OK = bashDisponible();
const MOTIF_SKIP = !JQ_OK
  ? 'SKIP EXPLICITE (AR-5, mesure 0.8) : `jq` absent du PATH — cette jambe ne peut pas tourner.'
  : !BASH_OK
    ? 'SKIP EXPLICITE (AR-5, mesure 0.8) : `bash` absent du PATH — cette jambe ne peut pas tourner.'
    : false;

let binDir;
function assurerFauxGh() {
  if (binDir) return binDir;
  binDir = mkdtempSync(join(tmpdir(), 'release-latest-shell-bin-'));
  const cheminGh = join(binDir, 'gh');
  writeFileSync(cheminGh, FAKE_GH_SOURCE);
  chmodSync(cheminGh, 0o755);
  return binDir;
}

/**
 * Rejoue un script shell d'etape avec le faux `gh` en tete de PATH, un "monde" de releases
 * initial, et rend { status, stdout, stderr, appels, monde, sortieGithubOutput }.
 */
function rejouer(script, { monde, vars = {}, editNoop = false } = {}) {
  const bin = assurerFauxGh();
  const scratch = mkdtempSync(join(tmpdir(), 'release-latest-shell-run-'));
  const log = join(scratch, 'log.jsonl');
  const world = join(scratch, 'world.json');
  const sortie = join(scratch, 'github-output.txt');
  writeFileSync(log, '');
  writeFileSync(world, JSON.stringify(monde ?? { releases: [], latestTag: null }));
  writeFileSync(sortie, '');

  const resultat = spawnSync('bash', ['-c', script], {
    cwd: scratch,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      GH_FAKE_LOG: log,
      GH_FAKE_WORLD: world,
      GH_FAKE_EDIT_NOOP: editNoop ? '1' : '0',
      GITHUB_OUTPUT: sortie,
      ...vars,
    },
  });

  const appels = readFileSync(log, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l));
  const mondeApres = JSON.parse(readFileSync(world, 'utf8'));
  const sortieGithubOutput = readFileSync(sortie, 'utf8');
  rmSync(scratch, { recursive: true, force: true });

  return { ...resultat, appels, monde: mondeApres, sortieGithubOutput };
}

function releasesPubliees(tags) {
  return {
    releases: tags.map((tag_name, i) => ({
      id: i + 1,
      tag_name,
      draft: false,
      prerelease: false,
    })),
    latestTag: tags[tags.length - 1] ?? null,
  };
}

// ---------------------------------------------------------------------------------------------
// AR-5(a) / CA-L2 / CA-L3 — etape `rang` : le nominal est repare, le vol n'est pas reintroduit.
// ---------------------------------------------------------------------------------------------

test(
  'CA-L2 — NOMINAL, texte ACTUEL du workflow : tag neuf le plus haut -> make_latest=true',
  { skip: MOTIF_SKIP },
  () => {
    const monde = releasesPubliees(['v0.39.0', 'v0.40.0']);
    const r = rejouer(SCRIPT_RANG_ACTUEL, { monde, vars: { TAG: 'v0.41.0' } });
    assert.equal(r.status, 0, `stdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
    assert.match(r.sortieGithubOutput, /^make_latest=true$/m, r.sortieGithubOutput);
  },
);

test(
  'CA-L2 — CONTREFACTUEL PERMANENT : le texte D\'AVANT le correctif AR-1(a) (run 34001818646) rougit sur le MEME monde',
  { skip: MOTIF_SKIP },
  () => {
    const monde = releasesPubliees(['v0.39.0', 'v0.40.0']);
    const r = rejouer(SCRIPT_RANG_AVANT_CORRECTIF_a1e0072, { monde, vars: { TAG: 'v0.41.0' } });
    assert.equal(r.status, 0, `stdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
    // Le defaut mesure en CI, reproduit hors ligne, a perpetuite : le texte d'avant correctif
    // ecrit `false` la ou le tag EST pourtant le plus haut.
    assert.match(r.sortieGithubOutput, /^make_latest=false$/m, r.sortieGithubOutput);
    assert.match(r.stdout, /n'est PAS le plus haut \(v0\.40\.0\)/);
  },
);

test(
  'CA-L3 — la protection contre le VOL n\'est PAS perdue : rejeu d\'un tag ANCIEN -> make_latest=false',
  { skip: MOTIF_SKIP },
  () => {
    const monde = releasesPubliees(['v0.39.0', 'v0.40.0']);
    const r = rejouer(SCRIPT_RANG_ACTUEL, { monde, vars: { TAG: 'v0.39.0' } });
    assert.equal(r.status, 0, `stdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
    assert.match(r.sortieGithubOutput, /^make_latest=false$/m, r.sortieGithubOutput);
  },
);

test(
  'AR-6(c) — contrefactuel gratuit : une pre-release (tag hors semver strict) ne vole jamais le latest',
  { skip: MOTIF_SKIP },
  () => {
    const monde = releasesPubliees(['v0.39.0', 'v0.40.0', 'v0.41.0']);
    const r = rejouer(SCRIPT_RANG_ACTUEL, { monde, vars: { TAG: 'v0.41.1-rc.1' } });
    assert.equal(r.status, 0, `stdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
    assert.match(r.sortieGithubOutput, /^make_latest=false$/m, r.sortieGithubOutput);
  },
);

test(
  'premiere publication (aucune release existante) avec un tag semver valide -> make_latest=true',
  { skip: MOTIF_SKIP },
  () => {
    const monde = releasesPubliees([]);
    const r = rejouer(SCRIPT_RANG_ACTUEL, { monde, vars: { TAG: 'v0.1.0' } });
    assert.equal(r.status, 0, `stdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
    assert.match(r.sortieGithubOutput, /^make_latest=true$/m, r.sortieGithubOutput);
  },
);

// ---------------------------------------------------------------------------------------------
// AR-2(a) / CA-L4 — etape « Verifier » : le filet AGIT, PUIS verifie.
// ---------------------------------------------------------------------------------------------

test(
  'CA-L4 — le filet AGIT puis verifie : latest en retard -> gh release edit journalise, re-mesure concorde, exit 0',
  { skip: MOTIF_SKIP },
  () => {
    // `latest` (v0.39.0) est en retard sur le plus haut semver publie (v0.40.0) : c'est
    // exactement la situation mesuree aux runs 33959443438 et 34001818646, APRES la creation de
    // la release par `softprops` (le referent de cette etape INCLUT deja le tag courant).
    const monde = {
      releases: [
        { id: 1, tag_name: 'v0.39.0', draft: false, prerelease: false },
        { id: 2, tag_name: 'v0.40.0', draft: false, prerelease: false },
      ],
      latestTag: 'v0.39.0',
    };
    const r = rejouer(SCRIPT_VERIFIER_ACTUEL, { monde });
    assert.equal(r.status, 0, `stdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
    const editions = r.appels.filter((a) => a[0] === 'release' && a[1] === 'edit');
    assert.equal(editions.length, 1, JSON.stringify(r.appels));
    assert.equal(editions[0][2], 'v0.40.0');
    assert.equal(r.monde.latestTag, 'v0.40.0');
    assert.match(r.stdout, /latest maitrise : v0\.40\.0/);
  },
);

test(
  'CA-L4 — CONTREFACTUEL : `gh release edit` reussit MAIS ne change rien (derive d\'API simulee) -> la re-mesure rattrape et rougit, nomme',
  { skip: MOTIF_SKIP },
  () => {
    const monde = {
      releases: [
        { id: 1, tag_name: 'v0.39.0', draft: false, prerelease: false },
        { id: 2, tag_name: 'v0.40.0', draft: false, prerelease: false },
      ],
      latestTag: 'v0.39.0',
    };
    const r = rejouer(SCRIPT_VERIFIER_ACTUEL, { monde, editNoop: true });
    assert.equal(r.status, 1);
    const sortie = `${r.stdout}${r.stderr}`;
    assert.match(sortie, /latest effectif \(v0\.39\.0\) n'est pas le plus haut semver \(v0\.40\.0\)/, sortie);
    assert.match(sortie, /RATTRAPAGE MANUEL : gh release edit v0\.40\.0 --latest/, sortie);
    // la derive n'est pas maquillee : le monde simule montre bien que rien n'a change.
    assert.equal(r.monde.latestTag, 'v0.39.0');
  },
);

test(
  'nominal : latest deja maitrise -> aucun appel `gh release edit`, exit 0',
  { skip: MOTIF_SKIP },
  () => {
    const monde = {
      releases: [
        { id: 1, tag_name: 'v0.39.0', draft: false, prerelease: false },
        { id: 2, tag_name: 'v0.40.0', draft: false, prerelease: false },
      ],
      latestTag: 'v0.40.0',
    };
    const r = rejouer(SCRIPT_VERIFIER_ACTUEL, { monde });
    assert.equal(r.status, 0, `stdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
    const editions = r.appels.filter((a) => a[0] === 'release' && a[1] === 'edit');
    assert.equal(editions.length, 0, JSON.stringify(r.appels));
  },
);

test('aucune release publiee -> sortie en SUCCES, rien a verifier', { skip: MOTIF_SKIP }, () => {
  const r = rejouer(SCRIPT_VERIFIER_ACTUEL, { monde: releasesPubliees([]) });
  assert.equal(r.status, 0, `stdout:\n${r.stdout}\nstderr:\n${r.stderr}`);
});

// ---------------------------------------------------------------------------------------------
// CA-L5 — la lecon de la sœur (`gh api ... --jq --arg` a fait rougir le run 34026373514
// d'`iakaInstall`) est TENUE : le motif n'apparait pas dans le workflow, et s'il apparaissait, la
// jambe d'execution le verrait (contrefactuel de CLASSE, jamais observe ici en vrai — preventif).
// ---------------------------------------------------------------------------------------------

test('CA-L5 — aucune occurrence de `gh api ... --jq --arg` dans le workflow', () => {
  assert.doesNotMatch(WORKFLOW, /--jq\s+--arg/);
});

test(
  'CA-L5 — CONTREFACTUEL DE CLASSE : reintroduire `--jq --arg` sur une COPIE de l\'etape `rang` rougit sur l\'arite',
  { skip: MOTIF_SKIP },
  () => {
    const mute = SCRIPT_RANG_ACTUEL.replace(
      "--jq '.[] | select(.draft|not)",
      "--jq --arg x y '.[] | select(.draft|not)",
    );
    assert.notEqual(mute, SCRIPT_RANG_ACTUEL);
    const monde = releasesPubliees(['v0.39.0', 'v0.40.0']);
    const r = rejouer(mute, { monde, vars: { TAG: 'v0.41.0' } });
    assert.equal(r.status, 1);
    assert.match(`${r.stdout}${r.stderr}`, /accepts 1 arg\(s\), received/);
  },
);

// ---------------------------------------------------------------------------------------------
// AR-4(a) / CA-L6 / CA-L7 — epinglage des trois `uses:` (patron L41, IakaCockpit/iakaFrameGUI).
// ---------------------------------------------------------------------------------------------

const PIN = JSON.parse(readFileSync(resolve(ROOT, 'cli', 'fixtures', 'actions-pin.json'), 'utf8'));
const ACTIONS_EPINGLEES = ['actions/checkout', 'actions/setup-node', 'softprops/action-gh-release'];

for (const action of ACTIONS_EPINGLEES) {
  const pin = PIN.actions[action];

  test(`CA-L6 — ${action} est epingle a un SHA de 40 caracteres, tag lisible en commentaire`, () => {
    const etape = etapeAction(WORKFLOW, action);
    assert.notEqual(etape, null, `aucune etape \`uses: ${action}@...\` dans le workflow`);
    assert.equal(
      estSha40(etape.ref),
      true,
      `\`${action}@${etape.ref}\` : un tag ou une branche est DEPLACABLE. Epingler le SHA complet (AR-4a).`,
    );
    assert.equal(etape.commentaire, pin.version);
  });

  test(`CA-L6 — cliquet : le SHA epingle de ${action} est celui contre lequel on a LU`, () => {
    const etape = etapeAction(WORKFLOW, action);
    assert.equal(
      etape.ref,
      pin.sha,
      `Le SHA epingle de ${action} n'est plus celui contre lequel on a LU. RE-LIRE action.yml AU NOUVEAU SHA avant de lever cette garde, puis mettre a jour cli/fixtures/actions-pin.json.`,
    );
  });

  test(`CA-L6 — CONTREFACTUEL : un SHA different dans la FIXTURE fait tomber le cliquet de ${action}`, () => {
    const etape = etapeAction(WORKFLOW, action);
    const mute = '0'.repeat(40);
    assert.notEqual(mute, etape.ref);
    assert.equal(estSha40(mute), true); // bien forme, et pourtant refuse : c'est le PIN qui parle
  });

  test(`CA-L6/D-4 — aucune entree posee par ce workflow n'est INCONNUE de ${action}@${pin.version}`, () => {
    const etape = etapeAction(WORKFLOW, action);
    const inertes = entreesInertes(etape.entrees, pin.entreesDeclarees);
    assert.deepEqual(
      inertes,
      [],
      `entrees IGNOREES EN SILENCE par ${action}@${pin.version} : ${inertes.join(', ')}.`,
    );
    assert.deepEqual(etape.entrees, pin.entreesPoseesDansCeWorkflow);
  });

  test(`CA-L6 — CONTREFACTUEL : retirer une entree posee de la fixture la fait ressortir comme inerte (${action})`, () => {
    const etape = etapeAction(WORKFLOW, action);
    if (etape.entrees.length === 0) return; // checkout/setup-node en posent au moins une ici
    const mute = pin.entreesDeclarees.filter((e) => e !== etape.entrees[0]);
    assert.deepEqual(entreesInertes(etape.entrees, mute), [etape.entrees[0]]);
  });
}

test('CA-L7 — le contrat de `make_latest` de softprops est LU au SHA retenu, pas suppose', () => {
  const contrat = PIN.actions['softprops/action-gh-release'].contratMakeLatest;
  assert.match(contrat.description, /true.*false.*legacy/);
  assert.equal(contrat.required, false);
  assert.equal(contrat.defautYaml, null);
});

test('CA-L7 — le defaut de `prerelease` (non fourni par ce workflow) est LU, pas suppose', () => {
  const contrat = PIN.actions['softprops/action-gh-release'].contratPrerelease;
  assert.match(contrat.description, /[Dd]efaults to false/);
});

test('CA-L9 (partiel) — la fixture porte SHA + empreinte + date de lecture pour chacune des trois actions', () => {
  for (const action of ACTIONS_EPINGLEES) {
    const pin = PIN.actions[action];
    assert.equal(estSha40(pin.sha), true, action);
    assert.match(pin.actionYmlSha256, /^[0-9a-f]{64}$/, action);
    assert.match(pin.luLe, /^\d{4}-\d{2}-\d{2}$/, action);
  }
});
