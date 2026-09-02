#!/usr/bin/env node
// vitrine-en-ligne.js — FACE EN LIGNE du cliquet de vitrine pour la CLI (L42, etape 4).
// HORS gate, ANONYME.
//
// POURQUOI ELLE EXISTE — elle est la SEULE face non circulaire. La face locale (G5, dans
// `cli/test/guard-version-source-unique.test.js`) rejoue le generateur et le compare au README :
// deux derives de la MEME source. Si la chaine de publication changeait le nom de son artefact, les
// deux derives bougeraient ensemble et G5 resterait VERTE sur un README qui ment. Seule cette
// face-ci confronte ce qu'on annonce a ce que la release PORTE reellement.
//
// ANONYME, DELIBEREMENT : aucun jeton n'est envoye, meme si `GITHUB_TOKEN` traine dans
// l'environnement. Le point de vue a mesurer est celui d'un inconnu sans compte.
//
// LA ROUGEUR ATTENDUE, ET POURQUOI ELLE EST VOULUE (AR-4). L'autorite du depot est `0.39.0` et la
// derniere release publiee est `v0.20.4` : dix-neuf mineures sont montees sans qu'une seule soit
// publiee. Ce script rougit donc sur E-2, et c'est le but — c'est une DETTE DE PUBLICATION rendue
// visible. Elle est HORS gate : elle informe, elle ne bloque aucun lot. Elle s'eteindra quand le
// decideur publiera (l'acte de publication ne revient pas a l'execution).
//
// LES EGALITES MESUREES :
//   E-1 : `latest` = le plus haut tag semver publie
//   E-2 : la version annoncee par le README = `latest`   <- la dette de publication, rouge VOULU
//   E-3 : la voie annoncee existe reellement sur la release annoncee
//   E-4 : aucun asset installable de la release n'est absent du README
//   E-5 : chaque VOIE DECLAREE ABSENTE est reellement absente  <- le cliquet auto-destructeur
//
// CODES DE SORTIE — 0 : mesure faite, tout concorde · 1 : mesure faite, ecart(s) · 2 : usage
// · 3 : NON MESURE (reseau indisponible ou quota anonyme epuise). Le 3 est DISTINCT du 0 a dessein :
// un controle qui rend « succes » alors qu'il n'a rien mesure est le pire des faux verts.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nomArtefact, versionAnnoncee, VOIES } from './lib/vitrine.js';

const NOM = 'vitrine:en-ligne';
const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RACINE = path.resolve(CLI, '..');
const DEPOT = 'iakasju/iakaframe';

const TAG_VERSION = /^v(\d+)\.(\d+)\.(\d+)$/;
const rang = (t) => TAG_VERSION.exec(t).slice(1, 4).map(Number);
const compare = (a, b) => {
  const [x, y] = [rang(a), rang(b)];
  for (let i = 0; i < 3; i += 1) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
};

function nonMesure(raison) {
  console.log(`${NOM} — SKIP : NON MESURE (${raison}).`);
  console.log(
    "  Aucune verification en ligne n'a ete effectuee : ni la concordance README <-> release, ni " +
      "l'existence de l'artefact annonce. Ce n'est PAS un succes.",
  );
  process.exit(3);
}

async function api(chemin) {
  let r;
  try {
    r = await fetch(`https://api.github.com${chemin}`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'vitrine-en-ligne' },
    });
  } catch (e) {
    nonMesure(`reseau indisponible — ${e?.message ?? e}`);
  }
  if (r.status === 403 || r.status === 429) {
    nonMesure(`quota de l'API anonyme epuise (HTTP ${r.status}) — reessayer plus tard`);
  }
  if (r.status === 404) return { absent: true };
  if (!r.ok) nonMesure(`reponse inattendue de l'API (HTTP ${r.status}) sur ${chemin}`);
  return { corps: await r.json() };
}

const readme = fs.readFileSync(path.join(RACINE, 'README.md'), 'utf8');
const autorite = JSON.parse(fs.readFileSync(path.join(CLI, 'package.json'), 'utf8')).version;
const annoncee = versionAnnoncee(readme);
const LOCALE = JSON.parse(fs.readFileSync(path.join(CLI, 'fixtures', 'vitrine-locale.json'), 'utf8'));
const ABSENTS = LOCALE.absents ?? [];
const declareeAbsente = (cle) => ABSENTS.some((a) => a.cle === cle);

const ecarts = [];
const constats = [];

const rLatest = await api(`/repos/${DEPOT}/releases/latest`);
const latest = rLatest.corps?.tag_name ?? null;
const rTags = await api(`/repos/${DEPOT}/tags?per_page=100`);
const tags = (rTags.corps ?? []).map((t) => t.name).filter((t) => TAG_VERSION.test(t));
const plusHaut = tags.length > 0 ? tags.slice().sort(compare).at(-1) : null;

constats.push(`depot          : ${DEPOT}`);
constats.push(`latest (anon)  : ${latest ?? '(aucune)'}`);
constats.push(`plus haut tag  : ${plusHaut ?? '(aucun)'}`);
constats.push(`README annonce : v${annoncee ?? '(illisible)'}`);
constats.push(`autorite (pkg) : v${autorite}`);

// E-1 — le `latest` designe le plus haut tag publie.
//
// ⚠️ MESSAGE RECTIFIE LE 2026-08-30 (L43, entree 16 du registre des enonces). Il disait :
// « Republier un tag ancien VOLE le latest (drapeau make_latest, defaut true). Rattrapage :
// gh release edit <plusHaut> --latest ». DEUX inexactitudes, dans le seul endroit du corpus qui
// s'imprime a l'operateur au moment ou il decide quoi faire :
//   (a) republier NE VOLE RIEN au SHA epingle de `tauri-action` — c'est la CREATION qui prend le
//       drapeau (R-1). Ici l'acteur est `softprops`, qui DECLARE `make_latest` : ce qu'il fait
//       d'une release EXISTANTE n'a jamais ete mesure, ce workflow n'ayant jamais tourne ;
//   (b) le rattrapage etait annonce comme un fait : qu'une ecriture `true` rende le `latest` n'a
//       NI RUN NI LOG. Sur le banc, seule l'ecriture `false` a ete mesuree, et parmi neuf regles
//       de repli enumerees huit sont refutees, le NO-OP survit seul — ce qui ne se transpose pas
//       d'office a `true`, ni dans un sens ni dans l'autre.
//
// ⚠️ RECTIFIE A NOUVEAU LE 2026-09-01 (L44). Le point (b) ci-dessus est DATE, PAS EFFACE : il dit
// l'etat de la connaissance AU 2026-08-30. DEPUIS, le geste a ete JOUE — M1, mesure du decideur
// sur le banc prive : `gh release edit v0.9.0 --latest` a fait passer `releases/latest` de
// `v0.10.0` a `v0.9.0`. L'ECRITURE `true` AGIT, et elle PRIME sur tout calcul, puisqu'elle a pose
// le pointeur sur le plus BAS semver. Le message imprime ci-dessous cessait d'etre vrai le jour
// de cette mesure : il annoncait SANS TRACE un geste desormais joue et observe, et c'est le SEUL
// texte du corpus qui s'imprime a l'operateur AU MOMENT OU IL DECIDE QUOI FAIRE.
// CE QUI RESTE VRAI, ET QUI EST DIT DANS LE MESSAGE : M1 a ete joue SUR LE BANC, jamais sur ce
// depot-ci. « Mesure ailleurs » n'est pas « mesure ici », et le message ne le laisse pas croire.
//
// ⚠️ RECTIFIE A NOUVEAU LE 2026-09-02 (lot fix/R2-et-levee-absence-iakaframe). La clause
// « ce workflow n'ayant jamais tourne » du point (a) ci-dessus (2026-08-30) est DATEE, PAS
// EFFACEE : elle disait vrai le jour ou elle a ete ecrite. DEPUIS, ce workflow a tourne pour
// la premiere fois SUR CE DEPOT-CI (run `33635520511`, `completed`/`success`, 2026-09-02) —
// donc, a la difference de M1 ci-dessus, CETTE mesure-ci EST sur ce depot. CE QUI RESTE VRAI,
// PRECISEMENT : la premiere clause du point (a), « ce qu'il [softprops] fait d'une release
// EXISTANTE n'a jamais ete mesure », reste EXACTE — ce run a CREE la release v0.39.0 (aucune
// release ne portait ce tag avant), il n'en a pas EDITE une deja existante. Seule la PREMISE
// (« ce workflow n'ayant jamais tourne ») est perimee ; la CONCLUSION qu'elle appuyait tient
// toujours, pour une autre raison : le cas mesure ici est une CREATION, pas une EDITION.
if (latest && plusHaut && latest !== plusHaut) {
  ecarts.push(
    `E-1 : « latest » designe ${latest} alors que ${plusHaut} existe. C'est la CREATION d'une ` +
      'release qui prend le drapeau (make_latest omis, defaut true) ; republier un tag dont la ' +
      "release EXISTE n'y touche pas au SHA epingle (R-1, L43). Rattrapage a TENTER : " +
      `gh release edit ${plusHaut} --latest — MESURE le 2026-09-01 (M1, banc prive) : cette ` +
      "ecriture AGIT et PRIME sur tout calcul. Jamais rejouee sur CE depot-ci.",
  );
}

// E-2 — la version du README = celle que GitHub presente. C'est ici que la dette de publication
// devient visible, et c'est voulu.
if (latest && annoncee && `v${annoncee}` !== latest) {
  ecarts.push(
    `E-2 : le README annonce v${annoncee}, GitHub presente ${latest}. DETTE DE PUBLICATION : le ` +
      `depot a bumpe jusqu'a v${autorite} sans jamais publier depuis ${latest}. Ce rouge est VOULU ` +
      "— il informe, il est HORS gate et ne bloque aucun lot. Il s'eteindra a la prochaine " +
      'publication (acte du decideur, cf. AR-4 de L42).',
  );
}

// E-3 / E-5 — ce que le README ANNONCE existe, ce qu'il DECLARE ABSENT est bien absent.
//
// LA DISTINCTION QUI MANQUAIT. Le README est un PORTEUR (AR-1 = a) : il annonce la version que le
// depot porte, meme si elle n'est pas encore publiee. Sans declaration, il envoyait donc le
// visiteur vers une page 404 — et cette face-ci le criait en E-3, ce que le visiteur ne voit pas.
// Le cri n'etait pas la reparation. Depuis, les voies indisponibles sont DECLAREES dans
// `cli/fixtures/vitrine-locale.json` et VISIBLES dans le README : le 404 attendu devient un
// CONSTAT (vert-avec-mention), et c'est sa DISPARITION qui devient un rouge — E-5, le cliquet
// auto-destructeur, seul message actionnable des deux.
const tagAnnonce = annoncee ? `v${annoncee}` : latest;
if (tagAnnonce) {
  const toutesAbsentes = Object.keys(VOIES).every((c) => declareeAbsente(c));
  const r = await api(`/repos/${DEPOT}/releases/tags/${tagAnnonce}`);
  if (r.absent) {
    if (toutesAbsentes) {
      constats.push(
        `release ${tagAnnonce} : ABSENTE (404) — CONFORME a ce que le README declare. Les ` +
          `${ABSENTS.length} voie(s) qui en dependent y sont nommees non fournies, avec motif, ` +
          'date et condition de levee ; le visiteur est renvoye vers la page des versions et vers ' +
          "l'installation depuis le depot, qui ne depend d'aucune release.",
      );
    } else {
      ecarts.push(
        `E-3 : la release ${tagAnnonce}, que le README pointe, N'EXISTE PAS pour un visiteur anonyme ` +
          "— le lien de la page d'accueil mene a une 404, et aucune declaration d'absence ne le dit",
      );
    }
  } else {
    const assets = (r.corps.assets ?? []).map((a) => a.name);
    constats.push(`assets sur ${tagAnnonce} : ${assets.length} (${assets.join(', ') || 'aucun'})`);
    const attendu = nomArtefact(annoncee ?? autorite);

    // E-3 — l'artefact annonce existe REELLEMENT. Un `200` sur la page de la release ne suffirait
    // pas : on verifie l'existence de l'ASSET PAR SON NOM. Muet si la voie est declaree absente :
    // rougir sur une absence qu'on vient d'ecrire noir sur blanc, c'est punir l'honnetete.
    if (!declareeAbsente('tgz') && !assets.includes(attendu)) {
      ecarts.push(`E-3 : le README annonce « ${attendu} », qui N'EST PAS un asset de ${tagAnnonce}`);
    }

    // E-4 — aucun asset installable passe sous silence.
    for (const nom of assets) {
      if (nom.endsWith('.tgz') && !readme.includes(nom)) {
        ecarts.push(
          `E-4 : l'asset installable « ${nom} » de ${tagAnnonce} n'est annonce NULLE PART dans le ` +
            'README : la release livre plus que la vitrine ne montre',
        );
      }
    }

    // E-5 — CLIQUET AUTO-DESTRUCTEUR. Une declaration d'absence qui redevient fausse DOIT rougir,
    // sinon elle survivrait a sa raison d'etre — le meme defaut, retourne. Le message porte la
    // commande de rattrapage, parce que c'est lui qui commande le geste.
    const rattrapage =
      'retirer l\'entree de cli/fixtures/vitrine-locale.json puis rejouer ' +
      'node cli/scripts/vitrine.js --write';
    if (declareeAbsente('tgz') && assets.includes(attendu)) {
      ecarts.push(
        `E-5 : « ${attendu} » est declare ABSENT dans cli/fixtures/vitrine-locale.json mais il EST ` +
          `present sur ${tagAnnonce}. La declaration a survecu a sa raison d'etre : ${rattrapage}`,
      );
    }
    if (declareeAbsente('archive')) {
      ecarts.push(
        `E-5 : la voie « archive » est declaree ABSENTE, mais la release ${tagAnnonce} EXISTE — ` +
          `GitHub y attache TOUJOURS l'archive des sources. La declaration est devenue fausse : ` +
          `${rattrapage}`,
      );
    }
  }
}

console.log(`${NOM} — mesure ANONYME (aucun jeton envoye) :`);
for (const c of constats) console.log(`  ${c}`);
if (ecarts.length === 0) {
  console.log(`\n${NOM} : OK — la vitrine et l'etagere concordent.`);
  process.exit(0);
}
console.error(`\n${NOM} : ${ecarts.length} ecart(s) entre ce qu'on montre et ce qu'on porte\n`);
for (const e of ecarts) console.error(`  - ${e}`);
process.exit(1);
