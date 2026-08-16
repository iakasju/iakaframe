// Gardes de ROUTAGE PROD (G-ROUTE-1 a G-ROUTE-5)
// — specs/instructions/garde-balayante-routage-prod.md (successeur de correctif-routage-prod-vers-charon.md)
//
// POURQUOI CE FICHIER A ETE REFONDU : la version precedente revendiquait de BALAYER, et c'etait
// vrai d'une garde sur trois. G-ROUTE-2 RECITAIT : elle portait les 11 chemins du § 7 de
// l'instruction, recopies en dur (ROUTAGE_A / ROUTAGE_B). Une garde batie sur l'inventaire qu'elle
// controle ne peut PAS dire que l'inventaire est incomplet : elle est verte PAR CONSTRUCTION sur
// tout ce qui n'y figure pas. Trois releves successifs ont ainsi compte 5, puis 3, puis 4
// survivants la ou il y en avait 8 — dont un (doc/index.html) qu'AUCUN releve n'avait jamais vu.
//
// CE QUE CES GARDES BALAIENT (regime permanent, pas instantane) :
//   - G-ROUTE-1  reciprocite PERSONA + reciprocite SKILL, au niveau FICHIER, populations DECOUVERTES ;
//   - G-ROUTE-2  attribution sur les artefacts par-persona, populations DECOUVERTES PAR NOM ;
//   - G-ROUTE-3  contrats deployes ~/.claude/agents (surface que le runner LIT) ;
//   - G-ROUTE-4  AFFECTATION role/skill, ANCREE SUR LE CANON LU A L'EXECUTION, sur TOUT le depot.
//
// CE QU'ELLES NE VOIENT PAS — et c'est G-ROUTE-5 qui le DIT :
//   toutes exigent un NOM DE PERSONA (`helm`, `charon`) ou un NOM DE SKILL (`iakaframe-*`). Une
//   vitrine redigee en LANGAGE DE ROLE — la convention de la doc publique du depot, « des roles,
//   pas des noms d'agents » — ne porte aucun de ces jetons : elle est invisible de l'INTEGRALITE du
//   dispositif, quelle que soit la qualite de l'inventaire. README.md en est l'exemple vivant.
//   Une garde honnete dit aussi ce qu'elle ne voit pas : c'est le registre des ANGLES MORTS.
//
// QUATRE ARBITRAGES DE COORDINATION, PRIS SOUS AUTONOMIE DELEGUEE — ET REVERSIBLES :
//   Le decideur a arbitre D4, D5, D11 et D14. Il n'a PAS enonce les quatre points ci-dessous ; ils
//   ont ete tranches par la COORDINATION, en s'appuyant sur D5, D6, D7 et D11 qui sont de lui. Ils
//   sont inscrits ici COMME TELS, et se reprennent en supprimant l'entree ou la constante
//   concernee.
//   (a) D6 niveau B mordait sur LE CANON (21 lignes rouges, ZERO defaut) -> EXEMPTION PERISSABLE
//       du canon de Helm et de son golden, scopee au seul niveau B. Motif complet a l'entree.
//   (b) La clause SYMETRIQUE de D7 (« charon <- surveillance ») -> ABANDONNEE, apres MESURE :
//       0 capture sur 8, 6 faux positifs. Motif complet au bloc « SENS DU PREDICAT ».
//   (c) Le volet SKILLS de D8 mordait sur BACKLOG.md, qui n'est PAS un catalogue mais un backlog
//       CITANT UN CHEMIN DE FIXTURE -> EXEMPTION PERISSABLE, scopee au seul volet skills, et qui
//       PERIRA D'ELLE-MEME a la cloture de GUI-VENDOR-CHARON. Motif complet a l'entree.
//   (d) Le balayage descendait dans les ARTEFACTS DE BUILD GITIGNORES (cli/_bundled/, fabrique par
//       le prepack de publication) -> LE BALAYAGE NE DESCEND PLUS DANS CE QUE GIT IGNORE. Motif
//       complet au bloc « FRONTIERE GIT-IGNORE ». Se reprend en supprimant cette frontiere.
//
// DEUX REGISTRES, DEUX PEREMPTIONS INVERSES — le mecanisme anti-oubli du lot :
//   - EXEMPTIONS   : ce que la garde accepte de ne pas corriger. Une exemption DEVENUE INUTILE
//                    (le site n'est plus rouge) FAIT ECHOUER la garde. Elle ne peut pas pourrir.
//   - ANGLES_MORTS : ce que la garde ne peut pas voir. Un angle mort DEVENU COUVERT (un predicat
//                    l'atteint) FAIT ECHOUER la garde. Il ne peut pas pourrir non plus.
//   Motif : au lot de scission, une exclusion a ete PRONONCEE DANS UN TEXTE (CA-20(e)) et rien ne
//   l'a EXECUTEE. Elle n'a jamais ete opposable — elle a seulement ete perdue, et l'oubli s'est
//   repete. Une exclusion qui ne s'execute pas n'est pas une exclusion.
//
// LIGNE LOGIQUE (rectifie) : les modeles Open WebUI sont des JSON dont tout le prompt systeme tient
// sur UNE SEULE ligne physique (`\n` echappes) ; un comptage en lignes physiques y rend 1 la ou il
// faut relire le fichier entier. On desechappe donc `\n` — mais UNIQUEMENT pour les `.json`. La
// version precedente le faisait pour TOUS les fichiers, ce qui DECALAIT les numeros de ligne de
// toute prose contenant un `\n` litteral : inacceptable pour une garde qui doit rendre des
// `chemin:ligne` exacts sur tout le depot.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)); // cli/test
const REPO = path.resolve(HERE, '..', '..');

// --- Perimetre du balayage ----------------------------------------------------------------------
// EXCLUS = frontiere STRUCTURELLE du scan (D9, existant conserve tel quel). Ce ne sont pas des
// exemptions au sens de D5 : ils ne portent aucun jugement sur un contenu.
const EXCLUS = ['.git', 'node_modules', 'frames/releases', 'specs/instructions'];

// ------------------------------------------------------------------------------------------------
// FRONTIERE GIT-IGNORE (d) — ARBITRAGE DE COORDINATION, PRIS SOUS AUTONOMIE DELEGUEE.
// PAS un feu vert du decideur. REVERSIBLE s'il le reprend, au meme titre que (a), (b) et (c).
// Le decideur a arbitre D4, D5, D11 et D14 ; il n'a PAS enonce celui-ci. Il s'APPUIE sur D6 et D7,
// qui sont de lui.
// ------------------------------------------------------------------------------------------------
// LE FAIT, MESURE : `cli/scripts/bundle.js` est cable en `prepack` ET `prepublishOnly`
// (cli/package.json:21-22). Un `npm pack` ou un `npm publish` le declenche TOUT SEUL et recopie
// library/, kits/, methods/ dans `cli/_bundled/` — repertoire GITIGNORE (cli/.gitignore:3), donc
// PERSISTANT : l'artefact ne part pas au commit, et la suite reste rouge jusqu'a suppression
// manuelle. Le balayage y voyait alors `cli/_bundled/library/personas/helm.md`, COPIE OCTET POUR
// OCTET du canon, et rendait 11 lignes rouges pour ZERO defaut — l'exemption (a) ne la couvre pas,
// sa portee nommant le chemin LITTERAL `library/personas/helm.md` et non ses copies. Mesure sur
// arbre extrait : main -> 3 tests / 3 pass ; branche -> 5 tests / 4 pass / 1 FAIL. Regression.
//
// LES TROIS ISSUES NE SE VALENT PAS, ET C'EST LA DOCTRINE DU LOT QUI TRANCHE :
//   - ajouter `cli/_bundled` a EXCLUS serait RE-ENUMERER — le defaut meme que ce lot abolit. Ca ne
//     couvrirait que CE build ; le prochain artefact gitignore repasserait dessous, et on aurait
//     ecrit une QUATRIEME liste oubliee ;
//   - elargir la portee de (a) aux copies traiterait le symptome SUR UN SEUL FICHIER, en laissant
//     passer toute autre copie d'un autre canon ;
//   - IGNORER CE QUE GIT IGNORE est la seule voie ANTI-ENUMERANTE : la garde TIRE SON PERIMETRE
//     D'UNE SOURCE DE VERITE au lieu de le reciter — le geste exact de D7, qui tire son attente du
//     canon plutot que de la coder en dur. Noter que EXCLUS contient deja `.git` et `node_modules`,
//     TOUS DEUX GITIGNORES : cette frontiere n'ajoute pas une regle, elle REMPLACE UNE ENUMERATION
//     PARTIELLE PAR SA SOURCE.
//
// DEUX EXIGENCES DE FORME, TENUES :
//   1. ON EXCLUT CE QUE GIT *IGNORE*, PAS CE QUE GIT NE *SUIT* PAS. `git ls-files --others
//      --ignored --exclude-standard` ne rend QUE les chemins ignores. Un fichier NEUF, non encore
//      ajoute (untracked mais NON ignore), reste PLEINEMENT BALAYE — sinon on rouvrirait un angle
//      mort par la fenetre en croyant fermer la porte.
//   2. REPLI GRACIEUX SI GIT EST ABSENT, ET IL NE L'EST PAS QUE EN THEORIE : le gate qualite rejoue
//      sur extraction `git archive | tar -x`, c'est-a-dire dans un arbre SANS `.git`. Si la regle
//      exigeait git, sa reproduction casserait et le correctif deviendrait invisible du gate.
//      L'absence de git DEGRADE donc PROPREMENT — le balayage continue, sur EXCLUS SEUL — et la
//      garde LE DIT sur stdout. Un vert obtenu en mode degrade qui ne se declare pas est exactement
//      le « vert qui ne prouve rien » reproche a vendor-check.
//
// POURQUOI CETTE ENTREE N'EST PAS DANS `EXEMPTIONS` : elle porte ses TROIS champs au sens de D5,
// mais elle n'est PAS perissable au sens de D5 — et l'y mettre serait un PIEGE. La peremption D5
// mesure une ROUGEUR RESIDUELLE sur une PORTEE DE CHEMINS FIXES ; ici la portee est DYNAMIQUE et
// VIDE PAR CONSTRUCTION dans un arbre propre (aucun build en cours). L'entree serait donc declaree
// MORTE a la seconde ou on l'ecrit, et la garde exigerait de supprimer la frontiere qu'elle vient
// de poser. Une exemption pardonne un CONTENU juge ; une frontiere dit ou le scan S'ARRETE — c'est
// la nature d'EXCLUS, pas celle d'EXEMPTIONS. Elle est donc rangee avec EXCLUS, et son triplet est
// CONTROLE (assert plus bas), pour qu'aucune frontiere ne soit posee sans motif ecrit.
const FRONTIERE_GIT_IGNORE = {
  motif: 'un artefact GITIGNORE n\'est pas du contenu du depot : c\'est une SORTIE, derivee et '
    + 'jamais versionnee. Une garde qui verifie ce que le depot DIT n\'a pas a juger ce qu\'un '
    + 'build FABRIQUE. Cas mesure : le prepack cli/scripts/bundle.js (cable en prepack ET '
    + 'prepublishOnly, cli/package.json:21-22) copie le canon dans cli/_bundled/ et y fait rendre '
    + '11 lignes rouges pour ZERO defaut, de facon PERSISTANTE puisque l\'artefact ne part pas au '
    + 'commit. Voie retenue CONTRE les deux autres parce qu\'elle est la seule qui ne RE-ENUMERE '
    + 'pas : le perimetre est TIRE de git (source de verite, D7) au lieu d\'etre recite (D6).',
  levee: 'REVERSIBLE A TOUT MOMENT sur reprise du decideur : supprimer cette frontiere restaure le '
    + 'balayage integral, y compris dans les artefacts de build. LEVEE MOTIVEE : le jour ou une '
    + 'garde devrait justement controler un artefact GENERE (p. ex. verifier que le tarball publie '
    + 'porte le bon routage), cette frontiere devrait etre levee POUR CETTE GARDE-LA — et non '
    + 'globalement.',
  portee: 'DYNAMIQUE, jamais enumeree : tout chemin que `git ls-files --others --ignored '
    + '--exclude-standard --directory` rend depuis la racine de l\'arbre mesure. Ce que git IGNORE, '
    + 'jamais ce que git ne SUIT pas : un fichier neuf non encore ajoute reste balaye. Sans DEPOT '
    + 'mais avec le BINAIRE git, la portee est la MEME, lue via un GIT_DIR jetable (regime SANS '
    + 'DEPOT). Sans le BINAIRE git, la portee est VIDE et le balayage se rabat sur EXCLUS seul, EN '
    + 'LE DISANT (regime DEGRADE).',
};
assert.ok(FRONTIERE_GIT_IGNORE.motif && FRONTIERE_GIT_IGNORE.levee && FRONTIERE_GIT_IGNORE.portee,
  'frontiere incomplete : motif, levee et portee sont les TROIS champs obligatoires (D5) — une '
  + 'frontiere de scan posee sans motif ecrit est une enumeration silencieuse de plus');

// ------------------------------------------------------------------------------------------------
// TROIS REGIMES, PARCE QUE « PAS DE DEPOT » N'EST PAS « PAS DE GIT ».
// ------------------------------------------------------------------------------------------------
// Le repli avait ete pense pour un arbre extrait par `git archive | tar -x` — donc SANS `.git`. Mesure
// faite : dans cet arbre, `bundle.js` est rejoue, et un repli sur EXCLUS SEUL y laisse revenir les 11
// lignes rouges. Le repli prescrit rendait donc le correctif INOPERANT DANS L'EXACTE SITUATION DE
// MESURE DU GATE — c'est-a-dire invisible de qui doit le verifier.
//
// LA PREMISSE ETAIT FAUSSE, ET C'EST TOUT : dans cet arbre, git LE BINAIRE est present (c'est lui qui
// a produit l'extraction) ; seul le DEPOT manque. Or les `.gitignore` sont VERSIONNES : ils sont DANS
// le tarball. On demande donc a git lui-meme d'evaluer SES PROPRES regles, via un GIT_DIR jetable
// monte HORS de l'arbre mesure (aucun octet ecrit dans l'arbre : une garde ne mute jamais ce qu'elle
// mesure). LA COUVERTURE EST IDENTIQUE AU BIT PRES — meme commande, memes regles, meme critere
// « ignore et non non-suivi ». Seul change le CHEMIN D'ACCES a la reponse. Ce n'est pas un
// elargissement de perimetre : c'est la correction d'une premisse.
//
// Le regime DEGRADE — EXCLUS SEUL, tel que prescrit — subsiste pour le cas ou le BINAIRE git manque
// vraiment. Il se DECLARE bruyamment : un vert degrade qui ne se declare pas est un vert qui ne
// prouve rien.
//
// NOMINAL exige en outre que la racine git soit L'ARBRE MESURE : une extraction posee par megarde
// SOUS un autre depot ferait autrement repondre le depot PARENT, avec des chemins relatifs a SA
// racine — un perimetre juste en apparence et faux en fait. Dans ce cas on bascule en SANS DEPOT.
const ARGS_IGNORES = ['ls-files', '-z', '--others', '--ignored', '--exclude-standard', '--directory'];

function lancerGit(args) {
  try {
    const r = spawnSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    if (r.error) return { ok: false, motif: `binaire git injoignable (${r.error.code || r.error.message})` };
    if (r.status !== 0) {
      return { ok: false, motif: String(r.stderr || '').trim().split('\n')[0] || `code de sortie ${r.status}` };
    }
    return { ok: true, stdout: String(r.stdout) };
  } catch (e) {
    return { ok: false, motif: `binaire git injoignable (${e.code || e.message})` };
  }
}

// `-z` : separateur NUL, donc AUCUN echappement des chemins non-ASCII (le depot en porte).
// Les repertoires entierement ignores reviennent avec un `/` final, qu'on normalise.
function decouperIgnores(stdout) {
  return stdout.split('\0').map((s) => s.replace(/\/+$/, '')).filter(Boolean);
}

function memeArbre(a, b) {
  try { return fs.realpathSync(a) === fs.realpathSync(b); } catch { return false; }
}

function chargerIgnoresGit() {
  // 1. NOMINAL — un depot git dont la racine EST l'arbre mesure.
  const top = lancerGit(['-C', REPO, 'rev-parse', '--show-toplevel']);
  if (top.ok && memeArbre(top.stdout.trim(), REPO)) {
    const r = lancerGit(['-C', REPO, ...ARGS_IGNORES]);
    if (r.ok) {
      return { actif: true, regime: 'NOMINAL', detail: 'depot git, racine == arbre mesure',
        chemins: decouperIgnores(r.stdout) };
    }
  }
  // 2. SANS DEPOT — git est la, le depot n'y est pas (ou sa racine n'est pas l'arbre mesure).
  //    GIT_DIR jetable monte HORS de l'arbre ; les `.gitignore` VERSIONNES de l'arbre font foi.
  let shim = null;
  try {
    shim = fs.mkdtempSync(path.join(os.tmpdir(), 'g-route-ignore-'));
    if (lancerGit(['init', '--bare', '-q', shim]).ok) {
      const r = lancerGit(['--git-dir', shim, '--work-tree', REPO, '-C', REPO, ...ARGS_IGNORES]);
      if (r.ok) {
        return { actif: true, regime: 'SANS DEPOT',
          detail: `aucun depot sur l'arbre mesure (${top.ok ? 'racine git != arbre mesure' : top.motif})`
            + ' — regles lues par git via un GIT_DIR jetable, arbre NON modifie',
          chemins: decouperIgnores(r.stdout) };
      }
    }
  } catch { /* le repli 3 traite le cas */ } finally {
    if (shim) { try { fs.rmSync(shim, { recursive: true, force: true }); } catch { /* ignore */ } }
  }
  // 3. DEGRADE — le BINAIRE git manque : EXCLUS SEUL, et on le crie.
  return { actif: false, regime: 'DEGRADE', detail: top.motif || 'git indisponible', chemins: [] };
}

const IGNORES_GIT = chargerIgnoresGit();
const IGNORES_SET = new Set(IGNORES_GIT.chemins);

// La garde DIT dans quel regime elle tourne — a chaque execution, vert compris. Un perimetre qui
// change en silence selon la disponibilite de git est un vert qui ne prouve rien.
const REGIME_PERIMETRE = IGNORES_GIT.actif
  ? `[G-ROUTE] perimetre ${IGNORES_GIT.regime} (${IGNORES_GIT.detail}) : EXCLUS `
    + `(${EXCLUS.length} entree(s)) + ce que GIT IGNORE (${IGNORES_GIT.chemins.length} entree(s) `
    + 'racine). Les fichiers NEUFS non encore ajoutes restent balayes : le critere est IGNORE, '
    + 'PAS non-suivi.'
  : `[G-ROUTE] *** MODE DEGRADE *** : ${IGNORES_GIT.detail}. Le balayage se rabat sur EXCLUS SEUL `
    + `(${EXCLUS.length} entree(s)) : un artefact de build present dans l'arbre SERA balaye, et un `
    + 'vert obtenu ici ne prouve RIEN sur les chemins gitignores.';
console.log(REGIME_PERIMETRE);

function estIgnoreParGit(rel) {
  if (!IGNORES_GIT.actif) return false;
  const p = rel.split(path.sep).join('/');
  if (IGNORES_SET.has(p)) return true;
  // Un ancetre ignore ignore toute sa descendance (cas `cli/_bundled/`).
  for (let i = p.indexOf('/'); i !== -1; i = p.indexOf('/', i + 1)) {
    if (IGNORES_SET.has(p.slice(0, i))) return true;
  }
  return false;
}

// EXEMPTIONS (D5 + D9) — chacune porte ses TROIS champs obligatoires : motif, levee, portee.
// PEREMPTION : une exemption dont la portee n'est PLUS rouge est MORTE -> la garde qu'elle exempte
// devient ROUGE et le seul remede est de SUPPRIMER l'entree. C'est la clause qui interdit l'oubli
// n° 3. `garde` = PORTEE DE REGISTRE : « * » vaut pour tout le dispositif, une valeur nommee ne
// vaut que pour la garde citee. Une exemption perit donc DANS LA GARDE QU'ELLE EXEMPTE, mesuree
// avec LE PREDICAT DE CETTE GARDE — une exemption de niveau B ne se mesure pas a l'affectation.
const EXEMPTIONS = [
  {
    garde: '*',
    motif: 'traces datees APPEND-ONLY (F25) : les reecrire falsifierait le journal. Exacte meme '
      + 'nature que specs/instructions/, deja exclu structurellement.',
    levee: 'AUCUNE — permanent, par nature.',
    portee: ['specs/etat-des-lieux.md', 'specs/etat-des-lieux.html', 'specs/.iakaframe-journal.json'],
  },
  {
    garde: '*',
    motif: 'documentent le MIROIR GELE StefFrame2 (F24) : les corriger les ferait MENTIR sur '
      + "l'artefact qu'ils decrivent. D4 du lot de routage, etendu ici au jumeau .md qui n'y etait "
      + 'pas nomme.',
    levee: 'ticket RESYNC-SF2 (resync-stefframe2-miroir-live.md) — a la resynchronisation du miroir.',
    portee: ['docs/guide-stefframe2.md', 'docs/guide-stefframe2.html'],
  },
  {
    // ------------------------------------------------------------------------------------------
    // ARBITRAGE DE COORDINATION, PRIS SOUS AUTONOMIE DELEGUEE — PAS un feu vert du decideur.
    // REVERSIBLE si le decideur le reprend. Le decideur a arbitre D4, D5, D11 et D14 ; il n'a PAS
    // enonce celui-ci. Il s'APPUIE sur D5 et D11, qui sont de lui.
    // ------------------------------------------------------------------------------------------
    // LE FAIT : D6 etend la decouverte du niveau B a « tout fichier nomme helm.{md,json} ». La
    // population passe de 2 artefacts de kit a 4, en absorbant LE CANON et son golden derive. La
    // regle du niveau B (« toute ligne portant une notion de traversee doit nommer Charon ») y rend
    // 21 lignes rouges dont ZERO defaut — et F20 cite NOMMEMENT agents-golden/helm.md:20 comme faux
    // positif LEGITIME (cause « cesure de ligne », Charon etant a :19).
    //
    // LES TROIS ISSUES NE SE VALENT PAS : restreindre la population reintroduirait une enumeration
    // partielle (CONTRE D6 — soigner le mal par le mal) ; relacher la regle perdrait de la
    // couverture reelle pour un probleme qui N'EST PAS de couverture. Reste l'exemption, et elle
    // n'est pas dangereuse ICI PRECISEMENT : D5 la rend PERISSABLE. Le « la nouvelle liste
    // oubliee » que redoute R3 est EXACTEMENT ce que D5 a ete concu pour empecher. On utilise le
    // mecanisme qu'on vient de se donner plutot que de le contourner.
    garde: 'G-ROUTE-2/B',
    motif: 'UNE PERSONA DE REFERENCE DECRIT UN ROLE AU LIEU DE L\'ATTRIBUER. Le niveau B est une '
      + "regle d'ATTRIBUTION : elle vaut pour un artefact qui ADRESSE la traversee (les prompts et "
      + 'modeles de kit, ou « Helm » est une revendication). Le CANON de Helm — library/personas/'
      + 'helm.md — et son GOLDEN derive cli/test/fixtures/agents-golden/helm.md ne revendiquent '
      + 'rien : ils DECRIVENT le poste, y compris en disant ce que Helm ne fait PLUS (« il ne '
      + 'bascule ni ne rollback »), ce que CA-12 du lot de scission a EXIGE de conserver. Applique '
      + 'la, la regle rend 21 lignes rouges pour ZERO defaut, dont celle que F20 declare elle-meme '
      + 'innocente (golden helm.md:20, Charon etant a :19). Atteindre le vert exigerait de REFLOWER '
      + 'INTEGRALEMENT le canon — sur des lignes comme helm.md:48 (« Recoit : rien, et c\'est le '
      + "point. Il n'attend ni version, ni feu vert, ni demande »), l'exigence n'a AUCUN sens "
      + 'semantique. C\'est precisement le cout que D11 a refuse de payer.',
    levee: 'AUTOMATIQUE par la peremption D5 — si la portee cesse d\'etre rouge au niveau B, '
      + "l'entree est MORTE et la garde le dit. LEVEE MANUELLE : le jour ou le niveau B est remplace "
      + "par un predicat capable de distinguer DECRIRE d'ATTRIBUER (le present prédicat est lexical, "
      + 'D1 le voudrait semantique), l\'exemption tombe d\'elle-meme. REVERSIBLE A TOUT MOMENT sur '
      + 'reprise du decideur : supprimer cette entree restaure le comportement de D6 a la lettre.',
    portee: ['library/personas/helm.md', 'cli/test/fixtures/agents-golden/helm.md'],
  },
  {
    // ------------------------------------------------------------------------------------------
    // ARBITRAGE DE COORDINATION (c), PRIS SOUS AUTONOMIE DELEGUEE — PAS un feu vert du decideur.
    // REVERSIBLE s'il le reprend, au meme titre que (a) et (b). Le decideur a arbitre D4, D5, D11
    // et D14 ; il n'a PAS enonce celui-ci.
    // ------------------------------------------------------------------------------------------
    // LE FAIT, ET IL N'EST PAS CELUI QU'ON CROIT. Le message rendu est :
    //   « BACKLOG.md -> nomme iakaframe-surveillance mais JAMAIS iakaframe-deploiement (skills) »
    // Le SENS est INVERSE d'une lacune d'inventaire : BACKLOG.md:32 nomme le chemin
    // `skills/iakaframe-surveillance/SKILL.md` comme une FIXTURE MANQUANTE de l'entree
    // GUI-VENDOR-CHARON — pas comme une entree de catalogue. Le diagnostic « omission de niveau
    // fichier » porte au § 14.1 du releve etait INEXACT ; il est corrige ici plutot que reconduit.
    garde: 'G-ROUTE-1/skills',
    motif: 'MOTIF 1 — FAUX POSITIF DE PORTEE, et c\'est le motif PRINCIPAL. D8 a ete concu sur '
      + 'F10/F16, c\'est-a-dire sur les CATALOGUES qui ignorent l\'existence de la skill nee de la '
      + 'scission. BACKLOG.md N\'EST PAS UN CATALOGUE : c\'est un backlog qui CITE UN CHEMIN DE '
      + 'FICHIER (`skills/iakaframe-surveillance/SKILL.md`, :32), au titre des 4 fixtures que le '
      + 'depot frere n\'a pas encore vendorees. Le « remede d\'une ligne » consisterait a inserer '
      + '`iakaframe-deploiement` ARTIFICIELLEMENT, pour satisfaire une garde et non pour dire '
      + 'quelque chose de vrai — c\'est precisement le cout que D11 a refuse de payer, et que '
      + 'l\'arbitrage (b) vient d\'ecarter sur mesure. '
      + 'MOTIF 2 — SUBORDONNE, MAIS REEL : le fichier est en cours de modification par le decideur '
      + '(+75/-16 sur feat/sauvegarde-portefeuille, mesure et non suppose) ; y ecrire creerait un '
      + 'conflit avec son travail. CE MOTIF SEUL N\'AURAIT PAS JUSTIFIE UNE EXEMPTION — il aurait '
      + 'justifie un DIFFERE. C\'est le motif 1 qui fonde l\'exemption ; le motif 2 explique '
      + 'seulement pourquoi on ne la contourne pas des maintenant.',
    levee: 'AUTOMATIQUE par la peremption D5, et elle est DATABLE : l\'exemption tombe le jour ou '
      + 'BACKLOG.md cesse de citer un chemin portant un nom de skill — concretement A LA CLOTURE DE '
      + 'GUI-VENDOR-CHARON, quand l\'entree :32 et sa liste de fixtures disparaitront du backlog. '
      + 'L\'exemption PERIRA DONC D\'ELLE-MEME, et D5 fera crier la garde a ce moment-la : c\'est le '
      + 'mecanisme, pas un contournement. LEVEE MANUELLE : le jour ou le volet skills sait '
      + 'distinguer un CHEMIN DE FICHIER cite d\'un jeton de skill ATTRIBUE, l\'entree tombe '
      + 'd\'elle-meme. REVERSIBLE A TOUT MOMENT sur reprise du decideur : supprimer cette entree '
      + 'restaure le comportement de D8 a la lettre.',
    portee: ['BACKLOG.md'],
  },
];

// ANGLES MORTS (D14) — le MIROIR EXACT des exemptions. Une entree declare un site, ou une CLASSE de
// sites, que le dispositif N'ATTEINT PAS, avec les TROIS memes champs. Sa peremption est INVERSEE :
// un angle mort DEVENU COUVERT est MORT -> G-ROUTE-5 devient ROUGE, remede = supprimer l'entree.
// Une entree d'angle mort ne nomme pas des sites : elle nomme UNE RAISON DE NE PAS LES VOIR. Le
// jour ou la raison tombe, la garde crie.
// `sonde` = ce qu'on soumet aux predicats pour verifier que l'aveuglement TIENT ENCORE.
const ANGLES_MORTS = [
  {
    motif: 'F28 + F31 — le fichier ne porte AUCUN nom de persona ni de skill (0 « Helm », 0 '
      + '« Charon ») : il decrit la chaine en LANGAGE DE ROLE, convention de la doc publique. '
      + "G-ROUTE-4 et le volet skills de G-ROUTE-1 exigent l'un ou l'autre jeton. Aucun predicat "
      + 'actuel ne peut le voir. Et il n\'existe AUCUNE chaine canonique sur laquelle un predicat '
      + 'de role pourrait s\'ancrer : le canon porte `key` et `label`, la doc emploie une '
      + 'troisieme langue (« Realisation », « Production ») absente de library/ et de cli/src/.',
    successeur: 'ROLE-VOCAB-CANON — canoniser un libelle de role DESTINE A LA DOC, puis controle '
      + "d'ARITE (un tableau de roles porte autant de lignes que le canon compte de roles). "
      + 'Titulaire : Gandalf (cadrage amont : ajout de champ au canon, pas retouche de garde).',
    portee: 'README.md — et, par extension declaree, TOUTE VITRINE REDIGEE EN LANGAGE DE ROLE.',
    sonde: { type: 'fichier', cible: 'README.md' },
  },
  {
    motif: 'D11 — le predicat NARRATIF (« Helm ∧ traversee ») est REJETE, mesure a l\'appui : >= 8 '
      + 'faux positifs de trois causes toutes legitimes (clause negative exigee par CA-12, cesure '
      + 'de ligne, renvoi croise implicite). Le tenir demanderait de reflower la vitrine entiere ou '
      + "une allowlist de lignes — c'est-a-dire de reintroduire l'enumeration par la porte de "
      + 'derriere. Une prose qui attribue a Helm la traversee due a Charon, SANS porter le jeton du '
      + "role de Charon ni celui de sa skill, reste donc hors d'atteinte.",
    successeur: 'ROLE-VOCAB-CANON egalement, ou levee explicite si la mesure de faux positifs change.',
    portee: 'prose attribuant a Helm la TRAVERSEE due a Charon, sans porter le jeton de son role '
      + 'ni celui de sa skill.',
    // Echantillon exact du defaut corrige a prise-en-main-ia-iakabox.html:435 au lot precedent.
    sonde: { type: 'ligne', cible: 'la mise en prod est un squad separe (Helm) sur ton feu vert' },
  },
];

function estExclu(rel) {
  const p = rel.split(path.sep).join('/');
  return EXCLUS.some((x) => p === x || p.startsWith(`${x}/`));
}

// `garde` = identifiant de la garde appelante. Une exemption « * » vaut partout ; une exemption
// nommee ne vaut QUE dans la garde qu'elle cite. Un chemin exempte du niveau B reste donc
// pleinement balaye par G-ROUTE-1 et G-ROUTE-4 : on n'exempte jamais un FICHIER, on exempte un
// fichier D'UN PREDICAT.
function estExempte(rel, garde) {
  const p = rel.split(path.sep).join('/');
  return EXEMPTIONS.some((e) => (e.garde === '*' || e.garde === garde) && e.portee.includes(p));
}

function cheminsExemptes(garde) {
  return new Set(EXEMPTIONS.filter((e) => e.garde === '*' || e.garde === garde)
    .flatMap((e) => e.portee));
}

// Extensions BINAIRES : blocklist (et non allowlist), pour que le balayage reste balayant — un
// format de texte inconnu doit etre LU, pas ignore en silence. Double filet : detection d'octet NUL.
const BINAIRES = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.svgz', '.pdf', '.zip', '.gz', '.tgz', '.bz2',
  '.woff', '.woff2', '.ttf', '.otf', '.eot', '.mp4', '.mp3', '.wav', '.mov',
  '.exe', '.dll', '.so', '.dylib', '.node', '.bin', '.class', '.jar',
]);

function lignesLogiques(raw, abs) {
  // Desechappement reserve aux JSON (cf. en-tete). Ailleurs : lignes PHYSIQUES, numeros exacts.
  return path.extname(abs).toLowerCase() === '.json'
    ? raw.replace(/\\n/g, '\n').split('\n')
    : raw.split('\n');
}

function lire(abs) {
  return lignesLogiques(fs.readFileSync(abs, 'utf8'), abs);
}

function scanner(racine, predicat, acc = [], base = racine) {
  let entrees;
  try { entrees = fs.readdirSync(racine, { withFileTypes: true }); } catch { return acc; }
  for (const e of entrees) {
    const abs = path.join(racine, e.name);
    const rel = path.relative(base, abs);
    const depuisRepo = path.relative(REPO, abs);
    // Frontiere STRUCTURELLE (EXCLUS, plancher toujours actif) PUIS frontiere GIT-IGNORE (d), qui
    // tire son perimetre de git au lieu de le reciter. En mode degrade, seule la premiere joue.
    if (estExclu(depuisRepo) || estIgnoreParGit(depuisRepo)) continue;
    if (e.isDirectory()) scanner(abs, predicat, acc, base);
    else if (predicat(e.name, rel)) acc.push(abs);
  }
  return acc;
}

// Tout fichier TEXTE du depot, hors frontiere structurelle. Les exemptions ne sont PAS filtrees
// ici : chaque garde decide de les sauter, et la peremption a besoin de pouvoir les relire.
function fichiersTexte() {
  return scanner(REPO, (nom) => !BINAIRES.has(path.extname(nom).toLowerCase()));
}

function contenu(abs) {
  try {
    const raw = fs.readFileSync(abs, 'utf8');
    return raw.includes('\0') ? null : raw;
  } catch { return null; }
}

// --- Le CANON, lu a l'execution -----------------------------------------------------------------
// LA GARDE NE CODE PAS SES ATTENTES EN DUR : elle les TIRE DE LA SOURCE DE VERITE. C'est le geste
// anti-enumeration a sa forme pure. Si le canon change, la garde suit ; si un troisieme poste prod
// apparait, elle le prend sans edition. (Le repertoire du canon n'est pas une population
// controlee : c'est la SOURCE de l'attente — il ne constitue donc pas une liste de chemins en dur.)
const CANON_PERSONAS = path.join(REPO, 'library', 'personas');

// Les deux postes du squad prod. Ce sont des NOMS DE PERSONA (comme RECIPROQUES), pas des chemins.
const SQUAD_PROD = ['helm', 'charon'];

function lireCanon(id) {
  const abs = path.join(CANON_PERSONAS, `${id}.md`);
  assert.ok(fs.existsSync(abs), `canon introuvable pour la persona « ${id} » : ${abs}`);
  const raw = fs.readFileSync(abs, 'utf8');
  const mRole = raw.match(/^roleKey:\s*(\S+)\s*$/m);
  const mSkills = raw.match(/^skills:\s*\[([^\]]*)\]\s*$/m);
  assert.ok(mRole, `frontmatter sans roleKey dans le canon de « ${id} »`);
  assert.ok(mSkills, `frontmatter sans skills dans le canon de « ${id} »`);
  return {
    id,
    roleKey: mRole[1].trim(),
    skills: mSkills[1].split(',').map((s) => s.trim()).filter(Boolean),
  };
}

const CANON = SQUAD_PROD.map(lireCanon);

// ------------------------------------------------------------------------------------------------
// SENS DU PREDICAT — ASYMETRIQUE. LA CLAUSE SYMETRIQUE DE D7 EST ABANDONNEE.
// ------------------------------------------------------------------------------------------------
// ARBITRAGE DE COORDINATION, PRIS SOUS AUTONOMIE DELEGUEE — PAS un feu vert du decideur.
// REVERSIBLE s'il le reprend. Il s'appuie sur D11, qui est de lui.
//
// D7 exigeait la symetrie : « ni, symetriquement, charon au role surveillance ou a
// iakaframe-surveillance ». Or F17 — la mesure qui FONDE D10 et le « un seul faux positif » — n'a
// jamais porte que sur la moitie ASYMETRIQUE. La moitie symetrique a ete ECRITE, EXECUTEE et
// MESUREE avant d'etre ecartee : c'est ce qui distingue un ABANDON d'un RENONCEMENT.
//
// (Les jetons ne sont PAS ecrits ci-dessous : cette garde ne doit pas mordre sur la prose qu'elle
//  vient d'ecrire — c'est F27, et le remede est la REFORMULATION, jamais l'auto-exemption.)
//
//   Direction du predicat                                        | Attrapes | Faux positifs
//   ------------------------------------------------------------ | -------- | -------------
//   helm <- role/skill de TRAVERSEE, dus a Charon    (F17)        |  8 / 8   |      1
//   charon <- role/skill de VEILLE, dus a Helm  (JAMAIS MESUREE)  |  0 / 8   |      6
//
// DEUX MOTIFS INDEPENDANTS, CHACUN SUFFIRAIT :
//  1. LA MESURE — 0 capture sur 8, 6 faux positifs : le profil EXACT que D11 a ecarte, et le
//     decideur a dit oui a D11 EN CONNAISSANCE DE CAUSE. Appliquer son propre critere a cette
//     donnee neuve DISQUALIFIE la clause. Les 6 sont d'une cause unique — la prose qui ENUMERE les
//     artefacts nes de la scission (charon, surveillance, iakaframe-surveillance cites dans le meme
//     souffle) est lexicalement indiscernable, ligne a ligne, d'une affectation. C'est la cause F21
//     (renvoi croise implicite), que D11 declare LEGITIME.
//  2. LA CONTRADICTION DURE — kits/iakaframe-openwebui/models/helm.json:47 est l'artefact de Helm
//     lui-meme, dont G-ROUTE-1 EXIGE qu'il nomme Charon ; la clause symetrique PUNIRAIT de l'avoir
//     ecrit a proximite du mot `surveillance`. Deux gardes qui s'annulent ne protegent rien : elles
//     fabriquent du bruit et usent la confiance.
//
// CE QUI RESTE ANCRE SUR LE CANON, ET C'EST L'ESSENTIEL : seul le SENS est declare ici. Les VALEURS
// (`deploiement`, `iakaframe-deploiement`) sont toujours LUES dans le frontmatter de Charon a
// l'execution. Si le canon renomme le role ou la skill, la garde suit sans edition.
const PORTEUR_TRAVERSEE = 'charon'; // le titulaire dont les jetons peuvent etre USURPES.

// jeton (role ou skill) -> id de la persona qui en est le TITULAIRE LEGITIME, d'apres le canon.
const TITULAIRE = new Map();
for (const p of CANON.filter((c) => c.id === PORTEUR_TRAVERSEE)) {
  TITULAIRE.set(normaliser(p.roleKey), p.id);
  for (const s of p.skills) TITULAIRE.set(normaliser(s), p.id);
}
assert.ok(TITULAIRE.size > 0, 'aucun jeton controle : le canon de « ' + PORTEUR_TRAVERSEE + ' » '
  + "n'a rendu ni roleKey ni skills — un predicat qui ne controle rien est un ECHEC, pas un vert");

// La RECIPROCITE (G-ROUTE-1, D8) reste SYMETRIQUE, elle : c'est une regle de niveau FICHIER, pas
// une regle d'affectation ligne a ligne. L'abandon ci-dessus ne la touche pas.
const SKILLS_SQUAD = CANON.flatMap((p) => p.skills);

// Comparaison INSENSIBLE AUX ACCENTS ET A LA CASSE : « Deploiement » ≡ « deploiement ».
function normaliser(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function nomme(ligneNormalisee, id) {
  return new RegExp(`\\b${id}\\b`).test(ligneNormalisee);
}

function porteJeton(ligneNormalisee, jeton) {
  // Bornes « identifiant » : le jeton de skill `iakaframe-deploiement` (Charon) — comme son jumeau
  // `iakaframe-surveillance` (Helm) — ne doit pas faire mordre le jeton de role nu qu'il contient,
  // sinon un seul defaut serait compte deux fois.
  return new RegExp(`(?<![a-z0-9-])${jeton}(?![a-z0-9-])`).test(ligneNormalisee);
}

// --- G-ROUTE-1 — invariant de RECIPROCITE (personas ET skills) -----------------------------------
// « Tout artefact par-persona de `helm` DOIT mentionner `Charon`, et reciproquement. »
// La scission rend le renvoi croise OBLIGATOIRE : chacun se definit par ce que l'autre fait. Un
// fichier qui ne nomme JAMAIS l'autre est, par construction, ANTERIEUR a la scission.
// Immunise contre F3 : la garde ne regarde pas les lignes, elle regarde LE FICHIER.
//
// VOLET SKILLS (D8) : meme raisonnement, applique a la seconde moitie de la scission. Les
// catalogues qui ignorent l'existence de la skill NEE de la scission ne se trompent sur aucune
// ligne prise isolement — ils sont faux PAR OMISSION, et seule une garde de niveau FICHIER voit une
// omission.
const RECIPROQUES = [
  { id: 'helm', doitNommer: 'Charon' },
  { id: 'charon', doitNommer: 'Helm' },
];

test('G-ROUTE-1 : reciprocite Helm <-> Charon (personas ET skills) sur tout artefact', () => {
  const manquants = [];
  let vus = 0;

  // Volet PERSONA — artefacts par-persona, decouverts par nom de fichier.
  // AUCUNE exemption n'y est honoree, et c'est DELIBERE : un artefact par-persona qui ne nomme
  // jamais son jumeau est ANTERIEUR a la scission, sans exception concevable. Le registre ne porte
  // donc pas de portee « G-ROUTE-1/persona » — s'il en fallait une un jour, il faudrait D'ABORD
  // brancher estExempte ici, sinon elle serait ECRITE SANS ETRE EXECUTEE (l'oubli n° 1, exactement).
  for (const { id, doitNommer } of RECIPROQUES) {
    const fichiers = scanner(REPO, (nom) => nom === `${id}.md` || nom === `${id}.json`);
    assert.ok(fichiers.length > 0, `aucun artefact par-persona trouve pour « ${id} » — un scan qui `
      + 'ne trouve rien est un ECHEC, jamais un succes silencieux');
    for (const abs of fichiers) {
      vus += 1;
      const raw = contenu(abs);
      if (raw !== null && !raw.includes(doitNommer)) {
        manquants.push(`${path.relative(REPO, abs)} -> 0 occurrence de « ${doitNommer} » (persona)`);
      }
    }
  }

  // Volet SKILLS (D8) — tout le depot : un fichier qui nomme une skill du squad prod doit nommer
  // l'autre. Balaye, donc soumis aux exemptions declarees.
  const texte = fichiersTexte();
  assert.ok(texte.length > 0, 'volet skills : aucun fichier texte scanne — ECHEC, pas un succes');
  let vusSkills = 0;
  for (const abs of texte) {
    const rel = path.relative(REPO, abs);
    if (estExempte(rel, 'G-ROUTE-1/skills')) continue;
    const raw = contenu(abs);
    if (raw === null) continue;
    const presentes = SKILLS_SQUAD.filter((s) => raw.includes(s));
    if (presentes.length === 0) continue;
    vusSkills += 1;
    const absentes = SKILLS_SQUAD.filter((s) => !raw.includes(s));
    if (absentes.length > 0) {
      manquants.push(`${rel} -> nomme ${presentes.join(', ')} mais JAMAIS ${absentes.join(', ')} (skills)`);
    }
  }
  assert.ok(vusSkills > 0, 'volet skills : aucun fichier ne nomme une skill du squad prod — ECHEC');

  // PEREMPTION D5, PORTEE « G-ROUTE-1/skills » — l'exemption de BACKLOG.md perit DANS LA GARDE
  // QU'ELLE EXEMPTE, mesuree AVEC LE PREDICAT DE CETTE GARDE (l'asymetrie de skills). Sans cet
  // appel, l'entree serait EXEMPTANTE MAIS JAMAIS PERISSABLE — une exception ecrite qui ne peut pas
  // pourrir bruyamment, c'est-a-dire l'oubli que D5 existe pour interdire.
  const mortes = exemptionsMortes('G-ROUTE-1/skills');
  assert.deepEqual(
    mortes, [],
    `G-ROUTE-1 ROUGE (peremption D5) : ${mortes.length} exemption(s) de volet skills devenue(s) `
    + `inutile(s) :\n  - ${mortes.join('\n  - ')}`,
  );

  assert.deepEqual(
    manquants, [],
    `G-ROUTE-1 ROUGE : ${manquants.length} artefact(s) sur ${vus} par-persona + ${vusSkills} `
    + `porteurs de skill ne nomment jamais leur jumeau (= anterieurs a la scission) :\n  - `
    + manquants.join('\n  - '),
  );
});

// --- G-ROUTE-2 — invariant d'ATTRIBUTION, DE-ENUMERE ---------------------------------------------
// DEUX niveaux, parce que les deux populations n'ont pas la meme raison de nommer Helm.
// LES POPULATIONS SONT DESORMAIS DECOUVERTES PAR NOM DE FICHIER (D6), exactement comme G-ROUTE-1 le
// fait deja. Les constantes ROUTAGE_A / ROUTAGE_B — les 11 chemins du § 7 recopies — SONT
// SUPPRIMEES. Effet : un kit neuf, un golden neuf ou une persona deplacee sont couverts SANS
// TOUCHER AU TEST.
//
// Niveau A — fichiers de ROUTAGE (aragorn/gimli/legolas). Ils n'ont AUCUNE raison legitime de
//   nommer Helm autrement que comme destinataire : chez eux, « Helm » est toujours une adresse.
//   Regle BINAIRE et BALAYANTE : toute ligne qui nomme Helm doit aussi nommer Charon.
//   CONSEQUENCE DE REDACTION, assumee et non contournee : chez ces trois personas, les deux noms du
//   squad prod doivent tenir sur la MEME ligne. Ce n'est pas une contrainte de mise en page subie —
//   c'est le remede meme : le defaut corrige ici consistait precisement a nommer un jumeau sans
//   l'autre. Si une phrase doit etre reflowee pour les garder ensemble, on la reflowe.
//
// Niveau B — artefacts par-persona de HELM lui-meme. Lui a toutes les raisons de dire « Helm » ;
//   ce qu'il ne peut plus faire, c'est REVENDIQUER LA TRAVERSEE. Regle : toute ligne portant une
//   notion de traversee doit nommer Charon.
//   NB : le mot « prod » seul ne declenche RIEN — la pastille de Helm EST prod, et une regle qui
//   mordrait dessus serait ininterpretable (D1 : critere SEMANTIQUE, pas lexical).
const TRAVERSEE = /bascul|rollback|alias|SSO|d[ée]ploy|d[ée]ploiement|feu vert/i;

const ROUTEURS = ['aragorn', 'gimli', 'legolas'];

function parPersona(ids) {
  return scanner(REPO, (nom) => ids.some((id) => nom === `${id}.md` || nom === `${id}.json`));
}

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

// --- PEREMPTION DES EXEMPTIONS (D5) --------------------------------------------------------------
// Une exemption devenue INUTILE fait ECHOUER la garde. Motif : une liste d'exceptions qui ne peut
// pas pourrir en silence est le contraire d'une liste oubliee. Si le site exempte n'est plus rouge,
// l'entree est MORTE — seul remede : la SUPPRIMER.
// La mesure se fait AVEC LE PREDICAT DE LA GARDE EXEMPTEE : une exemption de niveau B ne se juge
// pas a l'aune de l'affectation, sans quoi elle serait declaree morte pour un motif faux.
// ASYMETRIE DE SKILLS = le predicat du volet skills de G-ROUTE-1 (D8), isole pour que la
// peremption puisse le rejouer SEUL. Un fichier qui nomme une moitie du squad prod sans l'autre.
function asymetrieSkills(raw) {
  const presentes = SKILLS_SQUAD.filter((s) => raw.includes(s));
  return (presentes.length > 0 && presentes.length < SKILLS_SQUAD.length) ? 1 : 0;
}

function rougeurResiduelle(ex) {
  let n = 0;
  for (const rel of ex.portee) {
    const abs = path.join(REPO, rel);
    const raw = contenu(abs);
    if (raw === null) continue;
    // Chaque portee de registre se mesure AVEC SON PROPRE PREDICAT — jamais avec celui d'une autre
    // garde, sans quoi une exemption serait declaree morte (ou vivante) pour un motif faux.
    if (ex.garde === 'G-ROUTE-2/B') { n += fautesNiveauB(abs, rel).length; continue; }
    if (ex.garde === 'G-ROUTE-1/skills') { n += asymetrieSkills(raw); continue; }
    // Portee « * » : l'exemption vaut pour tout le dispositif, donc tous les predicats comptent.
    n += fautesAffectation(lignesLogiques(raw, abs), rel).length + asymetrieSkills(raw);
  }
  return n;
}

function exemptionsMortes(garde) {
  const mortes = [];
  for (const ex of EXEMPTIONS.filter((e) => e.garde === garde)) {
    assert.ok(ex.motif && ex.levee && Array.isArray(ex.portee) && ex.portee.length > 0,
      'exemption incomplete : motif, levee et portee sont les TROIS champs obligatoires (D5)');
    if (rougeurResiduelle(ex) === 0) {
      mortes.push(`exemption MORTE sur [${ex.portee.join(', ')}] (portee de registre « ${ex.garde} `
        + `») — plus aucune ligne rouge : l'exemption ne sert plus a rien. Motif declare : `
        + `« ${ex.motif.slice(0, 90)}... » — levee : ${ex.levee.slice(0, 90)}. `
        + "SEUL REMEDE : SUPPRIMER L'ENTREE.");
    }
  }
  return mortes;
}

test('G-ROUTE-2 : attribution — populations DECOUVERTES, les routeurs adressent la prod a Charon', () => {
  const fautes = [];

  const niveauA = parPersona(ROUTEURS);
  assert.ok(niveauA.length > 0, 'niveau A : aucun artefact de routage decouvert — un scan qui ne '
    + 'trouve rien est un ECHEC (le mode de panne d\'un balayage est de ne rien balayer)');
  for (const abs of niveauA) {
    if (estExempte(path.relative(REPO, abs), 'G-ROUTE-2/A')) continue;
    fautes.push(...fautesNiveauA(abs, path.relative(REPO, abs)));
  }

  const niveauB = parPersona(['helm']);
  assert.ok(niveauB.length > 0, 'niveau B : aucun artefact par-persona de Helm decouvert — ECHEC');
  let vusB = 0;
  for (const abs of niveauB) {
    if (estExempte(path.relative(REPO, abs), 'G-ROUTE-2/B')) continue;
    vusB += 1;
    fautes.push(...fautesNiveauB(abs, path.relative(REPO, abs)));
  }
  assert.ok(vusB > 0, 'niveau B : TOUS les artefacts decouverts sont exemptes — le niveau B ne '
    + 'controle plus rien. Un predicat integralement exempte est un ECHEC, pas un vert.');

  // PEREMPTION D5, PORTEE « G-ROUTE-2/B » — l'exemption du canon perit DANS LA GARDE QU'ELLE
  // EXEMPTE, mesuree AVEC LE PREDICAT DE CETTE GARDE (le niveau B), jamais avec celui d'une autre.
  const mortes = exemptionsMortes('G-ROUTE-2/B');

  assert.deepEqual(
    mortes, [],
    `G-ROUTE-2 ROUGE (peremption D5) : ${mortes.length} exemption(s) de niveau B devenue(s) `
    + `inutile(s) :\n  - ${mortes.join('\n  - ')}`,
  );
  assert.deepEqual(
    fautes, [],
    `G-ROUTE-2 ROUGE : ${fautes.length} site(s) d'attribution sur ${niveauA.length} artefact(s) de `
    + `routage + ${vusB} artefact(s) de Helm controles (${niveauB.length} decouverts), tous `
    + `DECOUVERTS :\n  - ${fautes.join('\n  - ')}`,
  );
});

// --- G-ROUTE-3 — invariant sur les CONTRATS DEPLOYES ---------------------------------------------
// EXIGENCE EXPLICITE DU DECIDEUR. C'est LA surface ou le defaut se voit, et AUCUN critere du lot
// precedent ne la regardait — tous s'arretaient au canon et aux goldens. Une source juste dont le
// contrat deploye est faux ne protege personne : c'est le contrat que le runner LIT.
//
// Artefact HORS DEPOT (~/.claude/) : la garde SKIPPE proprement ET LE DIT si le repertoire est
// absent (poste CI). Elle n'echoue JAMAIS par absence. INCHANGEE par ce lot.
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

  // Attribution (G-ROUTE-2) sur les routeurs deployes.
  for (const id of ROUTEURS) {
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

// --- G-ROUTE-4 — invariant d'AFFECTATION, ANCRE SUR LE CANON, sur TOUT le depot -------------------
// « Aucune ligne ne doit associer une persona du squad prod a un role ou a une skill dont elle
//   n'est PAS titulaire — sauf si la ligne nomme aussi le TITULAIRE LEGITIME du jeton cite. »
//
// La garde ne code PAS ces valeurs en dur : elle lit `roleKey` et `skills` dans les frontmatters du
// canon et en derive les paires attendues. Elle TIRE SON ATTENTE DE LA SOURCE DE VERITE AU LIEU DE
// LA REPETER. C'est ce qui la distingue d'une liste : elle n'a rien a maintenir.
//
// D1 (critere SEMANTIQUE, pas lexical) : « prod » seul ne declenche rien, « bascule » seul non plus.
// Ce qui declenche est l'AFFECTATION d'un role ou d'une skill a un agent qui ne les porte plus.
function fautesAffectation(lignes, etiquette) {
  const fautes = [];
  lignes.forEach((ligne, i) => {
    const n = normaliser(ligne);
    const presents = CANON.map((p) => p.id).filter((id) => nomme(n, id));
    if (presents.length === 0) return;
    const vues = new Set();
    for (const [jeton, titulaire] of TITULAIRE) {
      if (!porteJeton(n, jeton)) continue;
      if (nomme(n, titulaire)) continue; // le titulaire legitime est nomme : acquitte.
      for (const id of presents) {
        if (id === titulaire) continue;
        const cle = `${id}<-${jeton}`;
        if (vues.has(cle)) continue;
        vues.add(cle);
        fautes.push(`${etiquette}:${i + 1}  « ${id} » associe a « ${jeton} » (titulaire : `
          + `${titulaire}, non nomme)  ${ligne.trim().slice(0, 110)}`);
      }
    }
  });
  return fautes;
}

test('G-ROUTE-4 : affectation role/skill ancree sur le canon, balayee sur tout le depot', () => {
  const texte = fichiersTexte();
  assert.ok(texte.length > 0, 'G-ROUTE-4 : aucun fichier texte scanne — un scan qui ne trouve rien '
    + 'est un ECHEC, jamais un succes silencieux');

  const fautes = [];
  let vus = 0;
  for (const abs of texte) {
    const rel = path.relative(REPO, abs);
    if (estExempte(rel, 'G-ROUTE-4')) continue;
    const raw = contenu(abs);
    if (raw === null) continue;
    vus += 1;
    fautes.push(...fautesAffectation(lignesLogiques(raw, abs), rel));
  }
  assert.ok(vus > 0, 'G-ROUTE-4 : aucun fichier lu — ECHEC');

  // PEREMPTION D5, portee « * » — les exemptions valables pour tout le dispositif.
  const mortes = exemptionsMortes('*');

  assert.deepEqual(
    mortes, [],
    `G-ROUTE-4 ROUGE (peremption D5) : ${mortes.length} exemption(s) devenue(s) inutile(s) :\n  - `
    + mortes.join('\n  - '),
  );
  assert.deepEqual(
    fautes, [],
    `G-ROUTE-4 ROUGE : ${fautes.length} site(s) d'affectation sur ${vus} fichier(s) texte balayes `
    + `(hors ${cheminsExemptes('G-ROUTE-4').size} chemin(s) exempte(s)) :\n  - ${fautes.join('\n  - ')}`
    + `\n  ${REGIME_PERIMETRE}`,
  );
});

// --- G-ROUTE-5 — registre des ANGLES MORTS, peremption INVERSEE ----------------------------------
// LES QUATRE PREMIERES DISENT CE QUE LE DEPOT A DE FAUX. CELLE-CI DIT CE QU'AUCUNE DES QUATRE NE
// PEUT VOIR. Elle ne corrige rien — elle rend l'oubli impossible a commettre deux fois sans le voir.
//
// Le defaut que D5 ne peut pas couvrir : sa peremption ne vaut QUE pour les sites que le predicat
// ATTEINT. Un site INVISIBLE du predicat ne peut pas y etre inscrit — il n'est pas rouge, donc son
// exemption serait morte a la seconde ou on l'ecrit. D5 est STRUCTURELLEMENT INCAPABLE de tracer ce
// qui est hors de sa portee. C'est le trou par lequel sont passes l'oubli n° 1 ET l'oubli n° 2.
function sondeEstCouverte(entree) {
  if (entree.sonde.type === 'fichier') {
    const rel = entree.sonde.cible;
    const abs = path.join(REPO, rel);
    const raw = contenu(abs);
    if (raw === null) return [];
    const touches = fautesAffectation(lignesLogiques(raw, abs), rel);
    const presentes = SKILLS_SQUAD.filter((s) => raw.includes(s));
    if (presentes.length > 0 && presentes.length < SKILLS_SQUAD.length) {
      touches.push(`${rel}  nomme ${presentes.join(', ')} sans son jumeau (volet skills G-ROUTE-1)`);
    }
    return touches;
  }
  // type « ligne » : echantillon exact de la classe declaree, soumis au predicat d'affectation.
  return fautesAffectation([entree.sonde.cible], '<sonde>');
}

test('G-ROUTE-5 : registre des angles morts — il declare la non-couverture, et il PERIT en miroir', () => {
  assert.ok(ANGLES_MORTS.length > 0, 'registre des angles morts VIDE : un dispositif qui ne declare '
    + 'aucun angle mort pretend tout voir. Ce lot en a mesure deux.');

  const morts = [];
  for (const am of ANGLES_MORTS) {
    assert.ok(am.motif && am.successeur && am.portee && am.sonde,
      'entree d\'angle mort incomplete : motif, successeur/condition de levee et portee sont les '
      + 'TROIS champs obligatoires (D14), plus la sonde qui rend la peremption executable');
    const touches = sondeEstCouverte(am);
    if (touches.length > 0) {
      morts.push(`angle mort COUVERT — donc MORT — sur « ${am.portee.slice(0, 70)} » : un predicat `
        + `l'atteint desormais (${touches.length} touche(s)) :\n      ${touches.join('\n      ')}\n`
        + `      Successeur declare : ${am.successeur.slice(0, 80)}...\n`
        + '      SEUL REMEDE : SUPPRIMER L\'ENTREE (l\'aveu de non-couverture est perime).');
    }
  }

  assert.deepEqual(
    morts, [],
    `G-ROUTE-5 ROUGE (peremption inversee D14) : ${morts.length} angle(s) mort(s) devenu(s) `
    + `couvert(s) :\n  - ${morts.join('\n  - ')}`,
  );
});
