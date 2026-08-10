// Gardes de ROUTAGE PROD (G-ROUTE-1/2/3) — specs/instructions/correctif-routage-prod-vers-charon.md
//
// POURQUOI CE FICHIER EXISTE : l'instrument de mesure employe jusqu'ici
// (`grep -rniI "helm" . | grep -Ei "bascul|alias|feu vert"`) est FAUX DANS LES DEUX SENS (F1/F2/F3) :
//   - faux POSITIFS  : la prose post-scission nomme legitimement Helm ET « feu vert » dans la meme
//                      phrase, en attribuant correctement la bascule a Charon ;
//   - faux NEGATIFS de LIGNE   : 6 des 9 sites du canon ne portent aucun des trois mots-cles ;
//   - faux NEGATIFS de FICHIER : deux fichiers INTEGRALEMENT pre-scission sont totalement
//                      invisibles, aucune de leurs lignes ne portant a la fois « Helm » et un
//                      mot-cle. C'est le defaut le plus lourd, et il n'apparait dans AUCUN releve.
// Ces gardes ne comptent donc PAS des lignes de grep : elles BALAIENT (elles ne dependent pas de
// l'inventaire du § 7 de l'instruction — c'est leur raison d'etre, cf. R1).
//
// LIGNE LOGIQUE : les modeles Open WebUI sont des JSON dont tout le prompt systeme tient sur UNE
// SEULE ligne physique (`\n` echappes). Un comptage en lignes physiques y rend 1 la ou il faut
// relire le fichier entier — c'est exactement la sous-ponderation de F3. On desechappe donc `\n`
// avant de decouper : md et json se lisent alors a la meme granularite.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)); // cli/test
const REPO = path.resolve(HERE, '..', '..');

// Miroir gele (D9) + traces datees (§ 8) : hors perimetre, jamais reecrits.
const EXCLUS = ['.git', 'node_modules', 'frames/releases', 'specs/instructions'];

function estExclu(rel) {
  const p = rel.split(path.sep).join('/');
  return EXCLUS.some((x) => p === x || p.startsWith(`${x}/`));
}

function lignesLogiques(raw) {
  return raw.replace(/\\n/g, '\n').split('\n');
}

function lire(abs) {
  return lignesLogiques(fs.readFileSync(abs, 'utf8'));
}

function scanner(racine, predicat, acc = [], base = racine) {
  let entrees;
  try { entrees = fs.readdirSync(racine, { withFileTypes: true }); } catch { return acc; }
  for (const e of entrees) {
    const abs = path.join(racine, e.name);
    const rel = path.relative(base, abs);
    if (estExclu(path.relative(REPO, abs))) continue;
    if (e.isDirectory()) scanner(abs, predicat, acc, base);
    else if (predicat(e.name, rel)) acc.push(abs);
  }
  return acc;
}

// --- G-ROUTE-1 — invariant de RECIPROCITE -------------------------------------------------------
// « Tout artefact par-persona de `helm` DOIT mentionner `Charon`, et reciproquement. »
// La scission rend le renvoi croise OBLIGATOIRE : chacun se definit par ce que l'autre fait. Un
// fichier qui ne nomme JAMAIS l'autre est, par construction, ANTERIEUR a la scission.
// Immunise contre F3 : la garde ne regarde pas les lignes, elle regarde LE FICHIER.
const RECIPROQUES = [
  { id: 'helm', doitNommer: 'Charon' },
  { id: 'charon', doitNommer: 'Helm' },
];

test('G-ROUTE-1 : reciprocite Helm <-> Charon sur tout artefact par-persona', () => {
  const manquants = [];
  let vus = 0;
  for (const { id, doitNommer } of RECIPROQUES) {
    const fichiers = scanner(REPO, (nom) => nom === `${id}.md` || nom === `${id}.json`);
    assert.ok(fichiers.length > 0, `aucun artefact par-persona trouve pour « ${id} »`);
    for (const abs of fichiers) {
      vus += 1;
      const raw = fs.readFileSync(abs, 'utf8');
      if (!raw.includes(doitNommer)) {
        manquants.push(`${path.relative(REPO, abs)} -> 0 occurrence de « ${doitNommer} »`);
      }
    }
  }
  assert.deepEqual(
    manquants, [],
    `G-ROUTE-1 ROUGE : ${manquants.length} artefact(s) sur ${vus} ne nomment jamais leur jumeau `
    + `(= anterieurs a la scission) :\n  - ${manquants.join('\n  - ')}`,
  );
});

// --- G-ROUTE-2 — invariant d'ATTRIBUTION --------------------------------------------------------
// DEUX niveaux, parce que les deux populations n'ont pas la meme raison de nommer Helm.
//
// Niveau A — fichiers de ROUTAGE (aragorn/gimli/legolas). Ils n'ont AUCUNE raison legitime de
//   nommer Helm autrement que comme destinataire : chez eux, « Helm » est toujours une adresse.
//   Regle BINAIRE et BALAYANTE : toute ligne qui nomme Helm doit aussi nommer Charon. C'est le seul
//   critere qui attrape F2 (« le deploiement (→ Helm) », « prete pour Helm ») SANS enumerer des
//   tournures — enumerer, c'est reproduire le defaut qu'on corrige.
//
// Niveau B — artefacts par-persona de HELM lui-meme. Lui a toutes les raisons de dire « Helm » ;
//   ce qu'il ne peut plus faire, c'est REVENDIQUER LA TRAVERSEE. Regle : toute ligne portant une
//   notion de traversee doit nommer Charon. C'est F14/F15 encode : un fichier qui parle de bascule,
//   de rollback, d'alias ou de SSO sans jamais nommer Charon s'attribue le poste de l'autre.
//   NB : le mot « prod » seul ne declenche RIEN — la pastille de Helm EST 🟣 (prod), et une regle
//   qui mordrait dessus serait ininterpretable (D1 : critere SEMANTIQUE, pas lexical).
const TRAVERSEE = /bascul|rollback|alias|SSO|d[ée]ploy|d[ée]ploiement|feu vert/i;

const ROUTAGE_A = [
  'library/personas/aragorn.md',
  'library/personas/gimli.md',
  'library/personas/legolas.md',
  'kits/iakaframe-anythingllm/prompts/aragorn.md',
  'kits/iakaframe-anythingllm/prompts/gimli.md',
  'kits/iakaframe-anythingllm/prompts/legolas.md',
  'kits/iakaframe-openwebui/models/aragorn.json',
  'kits/iakaframe-openwebui/models/gimli.json',
  'kits/iakaframe-openwebui/models/legolas.json',
];

const ROUTAGE_B = [
  'kits/iakaframe-anythingllm/prompts/helm.md',
  'kits/iakaframe-openwebui/models/helm.json',
];

function fautesNiveauA(abs, etiquette) {
  const fautes = [];
  lire(abs).forEach((ligne, i) => {
    if (/\bHelm\b/.test(ligne) && !/\bCharon\b/.test(ligne)) {
      fautes.push(`${etiquette}:${i + 1}  ${ligne.trim().slice(0, 120)}`);
    }
  });
  return fautes;
}

function fautesNiveauB(abs, etiquette) {
  const fautes = [];
  lire(abs).forEach((ligne, i) => {
    if (TRAVERSEE.test(ligne) && !/\bCharon\b/.test(ligne)) {
      fautes.push(`${etiquette}:${i + 1}  ${ligne.trim().slice(0, 120)}`);
    }
  });
  return fautes;
}

test('G-ROUTE-2 : attribution — les fichiers de routage adressent la prod a Charon', () => {
  const fautes = [];
  for (const rel of ROUTAGE_A) {
    const abs = path.join(REPO, rel);
    assert.ok(fs.existsSync(abs), `fichier de routage introuvable : ${rel}`);
    fautes.push(...fautesNiveauA(abs, rel));
  }
  for (const rel of ROUTAGE_B) {
    const abs = path.join(REPO, rel);
    assert.ok(fs.existsSync(abs), `artefact Helm introuvable : ${rel}`);
    fautes.push(...fautesNiveauB(abs, rel));
  }
  assert.deepEqual(
    fautes, [],
    `G-ROUTE-2 ROUGE : ${fautes.length} site(s) d'attribution sur ${ROUTAGE_A.length + ROUTAGE_B.length} `
    + `fichiers de routage :\n  - ${fautes.join('\n  - ')}`,
  );
});

// --- G-ROUTE-3 — invariant sur les CONTRATS DEPLOYES ---------------------------------------------
// EXIGENCE EXPLICITE DU DECIDEUR. C'est LA surface ou le defaut se voit, et AUCUN critere du lot
// precedent ne la regardait — tous s'arretaient au canon et aux goldens. Une source juste dont le
// contrat deploye est faux ne protege personne : c'est le contrat que le runner LIT.
//
// Artefact HORS DEPOT (~/.claude/) : la garde SKIPPE proprement ET LE DIT si le repertoire est
// absent (poste CI). Elle n'echoue JAMAIS par absence (R6/CA-13).
const AGENTS_DEPLOYES = path.join(os.homedir(), '.claude', 'agents');
const agentsPresents = fs.existsSync(AGENTS_DEPLOYES);
const motifSkip = agentsPresents
  ? false
  : `SKIP dit : ${AGENTS_DEPLOYES} absent (poste CI / runner non Claude Code) — `
    + 'aucun contrat deploye a verifier, ce n\'est PAS un echec.';

test('G-ROUTE-3 : contrats deployes ~/.claude/agents — routage prod et reciprocite', { skip: motifSkip }, () => {
  const fautes = [];

  // Reciprocite (G-ROUTE-1) sur les deux contrats du squad prod.
  for (const { id, doitNommer } of RECIPROQUES) {
    const abs = path.join(AGENTS_DEPLOYES, `${id}.md`);
    if (!fs.existsSync(abs)) {
      fautes.push(`~/.claude/agents/${id}.md  ABSENT — le squad prod n'est pas deploye`);
      continue;
    }
    if (!fs.readFileSync(abs, 'utf8').includes(doitNommer)) {
      fautes.push(`~/.claude/agents/${id}.md  -> 0 occurrence de « ${doitNommer} »`);
    }
  }

  // Attribution (G-ROUTE-2) sur les trois routeurs deployes.
  for (const id of ['aragorn', 'gimli', 'legolas']) {
    const abs = path.join(AGENTS_DEPLOYES, `${id}.md`);
    if (!fs.existsSync(abs)) {
      fautes.push(`~/.claude/agents/${id}.md  ABSENT`);
      continue;
    }
    fautes.push(...fautesNiveauA(abs, `~/.claude/agents/${id}.md`));
  }

  assert.deepEqual(
    fautes, [],
    `G-ROUTE-3 ROUGE : ${fautes.length} site(s) dans les contrats DEPLOYES (la surface que le `
    + `runner lit) :\n  - ${fautes.join('\n  - ')}`,
  );
});
