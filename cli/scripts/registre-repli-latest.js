#!/usr/bin/env node
// registre-repli-latest.js — LE REGISTRE DES ENONCES SUR LE REPLI DU `latest` (lot L43).
// HORS gate, HORS reseau, cross-depot.
//
// POURQUOI IL EXISTE — TROIS PASSAGES DE GATE ONT ECHOUE SUR LA MEME CLASSE. Le defaut n'a
// jamais ete « la meme erreur repetee » : c'est un FRONT QUI RECULE. Chaque passage a corrige
// exactement les emplacements que le gate lui montrait, et les pointeurs d'un gate sont des
// EXEMPLES, pas une enumeration. Quand la classe est une CHAINE (« NO-OP »), un `grep` la balaie
// entierement ; quand c'est une FORME D'INFERENCE (« drapeau inamovible => v0.10.0 »), le `grep`
// est aveugle : la phrase ne contient aucun des mots proscrits. ON NE `grep` PAS UNE IMPLICATION.
//
// LA REPONSE N'EST DONC PAS UN MEILLEUR MOTIF, C'EST UN REGISTRE : on enumere UNE FOIS les
// enonces du corpus qui affirment quelque chose sur le repli du `latest`, on les fige, et on
// se donne un moyen de ROUGIR quand ils derivent. C'est le geste que
// `fixtures/convergence.sha256` fait deja pour les fichiers jumeaux ; celui-ci est un artefact
// DISTINCT, et il ne touche pas a ce registre-la.
//
// CE QU'IL DETECTE (et il le dit) :
//   D-1  un enonce inscrit a DISPARU ou a ETE REECRIT      -> rouge, avec l'empreinte attendue
//   D-2  un enonce inscrit a CHANGE DE LIGNE               -> rouge : `chemin:ligne` mentirait
//   D-3  un FICHIER NEUF entre dans le vocabulaire         -> rouge : a trier, puis a inscrire
//   D-4  un fichier COUVERT gagne des occurrences          -> rouge : un enonce a ete AJOUTE
//
// CE QU'IL NE DETECTE PAS — DECLARE, PAS TU :
//   H-1  une implication NEUVE, dans un fichier deja couvert, ECRITE SANS AUCUN mot du motif.
//        C'est l'angle mort de tout balayage lexical. D-4 le reduit POUR LE SEUL CAS D'UN AJOUT
//        (le compte monte), sans le fermer. Il se ferme a la LECTURE.
//   H-3  UN ENONCE RETOURNE EN SON CONTRAIRE A COMPTE CONSTANT — ajoute le 2026-08-30, cinquieme
//        passage. D-4 ne voit qu'une VARIATION du compte ; substituer « SURVIT » a « REFUTEE »,
//        ou retourner un residu en son inverse, laisse le compte INCHANGE et passe. Rectifier le
//        comptage (occurrences au lieu de lignes) NE FERME PAS ce trou : la seule reponse est
//        d'INSCRIRE l'enonce lui-meme, pour que D-1 le tienne par son empreinte. C'est pourquoi
//        le registre ancre desormais les LIGNES DE VERDICT et les POINTS DE RESIDU, et non plus
//        seulement les titres de section qui les surplombent.
//   H-2  la JUSTESSE d'un enonce. Ce script compare des octets a un registre, il ne juge rien.
//
// CODES DE SORTIE — 0 : registre conforme · 1 : derive(s) · 2 : usage
// · 3 : NON MESURE (un depot du registre est introuvable). Le 3 est DISTINCT du 0 a dessein :
// un controle qui rend « succes » alors qu'il n'a pas tout vu est le pire des faux verts.
//
// USAGE
//   node cli/scripts/registre-repli-latest.js              # verifie
//   node cli/scripts/registre-repli-latest.js --ecrire     # re-inscrit apres une correction VOULUE
//        `--ecrire` reinscrit la POSITION (enonce retrouve ailleurs) ET LE CONTENU (empreinte +
//        extrait, depuis la ligne d'ancrage) — et il DIT lequel des deux, entree par entree. Si
//        l'ancre pointe au-dela de la fin du fichier, il n'ecrit RIEN et sort en 1.
//   IAKA_RACINE=/chemin/vers/work node cli/scripts/registre-repli-latest.js
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const NOM = 'registre:repli-latest';
const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRE = path.join(CLI, 'fixtures', 'registre-repli-latest.json');
const RACINE = process.env.IAKA_RACINE || path.resolve(CLI, '..', '..');

const ecrire = process.argv.includes('--ecrire');
if (process.argv.slice(2).some((a) => a !== '--ecrire')) {
  console.error(`${NOM} — usage : node cli/scripts/registre-repli-latest.js [--ecrire]`);
  process.exit(2);
}

const reg = JSON.parse(fs.readFileSync(REGISTRE, 'utf8'));
// SENSIBLE A LA CASSE, DELIBEREMENT : en `i`, `NO-OP` attrape tous les `noop` du code
// applicatif — 27 fichiers de bruit au lieu de 7. Le motif vise la PROSE, pas les identifiants.
const MOTIF = new RegExp(reg.balayage.motif);
// Variante globale : sert a COMPTER les occurrences (voir `occurrences` plus bas). `MOTIF` reste
// non global — un `RegExp` global est a etat (`lastIndex`) et `test()` alterne alors vrai/faux.
const MOTIF_GLOBAL = new RegExp(reg.balayage.motif, 'g');
const EXTENSIONS = reg.balayage.extensions;
const EXCLUS = reg.balayage.exclus;

function nonMesure(raison) {
  console.log(`${NOM} — SKIP : NON MESURE (${raison}).`);
  console.log('  Aucune verification du registre n\'a ete faite. Ce n\'est PAS un succes.');
  process.exit(3);
}

const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');

// --- balayage : quels fichiers PARLENT du repli du `latest` ? ------------------------------------
function fichiersDuDepot(racineDepot) {
  const trouves = [];
  (function marche(dir, rel) {
    let entrees;
    try {
      entrees = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entrees) {
      const chemin = rel ? `${rel}/${e.name}` : e.name;
      if (EXCLUS.some((x) => chemin === x || chemin.startsWith(`${x}/`) || e.name === x)) continue;
      if (e.isDirectory()) marche(path.join(dir, e.name), chemin);
      else if (EXTENSIONS.some((x) => e.name.endsWith(x))) trouves.push(chemin);
    }
  })(racineDepot, '');
  return trouves.sort();
}

// ON COMPTE DES OCCURRENCES, PAS DES LIGNES — ET SUR LE TEXTE RECOLLE.
// Corrige le 2026-08-30 (cinquieme passage du gate). La version d'origine faisait
// `lignes.reduce((n, l) => n + (MOTIF.test(l) ? 1 : 0), 0)` : elle rendait UN par ligne touchee,
// quel que soit le nombre d'enonces portes. DEUX defauts distincts, mesures :
//
//   (i)  MULTIPLICITE SUR UNE MEME LIGNE — 39 enonces sur le corpus couvert. Le compte etait de
//        292 « occurrences » pour 331 matches reels. Une ligne qui porte deux affirmations sur le
//        repli n'en valait qu'une : on pouvait en retourner une des deux sans que D-4 bouge.
//        C'EST LA CAUSE DE LA QUASI-TOTALITE DE L'ECART, et elle n'a rien a voir avec la
//        justification du texte.
//   (ii) MOTIF COUPE PAR LE RETOUR A LA LIGNE — 2 enonces. Le corpus est justifie a 100 colonnes ;
//        « … vole le \n `latest` … » ne matche NI la premiere ligne NI la seconde. L'un des deux
//        etait `installer-depuis-rien.md` etape 5.3, une PRESCRIPTION VIVANTE qui ordonnait de
//        recopier la phrase refutee dans les trois `CLAUDE.md` — invisible a quatre passages.
//
// LE RECOLLAGE (trim de chaque ligne, jointure par une espace) rend le texte tel qu'il se LIT, non
// tel qu'il est justifie. Il peut en principe fabriquer un match a cheval sur deux paragraphes sans
// rapport : ce serait un FAUX ROUGE — un enonce a trier —, jamais un faux vert. MESURE DU
// 2026-08-30 : sur les trois depots, aucun fichier n'entre dans le vocabulaire par ce seul effet.
function occurrences(abs) {
  let brut;
  try {
    brut = fs.readFileSync(abs, 'utf8');
  } catch {
    return null;
  }
  const recolle = brut.split('\n').map((l) => l.trim()).join(' ');
  return (recolle.match(MOTIF_GLOBAL) ?? []).length;
}

const derives = [];
const constats = [];
// F-4 (cinquieme passage, 2026-08-30) : ce que `--ecrire` a REELLEMENT fait. Le message de sortie
// annoncait « REGISTRE RE-INSCRIT (N enonces) » quoi qu'il arrive — y compris quand il n'avait
// RIEN reinscrit. Mesure : apres une reecriture VOULUE (cas D-1), `--ecrire` imprimait ce message
// puis D-1 rougissait encore, exit 1. Le remede que le registre DICTAIT ne reparait pas — la forme
// exacte du defaut que ce lot denonce, celui qui s'imprime au moment ou quelqu'un decide.
const reinscrits = [];
const deplaces = [];
const irreparables = [];

// --- 1. chaque depot du registre existe-t-il ? ---------------------------------------------------
for (const d of Object.keys(reg.depots)) {
  if (!fs.existsSync(path.join(RACINE, d))) nonMesure(`depot « ${d} » introuvable sous ${RACINE}`);
}

// --- 2. D-1 / D-2 : les enonces inscrits sont-ils encore la, et a la meme ligne ? -----------------
for (const e of reg.entrees) {
  const abs = path.join(RACINE, e.depot, e.chemin);
  if (!fs.existsSync(abs)) {
    derives.push(`D-1 ${e.depot}/${e.chemin} — FICHIER DISPARU. Enonce « ${e.id} » non verifiable.`);
    continue;
  }
  const lignes = fs.readFileSync(abs, 'utf8').split('\n');
  const idx = lignes.findIndex((l) => sha(l) === e.empreinte);
  if (idx === -1) {
    const actuelle = lignes[e.ligne - 1] ?? '';
    derives.push(
      `D-1 ${e.depot}/${e.chemin}:${e.ligne} — l'enonce « ${e.id} » a DISPARU ou a ETE REECRIT.\n` +
        `      inscrit  : ${JSON.stringify(e.extrait)}\n` +
        `      a la ligne: ${JSON.stringify(actuelle.slice(0, 120))}\n` +
        `      Si la reecriture est VOULUE, relire l'entree du § Registre puis : ` +
        'node cli/scripts/registre-repli-latest.js --ecrire',
    );
  } else if (idx + 1 !== e.ligne) {
    derives.push(
      `D-2 ${e.depot}/${e.chemin} — l'enonce « ${e.id} » a MIGRE de la ligne ${e.ligne} a la ` +
        `ligne ${idx + 1} : tout « chemin:ligne » qui le cite ment desormais. ` +
        'Sortie : node cli/scripts/registre-repli-latest.js --ecrire',
    );
  }
  if (ecrire) {
    if (idx !== -1) {
      // L'enonce est INTACT : seule sa position a bouge. Rien d'autre a reinscrire.
      if (idx + 1 !== e.ligne) deplaces.push(`${e.id} : ${e.ligne} -> ${idx + 1}`);
      e.ligne = idx + 1;
    } else if (e.ligne - 1 < lignes.length) {
      // L'enonce a ete REECRIT. On ne peut pas deviner ou il est passe : l'entree est ancree par
      // son `chemin:ligne`, donc on reinscrit CE QUI S'Y TROUVE AUJOURD'HUI — empreinte ET
      // extrait, pas seulement la ligne. C'est un acte DELIBERE : chaque reinscription est
      // imprimee avec son avant/apres, pour qu'elle se relise a l'ecran et pas seulement au diff.
      const actuelle = lignes[e.ligne - 1];
      reinscrits.push(
        `${e.id} (${e.depot}/${e.chemin}:${e.ligne})\n` +
          `        avant : ${JSON.stringify(e.extrait)}\n` +
          `        apres : ${JSON.stringify(actuelle)}`,
      );
      e.extrait = actuelle;
      e.empreinte = sha(actuelle);
    } else {
      // Le fichier est plus court que l'ancre : il n'y a RIEN a reinscrire. On le DIT, et
      // `--ecrire` echouera — plutot que d'annoncer une re-inscription qui n'a pas eu lieu.
      irreparables.push(
        `${e.id} (${e.depot}/${e.chemin}:${e.ligne}) — le fichier ne compte que ` +
          `${lignes.length} ligne(s). L'ancre pointe dans le vide : ni l'empreinte inscrite ni ` +
          'la ligne d\'ancrage ne se retrouvent. A retrier a la main dans le § Registre.',
      );
    }
  }
}

// --- 3. D-3 / D-4 : le vocabulaire s'est-il etendu depuis l'inscription ? -------------------------
const comptesFrais = {};
for (const [d, meta] of Object.entries(reg.depots)) {
  const racineDepot = path.join(RACINE, d);
  comptesFrais[d] = {};
  for (const rel of fichiersDuDepot(racineDepot)) {
    const n = occurrences(path.join(racineDepot, rel));
    if (n > 0) comptesFrais[d][rel] = n;
  }
  for (const [rel, n] of Object.entries(comptesFrais[d])) {
    const inscrit = meta.couverts[rel];
    const horsCouverture = meta.horsCouverture?.[rel];
    if (inscrit === undefined && horsCouverture === undefined) {
      derives.push(
        `D-3 ${d}/${rel} — FICHIER NEUF dans le vocabulaire du repli (${n} occurrence(s)), ` +
          'absent du registre. A TRIER : soit il porte un enonce de la classe et il s\'inscrit ' +
          'dans le § Registre, soit il n\'en porte pas et il se declare en horsCouverture avec ' +
          'son motif.',
      );
    } else if (inscrit !== undefined && n !== inscrit) {
      derives.push(
        `D-4 ${d}/${rel} — ${n} occurrence(s) aujourd'hui, ${inscrit} a l'inscription : ` +
          `${n > inscrit ? 'un enonce a ete AJOUTE' : 'un enonce a ete RETIRE'}. Le registre ne ` +
          'le connait pas. A relire, puis --ecrire.',
      );
    }
  }
  for (const rel of Object.keys(meta.couverts)) {
    if (comptesFrais[d][rel] === undefined) {
      derives.push(`D-4 ${d}/${rel} — le fichier ne porte PLUS aucune occurrence du motif.`);
    }
  }
  if (ecrire) {
    const horsC = meta.horsCouverture ?? {};
    meta.couverts = Object.fromEntries(
      Object.entries(comptesFrais[d]).filter(([rel]) => horsC[rel] === undefined),
    );
  }
  constats.push(`${d} : ${Object.keys(comptesFrais[d]).length} fichier(s) touches par le motif`);
}

if (ecrire) {
  // LE MESSAGE DIT CE QUI A EU LIEU, PAS CE QU'ON ESPERAIT. Il enumere les trois issues
  // separement : deplacement (position seule), re-inscription (contenu), impossibilite.
  if (irreparables.length > 0) {
    console.log(`${NOM} — RE-INSCRIPTION IMPOSSIBLE pour ${irreparables.length} enonce(s) :`);
    for (const i of irreparables) console.log(`    ${i}`);
    console.log('');
    console.log(`${NOM} — RIEN N'A ETE ECRIT. Le registre est INCHANGE et reste PERIME.`);
    process.exit(1);
  }
  reg.inscritLe = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(REGISTRE, `${JSON.stringify(reg, null, 2)}\n`, 'utf8');
  const inchanges = reg.entrees.length - deplaces.length - reinscrits.length;
  console.log(
    `${NOM} — REGISTRE ECRIT : ${reinscrits.length} enonce(s) RE-INSCRIT(S) (contenu), ` +
      `${deplaces.length} DEPLACE(S) (position seule), ${inchanges} inchange(s) ` +
      `sur ${reg.entrees.length}. Les comptes de couverture sont recalcules.`,
  );
  if (deplaces.length > 0) {
    console.log('  DEPLACES — meme texte, autre ligne :');
    for (const d of deplaces) console.log(`    ${d}`);
  }
  if (reinscrits.length > 0) {
    console.log('  🛑 RE-INSCRITS — LE TEXTE A CHANGE. Relire chacun : c\'est le seul endroit ou');
    console.log('     une reecriture FAUSSE se fait avaliser par le registre.');
    for (const r of reinscrits) console.log(`    ${r}`);
  }
  process.exit(0);
}

console.log(`${NOM} — inscrit le ${reg.inscritLe} · ${reg.entrees.length} enonces enumeres`);
for (const c of constats) console.log(`  ${c}`);
if (derives.length === 0) {
  console.log(`${NOM} — CONFORME : chaque enonce inscrit est a sa place, et aucun n'a ete ajoute.`);
  console.log('  RAPPEL H-1 : une implication neuve ecrite SANS aucun mot du motif reste invisible');
  console.log('  a ce controle. Il ne remplace pas la lecture du § Registre.');
  process.exit(0);
}
console.log('');
for (const d of derives) console.log(`  ${d}`);
console.log('');
console.log(`${NOM} — ${derives.length} derive(s). Le registre est PERIME tant qu'elles subsistent.`);
process.exit(1);
