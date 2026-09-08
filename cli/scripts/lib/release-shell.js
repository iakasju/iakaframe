// release-shell.js — AR-5(a) : ce module porte le CŒUR PUR de la jambe d'exécution du gate CI
// de `.github/workflows/release.yml`, plus le patron d'épinglage (AR-4, patron L41 des jumeaux
// IakaCockpit/iakaFrameGUI, adapté ici en Node pur au lieu de vitest).
//
// TROIS CHOSES DISTINCTES, VOLONTAIREMENT DANS LE MÊME FICHIER PUR (aucun réseau, aucun `fs`
// d'exécution — seul le TEST écrit sur disque) :
//   1. `extraireEtapeRun` — extrait PAR MARQUEUR (jamais par numéro de ligne) le corps `run: |`
//      d'une étape nommée du job unique `package`, directement depuis le TEXTE du workflow.
//   2. `FAKE_GH_SOURCE` — le texte source d'un faux `gh` (Node), écrit sur disque par le TEST
//      (jamais exécuté par ce module), qui reproduit UNE règle du vrai `gh api` (un seul
//      argument positionnel — la classe de défaut CA-L5/run 34026373514 de la sœur `iakaInstall`)
//      et simule un petit monde de releases en JSON local. Journalise chaque invocation.
//   3. `etapeAction` / `estSha40` / `entreesInertes` — patron L41 (épinglage), copié à l'identique
//      depuis `IakaCockpit/scripts/lib/pin-tauri-action.mjs`, générique sur le NOM de l'action :
//      sert ici pour les trois `uses:` (`actions/checkout`, `actions/setup-node`,
//      `softprops/action-gh-release`).
//
// CE QUE CE MODULE NE PROUVE PAS (limite déclarée, pas cachée — § 7.3 de l'instruction) : que le
// VRAI `gh` de GitHub se comporte comme ce double sur CHAQUE détail (pagination réelle, latence,
// sémantique serveur de `make_latest`). Il prouve UNE chose précise et suffisante : ce que
// l'étape CALCULE ET ÉCRIT dans `$GITHUB_OUTPUT`, sous la même règle d'arité que le vrai `gh`.

// `uses:` peut ouvrir l'etape (forme `- uses: X@Y`, cas `checkout`/`setup-node` ici) OU etre une
// cle SUIVANTE d'une etape ouverte par `- name: ...` (cas `softprops/action-gh-release`, dont le
// `uses:` vient apres un `- name: Attacher le tarball a la release`). Les DEUX formes sont
// couvertes par UN seul motif, avec un groupe de dash optionnel : en YAML block, la cle d'une
// etape (avec ou sans dash sur SA propre ligne) est toujours indentee a `indentDash + 2`.
const RE_USES = /^(\s*)(-\s+)?uses:\s*([^@\s]+)@(\S+)\s*(?:#\s*(.*?))?\s*$/;

/**
 * Extrait le corps du `run: |` d'UNE étape du job unique `package`, repérée par une ligne
 * d'entête (`- id: x` ou `- name: x`) qui matche `ancreRegex`. Borne haute : la prochaine étape
 * (une ligne à 6 espaces suivie de `- `), ou la fin du fichier. PAR MARQUEUR, jamais par numéro
 * de ligne — un décalage du fichier (épinglage, cartouche daté) ne doit jamais faire mentir cet
 * extracteur.
 * @param {string} workflowText
 * @param {RegExp} ancreRegex
 * @returns {string}
 */
export function extraireEtapeRun(workflowText, ancreRegex) {
  const lignes = String(workflowText).split('\n');
  const iAncre = lignes.findIndex((l) => ancreRegex.test(l));
  if (iAncre === -1) {
    throw new Error(`release-shell : ancre introuvable (${ancreRegex}) — l'etape a-t-elle ete renommee ?`);
  }
  let iFinEtape = lignes.length;
  for (let i = iAncre + 1; i < lignes.length; i++) {
    if (/^ {6}-\s/.test(lignes[i])) {
      iFinEtape = i;
      break;
    }
  }
  const etape = lignes.slice(iAncre, iFinEtape);
  const iRun = etape.findIndex((l) => /^ {8}run:\s*\|\s*$/.test(l));
  if (iRun === -1) {
    throw new Error(`release-shell : aucun "run: |" trouve pour l'etape ${ancreRegex}.`);
  }
  const corps = [];
  for (let i = iRun + 1; i < etape.length; i++) {
    const l = etape[i];
    if (l.trim() === '') {
      corps.push('');
      continue;
    }
    if (/^ {10}/.test(l)) {
      corps.push(l.slice(10));
      continue;
    }
    break;
  }
  return corps.join('\n');
}

/**
 * Résout les expressions `${{ github.repository }}` d'un script EXTRAIT tel quel du workflow, EN
 * TEXTE, avant de le confier à `bash`. Ce n'est PAS un contournement : c'est exactement ce que
 * GitHub Actions fait lui-même — il substitue les expressions `${{ }}` dans le texte du `run:`
 * AVANT de l'exécuter dans le shell. Le workflow, lui, n'est PAS changé pour cette jambe : il
 * continue d'écrire `${{ github.repository }}` en clair (aucune raison de faire circuler un `DEPOT`
 * en `env:` ici, `TAG` l'est déjà). Seule l'expression `github.repository` est en jeu dans les deux
 * étapes couvertes par ce fichier ; toute autre expression `${{ }}` laissée non résolue est un
 * signal d'échec voulu (elle ferait échouer `bash` comme elle échouerait dans un run réel mal
 * préparé), pas un silence.
 * @param {string} script
 * @param {{ repository: string }} ctx
 * @returns {string}
 */
export function resoudreExpressionsGithub(script, { repository }) {
  return String(script).split('${{ github.repository }}').join(repository);
}

// --- le faux `gh` : source écrite SUR DISQUE par le test (jamais exécutée par ce module lui-même).
// Reproduit la règle d'arité du vrai `gh api` (un seul argument positionnel), un petit monde de
// releases (fichier JSON local, jamais de réseau), et journalise chaque invocation. Sous-commandes
// simulées : `gh api` (GET releases / GET releases/latest) et `gh release edit <tag> --latest`
// (avec un mode `EDIT_NOOP` pour simuler une édition qui réussit SANS RIEN CHANGER — le
// contrefactuel de CA-L4).
export const FAKE_GH_SOURCE = [
  '#!/usr/bin/env node',
  'import { readFileSync, writeFileSync, appendFileSync } from "node:fs";',
  'import { execFileSync } from "node:child_process";',
  '',
  'const args = process.argv.slice(2);',
  'const LOG = process.env.GH_FAKE_LOG;',
  'const WORLD_PATH = process.env.GH_FAKE_WORLD;',
  'if (!LOG || !WORLD_PATH) {',
  '  console.error("fake gh : GH_FAKE_LOG et GH_FAKE_WORLD sont requis.");',
  '  process.exit(2);',
  '}',
  'appendFileSync(LOG, JSON.stringify(args) + "\\n");',
  '',
  'function lireMonde() {',
  '  return JSON.parse(readFileSync(WORLD_PATH, "utf8"));',
  '}',
  'function ecrireMonde(m) {',
  '  writeFileSync(WORLD_PATH, JSON.stringify(m, null, 2));',
  '}',
  'function appliquerJq(valeur, expr) {',
  '  if (!expr) return JSON.stringify(valeur);',
  '  return execFileSync("jq", ["-r", expr], { input: JSON.stringify(valeur), encoding: "utf8" }).replace(/\\n$/, "");',
  '}',
  '',
  'const [sous] = args;',
  '',
  'if (sous === "api") {',
  '  const reste = args.slice(1);',
  '  let method = "GET";',
  '  let jqExpr = "";',
  '  let paginate = false;',
  '  const positionnels = [];',
  '  for (let i = 0; i < reste.length; i++) {',
  '    const tok = reste[i];',
  '    if (tok === "-X") { method = reste[++i]; continue; }',
  '    if (tok === "--paginate") { paginate = true; continue; }',
  '    if (tok === "--jq") { jqExpr = reste[++i]; continue; }',
  '    positionnels.push(tok);',
  '  }',
  '  if (positionnels.length !== 1) {',
  '    console.error("gh: accepts 1 arg(s), received " + positionnels.length);',
  '    process.exit(1);',
  '  }',
  '  void paginate; // le faux monde tient toujours en une seule page — simule juste l\'option.',
  '  const endpoint = positionnels[0];',
  '  const monde = lireMonde();',
  '',
  '  if (method === "GET" && /\\/releases$/.test(endpoint)) {',
  '    process.stdout.write(appliquerJq(monde.releases, jqExpr) + "\\n");',
  '    process.exit(0);',
  '  }',
  '  if (method === "GET" && /\\/releases\\/latest$/.test(endpoint)) {',
  '    const r = monde.releases.find((x) => x.tag_name === monde.latestTag);',
  '    if (!r) {',
  '      console.error("gh: 404 (aucun latest)");',
  '      process.exit(1);',
  '    }',
  '    process.stdout.write(appliquerJq(r, jqExpr) + "\\n");',
  '    process.exit(0);',
  '  }',
  '  console.error("fake gh : endpoint/methode non simule : " + method + " " + endpoint);',
  '  process.exit(2);',
  '}',
  '',
  'if (sous === "release") {',
  '  const action = args[1];',
  '  if (action === "edit") {',
  '    const tag = args[2];',
  '    const noop = process.env.GH_FAKE_EDIT_NOOP === "1";',
  '    const monde = lireMonde();',
  '    if (!noop) {',
  '      monde.latestTag = tag;',
  '      ecrireMonde(monde);',
  '    }',
  '    process.stdout.write("https://example.invalid/releases/" + tag + "\\n");',
  '    process.exit(0);',
  '  }',
  '}',
  '',
  'console.error("fake gh : sous-commande non simulee : " + sous);',
  'process.exit(2);',
  '',
].join('\n');

// --- AR-4 : patron L41 (épinglage), copié à l'identique depuis
// `IakaCockpit/scripts/lib/pin-tauri-action.mjs`, générique sur le nom de l'action.

/** Une référence immuable : 40 caractères hexadécimaux, et rien d'autre. */
export const estSha40 = (ref) => typeof ref === 'string' && /^[0-9a-f]{40}$/.test(ref);

/**
 * Extrait l'étape qui utilise `action` dans un workflow.
 * @returns {null | { ref: string, commentaire: string|null, entrees: string[], ligne: number }}
 */
export function etapeAction(workflowText, action) {
  const lignes = String(workflowText).split('\n');

  for (let i = 0; i < lignes.length; i++) {
    const m = RE_USES.exec(lignes[i]);
    if (!m || m[3] !== action) continue;

    // `m[2]` = le `- ` optionnel. Present -> son indentation EST celle du dash de l'etape.
    // Absent -> `uses:` est une cle sœur au meme niveau que les autres (`name:`, `with:`…), donc
    // a `indentDash + 2` ; l'indentation du dash s'en deduit par symetrie.
    const indentTiret = m[2] ? m[1].length : m[1].length - 2;
    const res = { ref: m[4], commentaire: m[5] ?? null, entrees: [], ligne: i + 1 };

    let dansWith = false;
    let indentWith = null;

    for (let j = i + 1; j < lignes.length; j++) {
      const ligne = lignes[j];
      if (ligne.trim() === '' || /^\s*#/.test(ligne)) continue;
      const indent = ligne.length - ligne.trimStart().length;
      if (indent <= indentTiret) break;

      if (!dansWith) {
        if (/^\s*with:\s*$/.test(ligne)) {
          dansWith = true;
          indentWith = indent;
        }
        continue;
      }

      if (indent <= indentWith) break;
      if (indent !== indentWith + 2) continue;

      const cle = /^\s*([A-Za-z_][A-Za-z0-9_-]*)\s*:/.exec(ligne);
      if (cle) res.entrees.push(cle[1]);
    }

    return res;
  }

  return null;
}

/**
 * Les entrées posées qui ne sont PAS déclarées par la version épinglée. Une entrée qui figure ici
 * est INERTE : elle est ignorée sans un mot au moment de l'exécution.
 */
export function entreesInertes(entreesPosees, entreesDeclarees) {
  const declarees = new Set(entreesDeclarees);
  return entreesPosees.filter((e) => !declarees.has(e));
}
