// Signalement des branches locales SANS COPIE DISTANTE — instruction
// specs/instructions/signalement-branches-sans-copie-distante.md (lot successeur du lot 1).
//
// CE QUE CE MODULE FAIT : lire des refs git et dire, pour chaque branche locale, s'il existe
// des commits qu'AUCUNE ref distante ne contient. Rien d'autre. Il est en LECTURE SEULE :
// il ne pousse pas, ne configure aucun upstream, ne cree aucune branche, n'ecrit aucun fichier
// dans les depots balayes (`CA-13`).
//
// 🛑 POURQUOI LE SIGNAL NE DIT PAS « NON SAUVEGARDE » (et ne le dira jamais). L'instantane
// `range` prend le dossier chapeau SANS exclusion — donc les repertoires `.git`, donc la branche
// locale EST dans l'instantane. Ecrire « non sauvegarde » serait FAUX des que `range` a tourne,
// et un signal faux se paie plus cher qu'un signal absent. Le libelle est donc « SANS COPIE
// DISTANTE » : il n'existe aucune copie hors de ce disque autre que cet instantane. Ce libelle
// est un CRITERE (`CA-7`, `R5`), pas une preference de style.
//
// 🛑 POURQUOI LE PREDICAT N'EST PAS « pas d'upstream configure ». Mesure faite sur le depot
// iakaframe le 2026-08-17 : 6 branches sur 16 n'ont AUCUNE configuration d'upstream alors qu'une
// ref distante homonyme existe (un `git push origin <nom>` sans `-u` ne configure rien —
// `push.autoSetupRemote` n'est pas actif par defaut). Un signalement fonde sur `%(upstream)`
// se tromperait donc 37 % du temps SUR CE DEPOT-CI. Une garde qui se trompe une fois sur trois
// est desactivee mentalement en trois jours. Le predicat retenu (`DB`) mesure une COPIE, pas une
// CONFIGURATION :
//     git rev-list --count refs/heads/<B> --not --remotes
//
// 🛑 ZERO RESEAU, ET C'EST UN CHOIX. `git ls-remote`/`fetch` rendraient le signalement dependant
// du reseau : il deviendrait muet PRECISEMENT quand il sert (periodes hors ligne, ou rien n'est
// pousse). Consequence assumee et DECLAREE dans la sortie : la connaissance des remotes est datee
// du dernier `fetch`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isRepo, run } from './git.js';
import { listerProjets } from './range.js';

// Plafond d'AFFICHAGE, jamais de comptage : on borne ce qui s'imprime, jamais le nombre.
export const PLAFOND_AFFICHAGE = 10;

// Le libelle qui ne mente pas (`CA-7`). Source unique : la sortie humaine ET les cles JSON en
// derivent, pour qu'aucune des deux ne puisse deriver seule.
export const LIBELLE = 'branches sans copie distante';

// Les ANGLES MORTS. Ce n'est pas un commentaire de fichier : c'est une SORTIE (`CA-8`). Une garde
// qui ne declare pas son angle mort laisse croire qu'elle n'en a pas.
export const LIMITES = [
  'refs locales de suivi (aucun ls-remote, aucun fetch) : etat des remotes date du dernier fetch',
  'profondeur 1 : ni depots imbriques, ni sous-modules',
  'un depot NU (bare, sans sous-repertoire .git) est compte non-git, donc jamais examine',
  'ni modifications non commitees, ni index, ni stash, ni commits en HEAD detache',
  'un remote miroir compte comme copie distante : le rapport NOMME le remote, au lecteur de juger',
  'hors du perimetre demande : rien n\'est dit des autres depots',
  'les motifs d\'exclusion de l\'instantane ne sont pas recoupes',
  'les branches ecartees par motif sortent de la LISTE, pas des compteurs',
];

// Forme courte de ces limites a l'ecran (deux lignes, pour ne pas noyer l'en-tete).
export const LIMITES_COURTES = [
  'ce balayage ne voit pas : les modifs non commitees, les stash, les depots imbriques,',
  'l\'etat reel des remotes (connaissance datee du dernier fetch)',
];

// Le geste a faire quand le signal parle. Il DIT quoi faire (`DD-5`).
export const CONSEIL = '-> git push -u origin <branche>';

// Point de debrayage `DE`, sur le modele exact de `D4` : un fichier VERSIONNE et VIDE.
// Resolution depuis ce module : cli/src/lib/ -> cli/src/ -> cli/ -> racine du depot.
export function defaultIgnoreFile() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..', '..', '..', 'config', 'sauvegarde-branches-ignorees.txt');
}

// Lit les motifs d'exclusion de branche. Lignes vides et `#` ignorees. Fichier absent => aucun
// motif (le balayage n'echoue pas pour autant : il SIGNALE, il ne bloque pas).
export function lireMotifsIgnores(fichier) {
  let brut = '';
  try { brut = fs.readFileSync(fichier, 'utf8'); } catch { return { fichier, motifs: [], present: false }; }
  const motifs = brut
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== '' && !l.startsWith('#'));
  return { fichier, motifs, present: true };
}

// Glob de nom de branche : `*` = n'importe quoi, `?` = un caractere. Correspondance ENTIERE
// (`archive` ne masque pas `archive/x` : il faut ecrire `archive/*`).
export function motifCorrespond(motif, branche) {
  const echappe = String(motif).replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const rx = new RegExp(`^${echappe.replace(/\*/g, '.*').replace(/\?/g, '.')}$`);
  return rx.test(branche);
}

export function estEcartee(branche, motifs = []) {
  return motifs.some((m) => motifCorrespond(m, branche));
}

// Classement PUR : c'est lui qui porte la difference entre « n'existe nulle part ailleurs » et
// « partiellement repliquee ». Deux etats distincts, AUCUN seuil (`DB`).
export function classer(commitsLocaux, refsDistantes = []) {
  if (!Number.isFinite(commitsLocaux) || commitsLocaux <= 0) return null;   // silencieux PAR CONSTRUCTION
  return refsDistantes.length > 0 ? 'en-avance' : 'absente';
}

// Age en jours du dernier commit. AFFICHE (il aide a trier), JAMAIS utilise comme filtre : un
// seuil d'age organiserait N jours de silence — le defaut meme de l'incident.
export function ageEnJours(dateIso, maintenant = Date.now()) {
  const t = Date.parse(dateIso);
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.floor((maintenant - t) / 86400000));
}

// --- frontiere d'execution git (une seule, `lib/git.js:run`) ---------------------------------

// Branches locales : nom + sha + date du dernier commit, en UN appel.
export function lireBranches(cwd) {
  const r = run(cwd, ['for-each-ref', '--format=%(refname:short)%09%(objectname)%09%(committerdate:iso-strict)', 'refs/heads/']);
  if (!r.ok) return null;                                  // depot illisible : compte comme ignore, jamais avale
  return r.out.split(/\r?\n/).filter(Boolean).map((l) => {
    const [nom, sha, date] = l.split('\t');
    return { nom, sha, dernierCommit: date || null };
  });
}

// Toutes les refs de suivi, en UN appel : `refs/remotes/<remote>/<branche>` -> { branche: [remotes] }.
// `refs/remotes/*/HEAD` est ecarte (ce n'est pas une branche, c'est un pointeur).
export function lireRefsDistantes(cwd) {
  const r = run(cwd, ['for-each-ref', '--format=%(refname)', 'refs/remotes/']);
  if (!r.ok) return {};
  const parRemote = {};
  for (const ref of r.out.split(/\r?\n/).filter(Boolean)) {
    const reste = ref.replace(/^refs\/remotes\//, '');
    const i = reste.indexOf('/');
    if (i <= 0) continue;
    const remote = reste.slice(0, i);
    const branche = reste.slice(i + 1);
    if (branche === 'HEAD') continue;
    (parRemote[branche] ||= []).push(remote);
  }
  return parRemote;
}

// LE PREDICAT (`DB`, fait verifie `F1`) : nombre de commits de la branche qu'aucune ref distante
// ne contient. Aucun acces reseau — `--remotes` designe les refs LOCALES de suivi.
export function compterCommitsSansCopie(cwd, branche) {
  const r = run(cwd, ['rev-list', '--count', `refs/heads/${branche}`, '--not', '--remotes']);
  if (!r.ok) return null;
  const n = Number.parseInt(r.out, 10);
  return Number.isFinite(n) ? n : null;
}

// --- balayage ---------------------------------------------------------------------------------

// Analyse UN depot. Rend les branches signalees + les compteurs de ce depot.
export function analyserDepot(chemin, { projet, motifs = [], maintenant = Date.now() } = {}) {
  const branches = lireBranches(chemin);
  if (branches === null) return null;                      // illisible => l'appelant le compte comme ignore
  const refs = lireRefsDistantes(chemin);
  const signalees = [];
  let examinees = 0;
  let ecartees = 0;

  for (const b of branches) {
    examinees += 1;
    const n = compterCommitsSansCopie(chemin, b.nom);
    const etat = classer(n, refs[b.nom] || []);
    if (!etat) continue;
    if (estEcartee(b.nom, motifs)) { ecartees += 1; continue; }
    signalees.push({
      projet,
      branche: b.nom,
      commitsLocaux: n,
      etat,
      refsDistantes: (refs[b.nom] || []).slice().sort(),
      dernierCommit: b.dernierCommit,
      ageJours: ageEnJours(b.dernierCommit, maintenant),
    });
  }
  return { signalees, examinees, ecartees };
}

// Ordre de rendu : le plus grave d'abord (`absente` avant `en-avance`), puis le plus de commits.
// Deterministe, pour que le plafond d'AFFICHAGE ne cache jamais le cas le plus grave.
export function ordonner(liste) {
  const rang = (e) => (e.etat === 'absente' ? 0 : 1);
  return liste.slice().sort((a, b) =>
    rang(a) - rang(b) ||
    b.commitsLocaux - a.commitsLocaux ||
    String(a.projet).localeCompare(String(b.projet)) ||
    String(a.branche).localeCompare(String(b.branche)));
}

// Balaye le perimetre DEMANDE — celui de l'instantane, jamais celui du repertoire courant (`DC`).
// `perimetre` = l'objet rendu par `resoudrePerimetre` de lib/range.js ({ portee, projet, chemin }).
export function balayer(perimetre, { root, ignoreFile, maintenant = Date.now() } = {}) {
  const debut = Date.now();
  const { fichier, motifs } = lireMotifsIgnores(ignoreFile ?? defaultIgnoreFile());

  const candidats = perimetre.portee === 'all'
    ? listerProjets(root).map((nom) => ({ nom, chemin: path.join(root, nom) }))
    : [{ nom: perimetre.projet, chemin: perimetre.chemin }];

  let signalees = [];
  let depotsScannes = 0;
  let branchesExaminees = 0;
  let branchesEcartees = 0;
  const depotsNonGitNoms = [];
  const depotsIgnoresNoms = [];

  for (const c of candidats) {
    if (!isRepo(c.chemin)) { depotsNonGitNoms.push(c.nom); continue; }   // compte ET nomme (`CA-8`)
    const r = analyserDepot(c.chemin, { projet: c.nom, motifs, maintenant });
    if (r === null) { depotsIgnoresNoms.push(c.nom); continue; }
    depotsScannes += 1;
    branchesExaminees += r.examinees;
    branchesEcartees += r.ecartees;
    signalees = signalees.concat(r.signalees);
  }

  signalees = ordonner(signalees);
  return {
    portee: perimetre.portee,
    projet: perimetre.projet ?? null,
    // 🛑 `count` = longueur EXACTE de la liste (regle 3 de lib/output.js). Une branche ecartee par
    // motif quitte la liste ET ce compteur — mais elle reste visible dans `branchesEcartees` :
    // ECARTER N'EST JAMAIS TAIRE.
    branchesSansCopieDistante: signalees,
    branchesSansCopieDistanteCount: signalees.length,
    scanBranches: {
      depotsScannes,
      depotsNonGit: depotsNonGitNoms.length,
      depotsNonGitNoms,
      depotsIgnores: depotsIgnoresNoms.length,
      depotsIgnoresNoms,
      branchesExaminees,
      branchesEcartees,
      motifsIgnores: fichier,
      dureeMs: Date.now() - debut,
      limites: LIMITES,
    },
  };
}

// --- rendu humain (PUR) ------------------------------------------------------------------------

// Rend le bloc du signalement. 🛑 IL PARLE TOUJOURS, y compris quand il n'a rien a signaler
// (`CA-5`) : sinon on ne peut pas distinguer « rien a signaler » de « la garde est cassee ».
// Rend donc TOUJOURS au moins une ligne.
export function rendreBloc(rapport, { plafond = PLAFOND_AFFICHAGE, indent = '  ' } = {}) {
  const s = rapport.scanBranches;
  const total = rapport.branchesSansCopieDistanteCount;
  const compteurs = `${s.depotsIgnores} ignore, ${s.depotsNonGit} non-git, ${s.branchesExaminees} branches examinees`;
  const lignes = [];

  if (total === 0) {
    lignes.push(`${indent}${LIBELLE} : aucune (${s.depotsScannes} depots scannes, ${compteurs})`);
  } else {
    lignes.push(`${indent}${LIBELLE} : ${total} sur ${s.depotsScannes} depots (${compteurs})`);
    const montrees = rapport.branchesSansCopieDistante.slice(0, plafond);
    const lp = Math.max(...montrees.map((e) => String(e.projet).length));
    const lb = Math.max(...montrees.map((e) => String(e.branche).length));
    for (const e of montrees) {
      const etat = e.etat === 'absente'
        ? 'AUCUNE ref distante'
        : `en avance sur ${e.refsDistantes.join(', ')}`;
      const age = e.ageJours === null ? '' : `   (${e.ageJours} j)`;
      // `commit ` (avec l'espace) plutot que `commits` au singulier : le pluriel ne mente pas, et
      // la largeur de colonne reste constante.
      const cs = `${String(e.commitsLocaux).padStart(3)} commit${e.commitsLocaux > 1 ? 's' : ' '}`;
      lignes.push(`${indent}  ${String(e.projet).padEnd(lp)}   ${String(e.branche).padEnd(lb)}   ` +
        `${cs}   ${etat}${age}`);
    }
    // On borne l'AFFICHAGE, jamais le compteur : le nombre ci-dessus reste exact.
    if (total > montrees.length) lignes.push(`${indent}  … et ${total - montrees.length} autres (voir --json)`);
    lignes.push(`${indent}  ${CONSEIL}`);
  }

  // Ecarter n'est jamais taire : le compteur ET le chemin du fichier de motifs restent visibles.
  if (s.branchesEcartees > 0) {
    lignes.push(`${indent}  ecartees par motif : ${s.branchesEcartees} (motifs : ${s.motifsIgnores})`);
  }
  if (s.depotsNonGit > 0) {
    lignes.push(`${indent}  non suivis par git : ${s.depotsNonGitNoms.join(', ')}`);
  }
  if (s.depotsIgnores > 0) {
    lignes.push(`${indent}  depots illisibles : ${s.depotsIgnoresNoms.join(', ')}`);
  }
  // Perimetre cible : le silence sur les AUTRES depots est DIT, sinon il passerait pour un
  // « tout va bien » (`CA-4`).
  if (rapport.portee !== 'all') {
    lignes.push(`${indent}  perimetre cible « ${rapport.projet} » : RIEN n'est dit des autres depots du chapeau`);
  }
  for (const l of LIMITES_COURTES) lignes.push(`${indent}${l}`);
  return lignes;
}

// Rappel APRES le `OK` final : UNE seule ligne, le compteur — pas la liste (`DD-3`).
export function ligneRappel(rapport) {
  const total = rapport.branchesSansCopieDistanteCount;
  const s = rapport.scanBranches;
  if (total === 0) return `${LIBELLE} : aucune (${s.depotsScannes} depots scannes)`;
  return `${LIBELLE} : ${total} (${CONSEIL})`;
}

// Les LIBELLES fixes du signalement, exposes pour que la garde `CA-7` puisse verifier qu'aucun
// d'entre eux ne parle de « sauvegarde » : le signal ne dit pas ce qu'il ne mesure pas.
export const LIBELLES_FIXES = [LIBELLE, CONSEIL, ...LIMITES, ...LIMITES_COURTES,
  'AUCUNE ref distante', 'en avance sur', 'ecartees par motif', 'non suivis par git',
  'depots illisibles', 'branches examinees', 'et N autres (voir --json)'];
