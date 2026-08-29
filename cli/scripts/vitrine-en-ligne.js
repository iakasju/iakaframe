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
// CODES DE SORTIE — 0 : mesure faite, tout concorde · 1 : mesure faite, ecart(s) · 2 : usage
// · 3 : NON MESURE (reseau indisponible ou quota anonyme epuise). Le 3 est DISTINCT du 0 a dessein :
// un controle qui rend « succes » alors qu'il n'a rien mesure est le pire des faux verts.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nomArtefact, versionAnnoncee } from './lib/vitrine.js';

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
if (latest && plusHaut && latest !== plusHaut) {
  ecarts.push(
    `E-1 : « latest » designe ${latest} alors que ${plusHaut} existe. Republier un tag ancien VOLE ` +
      `le latest (drapeau make_latest, defaut true). Rattrapage : gh release edit ${plusHaut} --latest`,
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

// E-3 — l'artefact annonce existe REELLEMENT sur la release annoncee. Un `200` sur la page de la
// release ne suffirait pas : on verifie l'existence de l'ASSET PAR SON NOM.
const tagAnnonce = annoncee ? `v${annoncee}` : latest;
if (tagAnnonce) {
  const r = await api(`/repos/${DEPOT}/releases/tags/${tagAnnonce}`);
  if (r.absent) {
    ecarts.push(
      `E-3 : la release ${tagAnnonce}, que le README pointe, N'EXISTE PAS pour un visiteur anonyme ` +
        '— le lien de la page d\'accueil mene a une 404',
    );
  } else {
    const assets = (r.corps.assets ?? []).map((a) => a.name);
    constats.push(`assets sur ${tagAnnonce} : ${assets.length} (${assets.join(', ') || 'aucun'})`);
    const attendu = nomArtefact(annoncee ?? autorite);
    if (!assets.includes(attendu)) {
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
