#!/usr/bin/env node
// registre-repli-latest.js — LE REGISTRE DES ENONCES SUR LE REPLI DU `latest` (lot L43).
// HORS gate, HORS reseau, cross-depot.
//
// ⚠️ RECTIFIE LE 2026-09-01 (LOT L44) — CET EN-TETE MENTAIT SUR LUI-MEME, ET LE LOT QUI RE-CADRE
// « la chose doit dire ce qu'elle fait » ne pouvait pas le laisser. La ligne ci-dessous disait
// « TROIS PASSAGES DE GATE ONT ECHOUE » et se contredisait VINGT-SIX LIGNES PLUS BAS (« Cinq
// passages ont inscrit... »). Le compte juste est CINQ ; le lot L43 a ete gate PASS au SIXIEME
// passage. La mention « TROIS » est DATEE ici, pas effacee. Elle a survecu a six passages parce
// que ce fichier etait exclu AU NIVEAU FICHIER : un motif, aucune empreinte — c'est exactement
// le trou que le lot L44 ferme (voir « ANCRAGE LIGNE A LIGNE » plus bas).
//
// POURQUOI IL EXISTE — CINQ PASSAGES DE GATE ONT ECHOUE SUR LA MEME CLASSE. Le defaut n'a
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
//   D-5  BALAYAGE DE COMPLETUDE — une ligne d'un fichier COUVERT **ou EXCLU** porte le motif et
//        n'est TENUE PAR AUCUNE EMPREINTE : ni inscrite au § Registre, ni declaree hors
//        couverture avec son motif -> rouge. CRITERE DE CLOTURE, ajoute au 6e passage ; etendu
//        aux fichiers exclus le 2026-09-01 (L44).
//   D-6  une ligne DECLAREE hors couverture a ete REECRITE (empreinte ligne a ligne differente)
//        -> rouge : le motif d'exclusion portait sur UN TEXTE, pas sur un numero de ligne.
//   D-7  une declaration hors couverture est PERIMEE (sa ligne ne porte plus le motif, ou pointe
//        au-dela de la fin du fichier) -> rouge : une exclusion muette est une dette, pas un fait.
//   D-8  une CLE DE PROSE DE CE REGISTRE a ete REECRITE, ou n'est tenue par aucune empreinte, ou
//        sa declaration ne designe plus rien -> rouge. Ajoute le 2026-09-01 (L44). C'est ce qui
//        interdit a l'instrument de mentir sur lui-meme : les phrases qui DECRIVENT le registre
//        (sa raison d'etre, son motif de balayage, sa regle de tri, son cliquet, sa mesure
//        d'entree, sa borne H-1) sont tenues par empreinte, comme n'importe quel enonce du
//        corpus. LA LISTE N'EST PAS EN DUR : elle est DECOUVERTE dans le JSON — toute feuille de
//        texte hors `depots`, `entrees`, `clesDeProse` et `inscritLe` est une cle de prose, donc
//        une cle NEUVE non declaree ROUGIT au lieu de passer en silence. Le defaut d'une garde
//        n'est jamais la liste, c'est son MUTISME.
//
// ANCRAGE LIGNE A LIGNE DES FICHIERS EXCLUS — 2026-09-01 (L44, AR-4 = (b)). Jusqu'ici, un fichier
// declare dans `horsCouverture` l'etait AU NIVEAU FICHIER : un motif, AUCUNE empreinte. Un tel
// fichier pouvait GAGNER un enonce, ou en retourner un, sans que rien ne bouge — et c'est
// PRECISEMENT par ce trou que la phrase fausse de l'en-tete ci-dessus a survecu a six passages.
// L'exclusion de fichier est CONSERVEE (elle dit pourquoi le fichier ne porte pas la classe),
// mais D-5, D-6 et D-7 s'y appliquent desormais : chaque ligne du motif d'un fichier exclu porte
// SON empreinte et SON motif. Meme pouvoir de detection qu'une abolition de `horsCouverture`,
// sans refonte de l'instrument.
//
// POURQUOI D-5 EXISTE — L'INSCRIPTION PAR POINTEURS NE CLOT RIEN. Cinq passages ont inscrit
// EXACTEMENT les lignes que le gate montrait, et cinq fois la classe a survecu a cote : une liste
// de pointeurs, meme longue, reste un ECHANTILLON. Ce qui manquait n'etait pas une liste plus
// grande, c'etait un CRITERE AUTO-VERIFIABLE. D-5 le pose : dans un fichier couvert, TOUTE ligne
// du motif doit etre tenue par une empreinte — soit comme enonce inscrit, soit comme exclusion
// DECLAREE AVEC SON MOTIF, ligne a ligne. Aucune exclusion en masse : une exclusion sans motif
// ne vaut pas mieux qu'un `grep`. C'est, ligne a ligne, le geste que `fixtures/convergence.sha256`
// fait fichier a fichier. MESURE AU 6e PASSAGE : 309 lignes du motif dans les 16 fichiers
// couverts, 56 tenues par une empreinte — 253 ne l'etaient pas.
// `--ecrire` NE FABRIQUE JAMAIS UNE EXCLUSION : il re-ancre celles qui existent (position seule,
// par empreinte), jamais il n'en cree. Une ligne neuve du motif se TRIE A LA MAIN. C'est le
// cliquet — sans lui, D-5 se refermerait tout seul en avalant ce qu'il devait signaler.
//
// CE QU'IL NE DETECTE PAS — DECLARE, PAS TU :
//   H-1  une implication NEUVE, dans un fichier deja couvert, ECRITE SANS AUCUN mot du motif.
//        C'est l'angle mort de tout balayage lexical, et D-5 NE LE FERME PAS — D-5 balaie les
//        lignes QUI PORTENT LE MOTIF ; une ligne qui n'en porte aucun lui est invisible, quelle
//        que soit sa completude sur le reste. MESURE, au 6e passage : sur les 22 enonces que le
//        gate a releves comme non inscrits, 7 (`IakaCockpit/CLAUDE.md:346`, `iakaFrameGUI/
//        CLAUDE.md:426`, `contrefactuel-ca5-procedure-decideur.md:49,219,221,537,550`) NE
//        MATCHENT PAS le motif : ils ont ete inscrits A LA LECTURE, et par aucun balayage.
//        H-1 RESTE OUVERT — ce n'est pas une dette, c'est la BORNE DE L'INSTRUMENT. La lecture
//        reste dans la boucle.
//   H-3  UN ENONCE RETOURNE EN SON CONTRAIRE A COMPTE CONSTANT — ajoute le 2026-08-30, cinquieme
//        passage. D-4 ne voit qu'une VARIATION du compte ; substituer « SURVIT » a « REFUTEE »,
//        ou retourner un residu en son inverse, laisse le compte INCHANGE et passe. Rectifier le
//        comptage (occurrences au lieu de lignes) NE FERME PAS ce trou : la seule reponse est
//        d'INSCRIRE l'enonce lui-meme, pour que D-1 le tienne par son empreinte.
//        CE QUI EST ANCRE, ET RIEN DE PLUS : les lignes de verdict et les corps de residu QUI
//        FIGURENT AU § REGISTRE, plus toute ligne du motif d'un fichier couvert (D-5). Les titres
//        de section ne sont PAS « abolis » : plusieurs restent inscrits parce qu'ils AFFIRMENT
//        (R-1, F3, F6, F7) ; ceux qui n'affirment rien sont declares hors couverture, avec motif.
//   H-2  la JUSTESSE d'un enonce. Ce script compare des octets a un registre, il ne juge rien.
//
// CODES DE SORTIE — 0 : registre conforme · 1 : derive(s) · 2 : usage
// · 3 : NON MESURE (un depot du registre est introuvable). Le 3 est DISTINCT du 0 a dessein :
// un controle qui rend « succes » alors qu'il n'a pas tout vu est le pire des faux verts.
//
// USAGE
//   node cli/scripts/registre-repli-latest.js              # verifie
//   node cli/scripts/registre-repli-latest.js --mesurer-extensions
//        MESURE, PAR L'INSTRUMENT LUI-MEME, ce que ramenerait le balayage sur des extensions qui
//        n'y sont pas. Ne verifie rien, ne change rien : il compte. Existe parce qu'une mesure
//        prise avec un autre outil (`ripgrep`, qui honore `.gitignore`) n'est pas la mesure de
//        cet instrument-ci, et que c'est celle de l'instrument qui fait foi.
//   node cli/scripts/registre-repli-latest.js --ecrire     # re-inscrit apres une correction VOULUE
//        `--ecrire` reinscrit la POSITION (enonce retrouve ailleurs) ET LE CONTENU (empreinte +
//        extrait, depuis la ligne d'ancrage) — et il DIT lequel des deux, entree par entree. Si
//        l'ancre pointe au-dela de la fin du fichier, il n'ecrit RIEN et sort en 1.
//        Sur les DECLARATIONS hors couverture, il ne fait qu'une chose : les RE-ANCRER a leur
//        nouvelle ligne quand le texte exclu a bouge sans changer. Il n'en cree aucune, il n'en
//        supprime aucune, et il n'avalise aucune reecriture (D-6 reste rouge).
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
const mesurerExtensions = process.argv.includes('--mesurer-extensions');
if (process.argv.slice(2).some((a) => a !== '--ecrire' && a !== '--mesurer-extensions')) {
  console.error(
    `${NOM} — usage : node cli/scripts/registre-repli-latest.js [--ecrire|--mesurer-extensions]`,
  );
  process.exit(2);
}
if (ecrire && mesurerExtensions) {
  console.error(`${NOM} — --ecrire et --mesurer-extensions s'excluent : l'un ecrit, l'autre compte.`);
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
// Une declaration hors couverture DOIT porter un motif ; si elle n'en porte pas, on le DIT
// plutot que d'imprimer `undefined` — le mutisme est precisement ce qu'on refuse ici.
const dec2Motif = (x) => (x && x.motif) || '(MOTIF ABSENT — declaration muette)';

// --- balayage : quels fichiers PARLENT du repli du `latest` ? ------------------------------------
function fichiersDuDepot(racineDepot, extensions = EXTENSIONS) {
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
      else if (extensions.some((x) => e.name.endsWith(x))) trouves.push(chemin);
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

// --- MODE MESURE D'EXTENSIONS (CA-18) -------------------------------------------------------------
// Compte, AVEC LE BALAYEUR DE CET INSTRUMENT, ce que ramenerait chaque extension hors couverture.
// Il ne verifie rien : il mesure. Pourquoi c'est ici et pas dans un `ripgrep` : `ripgrep` honore
// `.gitignore` et cet instrument non ; les deux mesures peuvent differer, et c'est CELLE DE
// L'INSTRUMENT qui fait foi, puisque c'est elle qui decrit ce que le balayage verrait.
if (mesurerExtensions) {
  const candidates = reg.balayage.extensionsHorsCouverture
    ? Object.keys(reg.balayage.extensionsHorsCouverture).filter((k) => !k.startsWith('//'))
    : [];
  const aMesurer = ['.json', ...candidates.filter((x) => x !== '.json')];
  console.log(`${NOM} — MESURE D'EXTENSIONS, par le balayeur de cet instrument.`);
  console.log(`  extensions balayees aujourd'hui : ${EXTENSIONS.join(' ')}`);
  console.log(`  extensions mesurees ici          : ${aMesurer.join(' ')}`);
  for (const d of Object.keys(reg.depots)) {
    const racineDepot = path.join(RACINE, d);
    if (!fs.existsSync(racineDepot)) nonMesure(`depot « ${d} » introuvable sous ${RACINE}`);
    for (const ext of aMesurer) {
      const fichiers = fichiersDuDepot(racineDepot, [ext]);
      let nbFichiers = 0;
      let nbLignes = 0;
      const detail = [];
      for (const rel of fichiers) {
        let brut;
        try {
          brut = fs.readFileSync(path.join(racineDepot, rel), 'utf8');
        } catch {
          continue;
        }
        const n = brut.split('\n').filter((l) => MOTIF.test(l)).length;
        if (n > 0) {
          nbFichiers += 1;
          nbLignes += n;
          detail.push(`${rel} (${n})`);
        }
      }
      console.log(`  ${d.padEnd(14)} ${ext.padEnd(6)} ${nbFichiers} fichier(s) · ${nbLignes} ligne(s) du motif`);
      for (const x of detail) console.log(`      ${x}`);
    }
  }
  console.log('  (comptage a la LIGNE, comme le balayage de completude — pas a l\'occurrence.)');
  process.exit(0);
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

// LIGNES INSCRITES, INDEXEES PAR FICHIER — la matiere premiere du balayage de completude (D-5).
// Une ligne est « tenue » des lors qu'une entree du § Registre l'ancre : c'est D-1 qui la garde.
const lignesInscrites = new Map();
for (const e of reg.entrees) {
  const cle = `${e.depot}/${e.chemin}`;
  if (!lignesInscrites.has(cle)) lignesInscrites.set(cle, new Set());
  lignesInscrites.get(cle).add(e.ligne);
}
const bilanCompletude = { motif: 0, inscrites: 0, declarees: 0, nonTenues: 0 };
// Indices de ligne DEJA attribues a une entree, par fichier (voir « UNE LIGNE, UNE ENTREE »).
const indicesPris = new Map();
const deplacesExclusions = [];

// --- 0. D-8 : LES CLES DE PROSE DE CE REGISTRE ----------------------------------------------------
// L'instrument ne peut pas mentir sur lui-meme sans que quelque chose rougisse. Les phrases qui
// DECRIVENT le registre sont tenues par empreinte, exactement comme les enonces du corpus.
//
// LA LISTE N'EST PAS EN DUR — elle est DECOUVERTE. Toute feuille de texte du JSON hors `depots`,
// `entrees`, `clesDeProse` et `inscritLe` est une cle de prose. Une cle NEUVE non declaree rougit
// donc au lieu de passer : le defaut d'une garde n'est jamais la liste, c'est son MUTISME.
function clesDeProseDecouvertes(objet, prefixe = '') {
  const trouvees = [];
  for (const [k, v] of Object.entries(objet)) {
    const chemin = prefixe ? `${prefixe}.${k}` : k;
    if (prefixe === '' && (k === 'depots' || k === 'entrees' || k === 'inscritLe')) continue;
    // `clesDeProse` porte des EMPREINTES, pas de la prose — sauf ses propres commentaires `//`,
    // qui en sont et se tiennent comme les autres. Sans cette exception, l'en-tete qui explique
    // D-8 serait le seul texte du registre reecrivable en silence : un mutisme de plus.
    if (prefixe === 'clesDeProse' && !k.startsWith('//')) continue;
    if (typeof v === 'string') trouvees.push([chemin, v]);
    else if (v && typeof v === 'object' && !Array.isArray(v)) {
      trouvees.push(...clesDeProseDecouvertes(v, chemin));
    }
  }
  return trouvees;
}

const prose = clesDeProseDecouvertes(reg);
const declaresProse = reg.clesDeProse ?? {};
const proseReinscrites = [];
for (const [chemin, texte] of prose) {
  const attendue = declaresProse[chemin];
  if (attendue === undefined) {
    derives.push(
      `D-8 cli/fixtures/registre-repli-latest.json — CLE DE PROSE NON TENUE : « ${chemin} ». ` +
        'Aucune empreinte ne repond de ce texte : il peut etre reecrit sans que rien ne bouge. ' +
        `A DECLARER A LA MAIN dans « clesDeProse » avec son empreinte : ${sha(texte)}\n` +
        `      texte : ${JSON.stringify(texte.slice(0, 140))}`,
    );
    continue;
  }
  if (attendue !== sha(texte)) {
    derives.push(
      `D-8 cli/fixtures/registre-repli-latest.json — CLE DE PROSE REECRITE : « ${chemin} ».\n` +
        `      empreinte inscrite : ${attendue}\n` +
        `      empreinte du texte : ${sha(texte)}\n` +
        `      aujourd'hui        : ${JSON.stringify(texte.slice(0, 140))}\n` +
        "      Si la reecriture est VOULUE, RELIRE la cle puis reporter l'empreinte A LA MAIN : " +
        '`--ecrire` ne l\'avalise pas tout seul.',
    );
    if (ecrire) proseReinscrites.push(chemin);
  }
}
const cheminsProse = new Set(prose.map(([c]) => c));
for (const chemin of Object.keys(declaresProse)) {
  if (!cheminsProse.has(chemin)) {
    derives.push(
      `D-8 cli/fixtures/registre-repli-latest.json — DECLARATION DE PROSE PERIMEE : « ${chemin} » ` +
        'ne designe plus aucune cle de texte du registre. A RETIRER ou a REMOTIVER a la main : ' +
        'une declaration qui ne repond de rien est une dette, pas une garde.',
    );
  }
}

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
  // L'ANCRE D'ABORD, LA RECHERCHE ENSUITE. Corrige le 2026-08-30 (sixieme passage) : la version
  // d'origine cherchait toujours la PREMIERE ligne d'empreinte egale. Deux lignes IDENTIQUES dans
  // un meme fichier — cas reel : les deux `RATTRAPAGE MANUEL` du job `latest` (186 et 196) — se
  // faisaient alors mutuellement rougir en D-2, un faux positif pur. On regarde donc d'abord si
  // l'ancre elle-meme porte l'empreinte inscrite ; on ne balaie le fichier que si elle ne l'a pas.
  // UNE LIGNE, UNE ENTREE — corrige le 2026-09-01 (L44). Quand DEUX entrees portent le MEME texte
  // dans le MEME fichier (cas reel : les deux `RATTRAPAGE MANUEL` du job) et que les DEUX ancres
  // ont bouge, `findIndex` rendait a chacune la PREMIERE occurrence : `--ecrire` les empilait sur
  // la meme ligne, et la seconde occurrence du fichier se retrouvait tenue par PERSONNE. Le remede
  // que le registre DICTE ne peut pas fabriquer ce genre de trou. On reserve donc les indices deja
  // attribues, dans l'ordre des entrees — qui est l'ordre des lignes.
  const cleFichier = `${e.depot}/${e.chemin}`;
  if (!indicesPris.has(cleFichier)) indicesPris.set(cleFichier, new Set());
  const prises = indicesPris.get(cleFichier);
  const surAncre =
    e.ligne - 1 < lignes.length &&
    sha(lignes[e.ligne - 1]) === e.empreinte &&
    !prises.has(e.ligne - 1);
  const idx = surAncre
    ? e.ligne - 1
    : lignes.findIndex((l, i) => !prises.has(i) && sha(l) === e.empreinte);
  if (idx !== -1) prises.add(idx);
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

  // --- D-5 / D-6 / D-7 : LE BALAYAGE DE COMPLETUDE -----------------------------------------------
  // Le critere de cloture. Pour CHAQUE fichier couvert, on enumere les lignes qui portent le motif
  // et on exige que CHACUNE soit tenue par une empreinte : entree du § Registre (D-1 la garde), ou
  // declaration `lignesHorsCouverture` avec son motif ET l'empreinte du texte exclu. Une ligne qui
  // n'est ni l'un ni l'autre est une ligne dont personne ne repond : elle rougit.
  const declarations = (meta.lignesHorsCouverture ??= {});
  // COUVERTS **ET EXCLUS** (L44, AR-4 = (b)). Une exclusion AU NIVEAU FICHIER disait « ce fichier
  // ne porte pas la classe » sans repondre d'AUCUNE de ses lignes : il pouvait en gagner une, ou
  // en retourner une, sans que rien ne bouge. C'est par ce trou que la phrase fausse de l'en-tete
  // de CE script a survecu a six passages. L'exclusion de fichier reste — elle porte le motif —,
  // mais chaque ligne du motif y est desormais tenue, comme dans un fichier couvert.
  const balayes = [...Object.keys(meta.couverts), ...Object.keys(meta.horsCouverture ?? {})];
  for (const rel of balayes) {
    const abs = path.join(racineDepot, rel);
    if (!fs.existsSync(abs)) continue;
    const lignes = fs.readFileSync(abs, 'utf8').split('\n');
    const inscrites = lignesInscrites.get(`${d}/${rel}`) ?? new Set();
    const declaresFichier = declarations[rel] ?? {};
    const vues = new Set();
    lignes.forEach((texte, i) => {
      if (!MOTIF.test(texte)) return;
      const no = i + 1;
      bilanCompletude.motif += 1;
      if (inscrites.has(no)) {
        bilanCompletude.inscrites += 1;
        return;
      }
      const dec = declaresFichier[String(no)];
      if (dec === undefined) {
        bilanCompletude.nonTenues += 1;
        derives.push(
          `D-5 ${d}/${rel}:${no} — LIGNE DU MOTIF NON TENUE. Aucune empreinte ne repond d'elle : ` +
            'ni entree du § Registre, ni declaration hors couverture.\n' +
            `      ligne : ${JSON.stringify(texte.slice(0, 140))}\n` +
            '      A TRIER A LA MAIN : soit elle AFFIRME quelque chose sur le repli du `latest` et ' +
            'elle s\'inscrit au § Registre, soit elle ne fait que porter le vocabulaire et elle se ' +
            'declare dans `lignesHorsCouverture` AVEC SON MOTIF. `--ecrire` ne le fera pas pour toi.',
        );
        return;
      }
      vues.add(String(no));
      if (dec.empreinte !== sha(texte)) {
        bilanCompletude.nonTenues += 1;
        derives.push(
          `D-6 ${d}/${rel}:${no} — LIGNE DECLAREE HORS COUVERTURE, MAIS REECRITE. Le motif ` +
            'd\'exclusion portait sur un TEXTE, pas sur un numero de ligne — il ne repond plus ' +
            'de ce qui est ecrit la.\n' +
            `      motif declare : ${JSON.stringify(dec.motif)}\n` +
            `      exclu         : ${JSON.stringify(dec.extrait ?? '(extrait absent)')}\n` +
            `      aujourd'hui   : ${JSON.stringify(texte.slice(0, 140))}\n` +
            '      A RETRIER A LA MAIN : l\'exclusion est revoquee tant qu\'elle n\'est pas remotivee.',
        );
        return;
      }
      bilanCompletude.declarees += 1;
    });
    for (const no of Object.keys(declaresFichier)) {
      if (vues.has(no)) continue;
      const texte = lignes[Number(no) - 1];
      derives.push(
        `D-7 ${d}/${rel}:${no} — DECLARATION HORS COUVERTURE PERIMEE. ` +
          (texte === undefined
            ? `Le fichier ne compte que ${lignes.length} ligne(s) : l'exclusion pointe dans le vide.`
            : 'La ligne ne porte plus le motif — l\'exclusion ne couvre plus rien.') +
          '\n' +
          `      motif declare : ${JSON.stringify(dec2Motif(declaresFichier[no]))}\n` +
          '      A RETIRER ou a REMOTIVER a la main : une exclusion muette est une dette.',
      );
    }
  }
  for (const rel of Object.keys(declarations)) {
    if (meta.couverts[rel] === undefined && meta.horsCouverture?.[rel] === undefined) {
      derives.push(
        `D-7 ${d}/${rel} — des lignes sont declarees hors couverture dans un fichier qui n'est ` +
          'NI couvert NI declare hors couverture. La declaration ne repond de rien : la retirer, ' +
          'ou couvrir le fichier.',
      );
    }
  }

  if (ecrire) {
    // RE-ANCRAGE DES EXCLUSIONS — POSITION SEULE, JAMAIS CREATION. Quand une ligne exclue a
    // simplement glisse (insertion au-dessus), son texte est INTACT : on deplace la declaration.
    // Si le texte a change, on ne touche a rien — D-6 doit rester rouge et se retrier a la main.
    for (const rel of Object.keys(declarations)) {
      const abs = path.join(racineDepot, rel);
      if (!fs.existsSync(abs)) continue;
      const lignes = fs.readFileSync(abs, 'utf8').split('\n');
      const frais = {};
      for (const [no, dec] of Object.entries(declarations[rel])) {
        const surAncre = Number(no) - 1 < lignes.length && sha(lignes[Number(no) - 1]) === dec.empreinte;
        const idx = surAncre ? Number(no) - 1 : lignes.findIndex((l) => sha(l) === dec.empreinte);
        if (idx !== -1 && idx + 1 !== Number(no)) {
          deplacesExclusions.push(`${d}/${rel} : ${no} -> ${idx + 1} (texte inchange)`);
          frais[String(idx + 1)] = dec;
        } else {
          frais[no] = dec;
        }
      }
      declarations[rel] = Object.fromEntries(
        Object.entries(frais).sort((a, b) => Number(a[0]) - Number(b[0])),
      );
    }
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
  if (deplacesExclusions.length > 0) {
    console.log('  EXCLUSIONS RE-ANCREES — meme texte exclu, autre ligne :');
    for (const d of deplacesExclusions) console.log(`    ${d}`);
  }
  console.log('  AUCUNE EXCLUSION CREEE : `--ecrire` ne trie pas a ta place (cliquet de D-5).');
  console.log(
    `  AUCUNE CLE DE PROSE ECRITE : ${proseReinscrites.length} cle(s) de prose ont derive et ` +
      'RESTENT rouges (D-8). Une phrase qui decrit l\'instrument se relit et se re-inscrit A LA',
  );
  console.log('     MAIN — c\'est le seul endroit ou l\'instrument pourrait avaliser son propre mensonge.');
  for (const c of proseReinscrites) console.log(`     ${c}`);
  if (reinscrits.length > 0) {
    console.log('  🛑 RE-INSCRITS — LE TEXTE A CHANGE. Relire chacun : c\'est le seul endroit ou');
    console.log('     une reecriture FAUSSE se fait avaliser par le registre.');
    for (const r of reinscrits) console.log(`    ${r}`);
  }
  process.exit(0);
}

console.log(`${NOM} — inscrit le ${reg.inscritLe} · ${reg.entrees.length} enonces enumeres`);
for (const c of constats) console.log(`  ${c}`);
console.log(
  `  balayage de completude : ${bilanCompletude.motif} ligne(s) du motif dans les fichiers ` +
    `couverts · ${bilanCompletude.inscrites} inscrite(s) · ${bilanCompletude.declarees} ` +
    `declaree(s) hors couverture · ${bilanCompletude.nonTenues} NON TENUE(S)`,
);
if (derives.length === 0) {
  console.log(`${NOM} — CONFORME : chaque enonce inscrit est a sa place, aucun n'a ete ajoute, et`);
  console.log('  chaque ligne du motif d\'un fichier couvert est tenue par une empreinte.');
  console.log('  🛑 RAPPEL H-1 — CE QUE CE CONFORME NE DIT PAS. Le balayage ne voit que les lignes');
  console.log('  QUI PORTENT LE MOTIF. Une implication neuve ecrite sans aucun de ces mots lui est');
  console.log('  invisible : au 6e passage, 7 des 22 enonces releves par le gate etaient dans ce');
  console.log('  cas. La completude est celle du MOTIF, pas celle du SENS. La lecture du § Registre');
  console.log('  reste dans la boucle, et ce controle ne la remplace pas.');
  process.exit(0);
}
console.log('');
for (const d of derives) console.log(`  ${d}`);
console.log('');
console.log(`${NOM} — ${derives.length} derive(s). Le registre est PERIME tant qu'elles subsistent.`);
process.exit(1);
