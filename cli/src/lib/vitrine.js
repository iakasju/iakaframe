// iakaframe — Publication vers la vitrine (GitHub, opt-in projet). Zero dependance : git en
// processus fils (via `gitBorne` de canaux.js, meme patron que le reste du fan-out).
// Instruction : specs/instructions/update-remotes-github-opt-in.md § 5.
//
// PRINCIPE DIRECTEUR : la vitrine (GitHub) n'est JAMAIS ecrite par le fan-out par defaut — elle ne
// recoit QUE par une publication EXPLICITE (`update --publier <vX.Y.Z>`), nommee par un decideur,
// avec un accord donne AU TERMINAL (jamais en non-interactif). Ce module porte le CLASSEMENT
// (majeure/mineure/patch/deja-publie/inferieure/premiere) et le PUSH atomique d'UN seul tag — rien
// d'autre : `pousserFanout`, `rattraper`, `mesurerCanal`, `classerEchec` (canaux.js) ne sont PAS
// modifies par ce module, seulement reutilises.
import { gitBorne, classerEchec } from './canaux.js';

// Motif STRICT d'un tag de release : vX.Y.Z, jamais de pre-version ni de metadonnee. Les
// pre-versions de la vitrine (ex. v0.43.0-rc.1) sont IGNOREES comme reference (§ 5.3).
export const SEMVER_RELEASE = /^v(\d+)\.(\d+)\.(\d+)$/;

// Decompose un tag STRICT en { M, m, p } (nombres). `null` si le tag ne matche pas le motif. PURE.
export function parseSemver(tag) {
  const m = SEMVER_RELEASE.exec(String(tag == null ? '' : tag));
  if (!m) return null;
  return { M: Number(m[1]), m: Number(m[2]), p: Number(m[3]) };
}

// Le plus haut tag STRICT (semver) d'une liste — '' si aucun tag de la liste ne matche le motif.
// Les pre-versions/metadonnees sont exclues PAR CONSTRUCTION (parseSemver les rend null). PURE.
export function plusHautSemver(tags) {
  let meilleur = '';
  let meilleurV = null;
  for (const tag of tags || []) {
    const v = parseSemver(tag);
    if (!v) continue;
    if (!meilleurV || v.M > meilleurV.M
      || (v.M === meilleurV.M && v.m > meilleurV.m)
      || (v.M === meilleurV.M && v.m === meilleurV.m && v.p > meilleurV.p)) {
      meilleur = tag; meilleurV = v;
    }
  }
  return meilleur;
}

// Classe une publication candidate par rapport a l'etat REEL de la vitrine (§ 5.3) : la
// comparaison se fait au PLUS HAUT tag semver STRICT deja present sur la vitrine — jamais au
// dernier tag local (une vitrine qui n'a encore aucune 0.43 verrait v0.43.2 comme MINEURE, pas
// comme patch). `tagsVitrine` = TOUS les tags lus sur la vitrine (bruts, pre-versions incluses ;
// seul `plusHautSemver` les filtre). PURE.
export function classerPublication(tag, tagsVitrine) {
  const tags = tagsVitrine || [];
  if (tags.includes(tag)) return { classe: 'deja-publie', reference: tag };
  const reference = plusHautSemver(tags);
  if (!reference) return { classe: 'premiere', reference: '' };
  const t = parseSemver(tag);
  const r = parseSemver(reference);
  if (!t || !r) return { classe: 'inferieure', reference };
  if (t.M > r.M) return { classe: 'majeure', reference };
  if (t.M === r.M && t.m > r.m) return { classe: 'mineure', reference };
  if (t.M === r.M && t.m === r.m && t.p > r.p) return { classe: 'patch', reference };
  return { classe: 'inferieure', reference };
}

// Le plus haut tag STRICT ATTEIGNABLE depuis HEAD (§ 5.2 controle 5/6, § 6 tag candidat) : source
// = `git tag --merged HEAD --list 'v*'`. '' si aucun tag (ou depot illisible).
export function tagCandidat(cwd) {
  const r = gitBorne(cwd, ['tag', '--merged', 'HEAD', '--list', 'v*'], { timeoutMs: 15000 });
  if (!r.ok) return '';
  return plusHautSemver(r.out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean));
}

// Lit une vitrine EN DIRECT (lecture seule, ne declenche AUCUN workflow) : tous ses tags
// (`ls-remote --tags --refs`) et sa branche par defaut (`ls-remote --symref … HEAD`, forme
// `refs/heads/<x>`). Echec de la lecture des tags -> { ok:false, tags:[], head:'', motif }
// (motif = classerEchec, § 5.2/5.3). `head` reste '' si le symref est illisible (fail-safe,
// § 5.4 : une branche par defaut inconnue REFUSE la publication, elle ne la devine pas).
export function lireVitrine(cwd, remote, { timeoutMs = 15000 } = {}) {
  const tagsRes = gitBorne(cwd, ['ls-remote', '--tags', '--refs', remote], { timeoutMs });
  if (!tagsRes.ok) return { ok: false, tags: [], head: '', motif: classerEchec(tagsRes) };
  const tags = [...tagsRes.out.matchAll(/refs\/tags\/(\S+)/g)].map((m) => m[1]);
  let head = '';
  const headRes = gitBorne(cwd, ['ls-remote', '--symref', remote, 'HEAD'], { timeoutMs });
  if (headRes.ok) {
    const m = headRes.out.match(/^ref:\s+(\S+)\s+HEAD/m);
    if (m) head = m[1];
  }
  return { ok: true, tags, head, motif: '' };
}

// Le push EXACT de la publication (§ 5.4) : UN seul push atomique, DEUX refspecs qualifies
// (branche courante + le SEUL tag nomme), `--no-follow-tags` EXPLICITE pour neutraliser un
// eventuel `push.followTags=true` de l'utilisateur (sinon tous les tags annotes atteignables —
// dont les patchs accumules — partiraient avec la branche). `--atomic` : avance rapide seulement,
// jamais `--force` ; un refus non fast-forward fait echouer LE PUSH ENTIER (le tag ne part pas
// seul, § 5.4).
export function publierVitrine(cwd, remote, branche, tag, { timeoutMs = 30000 } = {}) {
  const r = gitBorne(cwd, [
    'push', '--atomic', '--no-follow-tags', remote,
    `refs/heads/${branche}:refs/heads/${branche}`,
    `refs/tags/${tag}:refs/tags/${tag}`,
  ], { timeoutMs });
  return r.ok
    ? { ok: true, motif: '', detail: '' }
    : { ok: false, motif: classerEchec(r), detail: String(r.err || '').split(/\r?\n/).filter(Boolean).slice(-1)[0]?.slice(0, 160) || '' };
}

// La question posee au decideur, AU TERMINAL, pour UNE vitrine (§ 5.1, textes IMPOSES). PURE.
export function questionPublication({ tag, classe, reference, nom, hote }) {
  if (classe === 'patch') {
    return `${tag} est un CORRECTIF (vitrine a ${reference}) : la regle est de ne publier que les versions majeures/mineures. Publier quand meme sur ${nom} et declencher le build ? [o/N]`;
  }
  return `Publier ${tag} (${classe}, vitrine a ${reference || 'aucun tag'}) sur ${nom} (hote ${hote}) ? Cela declenche le build de release GitHub. [o/N]`;
}

// Orchestration a DEPENDANCES INJECTEES (calque du patron ask/yes injectes, commands/models.js) :
// pour CHAQUE vitrine, `lire` -> classement -> controle de branche -> refus, ou `demander(question)`
// -> `pousser`. Aucune dependance directe a git, askYesNo ou au reseau : c'est ce qui la rend
// testable sans TTY ni forge reelle (CA-12). `forgeServie === false` -> tout en refus
// `forge-non-servie` SANS appeler `lire`/`demander`/`pousser` (la vitrine n'est jamais en avance
// sur la forge de reference, § 5.2 controle final).
export async function executerPublication({ tag, branche, vitrines, forgeServie, lire, demander, pousser }) {
  const resultats = [];
  if (forgeServie === false) {
    for (const v of vitrines || []) {
      resultats.push({ nom: v.nom, hote: v.hote, classe: '', reference: '', verdict: 'refus', motif: 'forge-non-servie' });
    }
    return { resultats, exitCode: 1 };
  }
  let exitCode = 0;
  for (const v of vitrines || []) {
    const lecture = await lire(v);
    if (!lecture || !lecture.ok) {
      resultats.push({ nom: v.nom, hote: v.hote, classe: '', reference: '', verdict: 'refus', motif: 'vitrine-injoignable' });
      exitCode = 1;
      continue;
    }
    const { classe, reference } = classerPublication(tag, lecture.tags || []);
    if (classe === 'deja-publie' || classe === 'inferieure') {
      resultats.push({ nom: v.nom, hote: v.hote, classe, reference, verdict: 'refus', motif: classe });
      exitCode = 1;
      continue;
    }
    if (!lecture.head) {
      resultats.push({ nom: v.nom, hote: v.hote, classe, reference, verdict: 'refus', motif: 'branche-vitrine-inconnue' });
      exitCode = 1;
      continue;
    }
    if (lecture.head !== `refs/heads/${branche}`) {
      resultats.push({ nom: v.nom, hote: v.hote, classe, reference, verdict: 'refus', motif: 'branche-non-vitrine' });
      exitCode = 1;
      continue;
    }
    const question = questionPublication({ tag, classe, reference, nom: v.nom, hote: v.hote });
    const accord = await demander(question);
    if (!accord) {
      resultats.push({ nom: v.nom, hote: v.hote, classe, reference, verdict: 'annule', motif: '' });
      continue;
    }
    const p = await pousser(v.nom, branche, tag);
    if (p && p.ok) {
      resultats.push({ nom: v.nom, hote: v.hote, classe, reference, verdict: 'publie', motif: '' });
    } else {
      resultats.push({ nom: v.nom, hote: v.hote, classe, reference, verdict: 'echec', motif: (p && p.motif) || 'echec' });
      exitCode = 1;
    }
  }
  return { resultats, exitCode };
}

// Ligne « NON alimentee » du fan-out par defaut (§ 6, `update` SANS `--publier`) : informe SANS
// jamais publier. `classement` = { classe, reference } (rendu de `classerPublication`) ou null si
// `lectureOk` est false ; `candidat` = tag candidat local (`tagCandidat`, '' si aucun). PURE.
export function formaterVitrineDefaut({ nom, hote, candidat, classement, lectureOk }) {
  const prefixe = `  i vitrine ${nom} NON alimentee : `;
  if (!candidat) return `${prefixe}aucun tag de release vX.Y.Z sur la branche.`;
  if (lectureOk === false || !classement) return `${prefixe}classement impossible (vitrine injoignable).`;
  const { classe, reference } = classement;
  const ref = reference || 'aucun tag';
  if (classe === 'patch') {
    return `${prefixe}${candidat} est un correctif (vitrine a ${ref}), pas de publication GitHub pour un patch.`;
  }
  if (classe === 'majeure' || classe === 'mineure' || classe === 'premiere') {
    return `${prefixe}${candidat} = version ${classe} (vitrine a ${ref}), publiable par le decideur : iakaframe update --publier ${candidat}`;
  }
  if (classe === 'deja-publie' || classe === 'inferieure') {
    return `${prefixe}${candidat} deja couvert par la vitrine (${reference}).`;
  }
  // hote conserve dans la signature pour un usage futur (message d'erreur qualifie) ; sans effet ici.
  void hote;
  return `${prefixe}classement impossible (vitrine injoignable).`;
}
