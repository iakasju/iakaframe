// Garde anti-derive « jumeaux HTML » : un .md et sa doc HTML ne peuvent plus diverger
// SUR LE MODELE iakadoc sans que quelque chose rougisse.
//
// ─────────────────────────── POURQUOI CETTE GARDE ───────────────────────────
//
// Le modele de la memoire humaine a change au lot 3 : on est passe du modele PLAT
// (« un espace par projet -> une vue d'ensemble -> une sous-page par fichier ») au modele
// ARBORESCENT `iakadoc` (sections numerotees `00`..`90`, `90 · Notes` zone humaine).
//
// Les .md ont ete propages. Les documents HTML, eux, ont ete OUBLIES -- trois fois de suite,
// aux lots 3, 4 et 4 bis. Ce n'etait pas un cas isole mais une CATEGORIE : rien, dans le depot,
// ne reliait un .md a son pendant HTML. Un lecteur humain qui ouvrait `methode-de-travail.html`
// ou `iakaframe-chapeau.html` lisait donc un modele PERIME, sans la moindre trace d'alerte --
// le defaut SILENCIEUX, exactement comme le cache figé que garde `RENDER_VERSION`.
//
// ─────────────────────────── CE QU'ON A CHOISI, ET POURQUOI ───────────────────────────
//
// Deux options etaient sur la table : (1) un GENERATEUR .md -> .html, (2) une GARDE.
//
// On a retenu la GARDE, deliberement. Un generateur serait FAUX ici : ces HTML ne sont pas le
// rendu de leur .md. `methode-de-travail.html` fait 2 800 lignes pour un .md de 770 -- c'est un
// document de presentation a la charte NaonEdge, ecrit a la main, avec ses propres sections,
// ses cartes et sa navigation. `iakaframe-chapeau.html` et `iakaframe-skills.html` n'ont meme
// pas de .md jumeau. Generer les ecraserait : on remplacerait une dette de synchronisation par
// une PERTE de travail de design -- et le design n'appartient pas a ce lot.
//
// La garde, elle, cible ce qui a REELLEMENT diverge : le VOCABULAIRE DU MODELE. Elle ne compare
// pas des contenus (impossible : granularites differentes), elle epingle deux choses verifiables :
//
//   R1 — FORMULATIONS BANNIES : le vocabulaire du modele PLAT est interdit dans TOUT le corpus
//        documentaire (.md ET .html). Le motif est lexical, donc opposable : on cite le
//        fichier:ligne fautif et le remplacement attendu.
//   R2 — PARITE DE MODELE : tout document qui DECRIT la memoire humaine (il nomme le modele ou
//        la skill produit) DOIT porter les marqueurs de l'arborescence. Decrire sans arborescence
//        = decrire le modele plat sans le dire.
//
// ELLE MORD DANS LES DEUX SENS : ecrire du modele plat rougit R1 ; parler du modele sans son
// arborescence rougit R2. Un futur document HTML qui parle de memoire humaine est couvert
// AUTOMATIQUEMENT -- c'est la categorie qui est tenue, pas les trois fichiers du jour.
//
// RITUEL EN CAS D'ECHEC : ce n'est pas un test a faire taire. Si le modele iakadoc evolue,
// on met a jour les motifs ci-dessous ET tous les documents, DANS LE MEME LOT.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..', '..'); // racine du depot iakaframe

// Corpus documentaire balaye : racine du depot (les .md et .html de presentation) + la
// bibliotheque (personas / skills). DEUX exclusions DELIBEREES :
//   • `specs/instructions/**` — une instruction est un document DATE, temoin de son epoque :
//     elle a le droit de citer l'ancien modele, c'est meme ce qui la rend relisible.
//   • `frames/**` — les frames AUTRES que le default ne sont pas de ce perimetre (frontiere
//     contractuelle CONTENU/INFRASTRUCTURE : elles relevent du constructeur de frame). Elles
//     portent bien le modele plat ; le signaler est le geste juste, le corriger ne l'est pas.
const SCAN_DIRS = [
  { dir: REPO, recursive: false },
  { dir: path.join(REPO, 'library'), recursive: true },
];
const EXTS = new Set(['.md', '.html']);

function listDocs() {
  const out = [];
  for (const { dir, recursive } of SCAN_DIRS) {
    const walk = (d) => {
      let entries;
      try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
      for (const e of entries) {
        if (e.name.startsWith('.') || e.name === 'node_modules') continue;
        const p = path.join(d, e.name);
        if (e.isDirectory()) { if (recursive) walk(p); continue; }
        if (EXTS.has(path.extname(e.name))) out.push(p);
      }
    };
    walk(dir);
  }
  return out.sort();
}

const rel = (p) => path.relative(REPO, p).split(path.sep).join('/');

// ─────────────────── R1 — le vocabulaire du modele PLAT est banni ───────────────────

// Chaque motif = une formulation reellement rencontree dans les documents perimes, avec le
// remplacement attendu. On normalise les apostrophes (’ vs ') et les espaces avant de chercher :
// une variante typographique ne doit pas suffire a passer sous la garde.
const FORMULATIONS_BANNIES = [
  {
    motif: /une vue d'ensemble\s*(?:→|->|&rarr;|&#8594;)\s*une sous-page par fichier/i,
    quoi: 'le modele PLAT « espace -> vue d\'ensemble -> sous-page par fichier »',
    remplacement: 'le modele `iakadoc` : un espace par projet en ARBORESCENCE numerotee 00..90',
  },
  {
    motif: /espace,\s*vue d'ensemble,\s*sous-pages/i,
    quoi: 'l\'enumeration a plat « espace, vue d\'ensemble, sous-pages »',
    remplacement: 'modele `iakadoc` -- un espace par projet en arborescence numerotee 00-90',
  },
  {
    motif: /une sous-page par fichier(?! important)/i,
    quoi: '« une sous-page par fichier » (granularite plate, sans les sections)',
    remplacement: 'une page par doc, RANGEE dans sa section numerotee (10/20/30/40/50/60)',
  },
];

function normalise(txt) {
  return String(txt).replace(/[’‘]/g, "'").replace(/ /g, ' ');
}

test('R1 : le vocabulaire du modele PLAT est banni de tout le corpus documentaire (.md ET .html)', () => {
  const fautes = [];
  for (const file of listDocs()) {
    const lignes = normalise(fs.readFileSync(file, 'utf8')).split('\n');
    lignes.forEach((ligne, i) => {
      for (const b of FORMULATIONS_BANNIES) {
        if (b.motif.test(ligne)) {
          fautes.push(`${rel(file)}:${i + 1} — ${b.quoi}\n      attendu : ${b.remplacement}`);
        }
      }
    });
  }
  assert.deepEqual(fautes, [],
    'Modele PLAT (perime) encore ecrit. Ces documents mentent au lecteur : le modele iakadoc est ' +
    'ARBORESCENT depuis le lot 3.\n    ' + fautes.join('\n    '));
});

// ─────────────────── R2 — qui decrit la memoire humaine porte l'arborescence ───────────────────

// Un document « decrit la memoire humaine » s'il nomme le modele ou la skill produit ET qu'il
// s'engage sur une STRUCTURE. Le declencheur de structure est volontairement etroit --
// « un espace par projet » : c'est LA phrase par laquelle un document prend position sur le
// modele. Citer `AppFlowy` en passant, ou lister la skill dans un catalogue, n'oblige a rien :
// on ne veut pas forcer chaque mention a recopier l'arborescence entiere (ce serait recreer la
// duplication qu'on vient justement de retirer du contrat de corpus).
const DECRIT_LE_MODELE = /iakaframe-appflowy-doc|mod[eè]le\s+`?iakadoc`?/i;
const DECRIT_UNE_STRUCTURE = /espace par projet/i;

// Marqueurs de l'arborescence. On exige DEUX choses, et pas une de plus :
//   • `90` — la ZONE HUMAINE. C'est la garantie non destructive du modele ; un document qui
//     decrit la structure sans elle laisse croire que la publication ecrit partout.
//   • au moins UNE section de contenu (`00`..`60`) — avec `90`, cela suffit a dire « c'est une
//     arborescence numerotee », y compris sous forme abregee « 00-90 » dans une ligne de tableau.
// Pourquoi pas davantage : exiger les huit numeros forcerait chaque catalogue a recopier
// l'arborescence complete. Le modele PLAT, lui, ne porte AUCUN numero -- c'est ce contraste-la
// qui fait mordre la garde, pas l'exhaustivite.
const SECTIONS_CONTENU = [/\b00\b/, /\b10\b/, /\b20\b/, /\b30\b/, /\b40\b/, /\b50\b/, /\b60\b/];
const SECTION_HUMAINE = /\b90\b/;

test('R2 : tout document qui DECRIT la memoire humaine porte les marqueurs de l\'arborescence', () => {
  const fautes = [];
  let examines = 0;

  for (const file of listDocs()) {
    const txt = normalise(fs.readFileSync(file, 'utf8'));
    if (!DECRIT_LE_MODELE.test(txt) || !DECRIT_UNE_STRUCTURE.test(txt)) continue;
    examines++;

    // On regarde la zone qui parle du modele, pas le fichier entier : dans un document long,
    // un « 90 » qui traine ailleurs ne prouverait rien.
    const lignes = txt.split('\n');
    const ancres = [];
    lignes.forEach((l, i) => { if (DECRIT_LE_MODELE.test(l) || DECRIT_UNE_STRUCTURE.test(l)) ancres.push(i); });
    const zones = ancres.map((i) => lignes.slice(Math.max(0, i - 25), i + 25).join('\n'));

    const okHumaine = zones.some((z) => SECTION_HUMAINE.test(z));
    const okContenu = zones.some((z) => SECTIONS_CONTENU.some((re) => re.test(z)));

    if (!okHumaine || !okContenu) {
      fautes.push(`${rel(file)} — decrit la memoire humaine sans son arborescence` +
        (okHumaine ? '' : ' [manque la zone humaine 90]') +
        (okContenu ? '' : ' [manque les sections de contenu 00..60]'));
    }
  }

  // Plancher : sans lui, une garde dont le detecteur cesse de detecter passe au VERT en silence
  // -- exactement le defaut qu'on combat. 6 = les 3 documents historiquement en derive + les
  // fiches de reference (persona, skill-role, capacite, produit) qui, elles, etaient justes.
  assert.ok(examines >= 6,
    `la garde doit examiner au moins 6 documents, ${examines} examine(s) : si ce plancher tombe, ` +
    'c\'est que le detecteur ne detecte plus rien et que la garde ne mord plus');
  assert.deepEqual(fautes, [],
    'Documents decrivant la memoire humaine SANS son arborescence numerotee :\n    ' + fautes.join('\n    '));
});

// ─────────────────── R3 — les jumeaux stricts .md / .html sont apparies ───────────────────
//
// La ou un `<nom>.md` a un `<nom>.html`, ils sont JUMEAUX : ils s'adressent au meme sujet pour
// deux publics. On n'exige pas l'egalite de contenu (le HTML est un document de presentation),
// mais on exige que le HTML ne soit pas MUET sur un sujet que le .md porte comme structurant.

const SUJETS_JUMEAUX = [
  {
    nom: 'memoire humaine (modele iakadoc)',
    // Si le .md porte ces marqueurs, le .html DOIT en porter la trace.
    dansMd: /m[eé]moire humaine/i,
    dansHtml: /m[eé]moire humaine/i,
  },
];

test('R3 : un jumeau HTML n\'est pas MUET sur un sujet structurant de son .md', () => {
  const fautes = [];
  let paires = 0;

  for (const file of listDocs()) {
    if (path.extname(file) !== '.md') continue;
    const jumeau = file.replace(/\.md$/, '.html');
    if (!fs.existsSync(jumeau)) continue;
    paires++;

    const md = normalise(fs.readFileSync(file, 'utf8'));
    const html = normalise(fs.readFileSync(jumeau, 'utf8'));
    for (const s of SUJETS_JUMEAUX) {
      if (s.dansMd.test(md) && !s.dansHtml.test(html)) {
        fautes.push(`${rel(jumeau)} — muet sur « ${s.nom} », que ${rel(file)} porte pourtant`);
      }
    }
  }

  assert.ok(paires >= 1, 'aucune paire .md/.html trouvee : la garde R3 ne mord plus');
  assert.deepEqual(fautes, [],
    'Jumeaux HTML en retard sur leur .md :\n    ' + fautes.join('\n    '));
});
