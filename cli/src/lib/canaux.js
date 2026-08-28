// Trois canaux synchrones — mecanique commune au fan-out d'ecriture (0.a) et au verbe de
// synchronisation (0.c). Instruction : specs/instructions/bundle-complet-install-4-composants.md,
// § 0 et § 5 « lot 0 ».
//
// PRINCIPE DIRECTEUR, non negociable (§ 0) : une cible injoignable n'est PAS une erreur, c'est
// un ETAT A DIRE. Corollaire R7 : aucune sortie de ce module ne dit « sauvegarde » sans NOMMER
// les cibles qui ont recu. C'est le defaut mesure A2 (GitHub a 15 commits de retard sans que
// rien ne le dise) qui commande cette forme.
//
// ZERO dependance : git en processus fils, comme lib/git.js.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Delai par cible, en secondes. Un checkpoint qui pend sur une forge morte est un checkpoint
// qu'on desactive : la borne est ce qui rend le fan-out utilisable quand DEUX cibles sur trois
// sont hors service (cas reel du 2026-08-28).
export const DELAI_DEFAUT_S = 20;

// 🛑 Le credential VIT DANS L'URL DES REMOTES de ce portefeuille (pattern iakabox :
// http://user:token@hote/...). git le recopie tel quel dans ses messages d'erreur. Sans ce
// masque, la premiere forge injoignable ecrirait le token en clair sur stdout, dans les logs
// de hook et dans toute main courante. Applique a TOUT ce que ce module rend lisible.
export function masquerSecrets(txt) {
  return String(txt == null ? '' : txt).replace(/(\w+:\/\/)([^\s/@:]+):([^\s/@]+)@/g, '$1$2:***@');
}

// Lance git avec une BORNE de temps et sans invite interactive possible (une invite de mot de
// passe sur une forge injoignable pendrait indefiniment en contexte non interactif).
export function gitBorne(cwd, args, { timeoutMs = DELAI_DEFAUT_S * 1000 } = {}) {
  const r = spawnSync('git', args, {
    cwd, encoding: 'utf8', timeout: timeoutMs, killSignal: 'SIGKILL',
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_ASKPASS: '', SSH_ASKPASS: '' },
  });
  const expire = r.error && (r.error.code === 'ETIMEDOUT' || r.signal === 'SIGKILL');
  return {
    ok: !expire && r.status === 0,
    expire: Boolean(expire),
    out: masquerSecrets((r.stdout || '').trim()),
    err: masquerSecrets((r.stderr || '').trim() || (r.error ? r.error.message : '')),
  };
}

// Les remotes configures, dans un ordre STABLE et explicable : `origin` d'abord (cible
// historique du portefeuille), puis les autres dans l'ordre de git (alphabetique).
// Fonction PURE a partir de la sortie de `git remote` — testable sans depot.
export function ordonnerRemotes(noms) {
  const uniq = [...new Set(noms.filter(Boolean))];
  return [...uniq.filter(n => n === 'origin'), ...uniq.filter(n => n !== 'origin')];
}

export function listerRemotes(cwd) {
  const r = gitBorne(cwd, ['remote'], { timeoutMs: 5000 });
  if (!r.ok) return [];
  return ordonnerRemotes(r.out.split(/\r?\n/).map(s => s.trim()));
}

// Classe l'echec d'un geste reseau git. On NOMME le motif au lieu de deverser une stack : c'est
// ce qui permet de distinguer « la forge est eteinte » (etat, normal) de « la forge refuse ce
// que je pousse » (defaut, a traiter). Jamais de devinette : ce qui n'est pas reconnu reste
// « echec » avec son detail brut (masque).
export function classerEchec({ expire, err }) {
  if (expire) return 'delai-depasse';
  const e = String(err || '');
  if (/non-fast-forward|fetch first|rejected.*(fetch|behind)|Updates were rejected/i.test(e)) return 'refus-non-fast-forward';
  if (/could not resolve host|Connection refused|Network is unreachable|No route to host|unable to access|Could not read from remote repository|Failed to connect|timed out|Operation timed out|EADDRNOTAVAIL/i.test(e)) return 'injoignable';
  if (/Authentication failed|401|403|Permission denied/i.test(e)) return 'refus-authentification';
  return 'echec';
}

// Pousse UNE branche vers CHAQUE remote, chaque cible reussissant ou echouant INDEPENDAMMENT.
// Ne leve jamais : un echec est une ligne de resultat, pas une exception (CA-9).
// `amont` : nom du remote pour lequel on pose l'upstream (-u). Reserve au PREMIER push d'un
// projet (onboard) ; un checkpoint quotidien ne reecrit jamais l'upstream.
export function pousserFanout(cwd, branche, remotes, { timeoutMs, amont = '' } = {}) {
  const resultats = [];
  for (const remote of remotes) {
    const args = ['push', ...(amont && remote === amont ? ['-u'] : []), remote, branche];
    const r = gitBorne(cwd, args, { timeoutMs });
    resultats.push(r.ok
      ? { remote, ok: true, motif: '', detail: '' }
      : { remote, ok: false, motif: classerEchec(r), detail: premiereLigne(r.err) });
  }
  return resultats;
}

function premiereLigne(txt) {
  const l = String(txt || '').split(/\r?\n/).filter(Boolean);
  // La derniere ligne de git porte le « fatal: ... » ; la premiere porte souvent le bruit.
  const utile = l.reverse().find(x => /fatal|error|remote:|rejected/i.test(x)) || l[0] || '';
  return utile.slice(0, 160);
}

// Verdict d'un fan-out : qui a recu, qui n'a pas recu. Fonction PURE — c'est elle qui interdit
// de dire « sauvegarde » sans nommer les cibles (R7).
export function verdictFanout(resultats) {
  const servies = resultats.filter(r => r.ok).map(r => r.remote);
  const nonServies = resultats.filter(r => !r.ok).map(r => r.remote);
  return {
    servies, nonServies,
    total: resultats.length,
    aucune: resultats.length > 0 && servies.length === 0,
    toutes: resultats.length > 0 && nonServies.length === 0,
  };
}

// Rendu humain du fan-out. Chaque cible a SA ligne, nommee — jamais un « pousse » global.
export function formaterFanout(resultats, branche) {
  const lignes = resultats.map(r => r.ok
    ? `  [OK] ${r.remote} <- ${branche}`
    : `  [--] ${r.remote} NON servi : ${r.motif}${r.detail ? ` (${r.detail})` : ''}`);
  const v = verdictFanout(resultats);
  if (v.total === 0) {
    lignes.push('  ! AUCUN remote configure : rien n a ete pousse, le commit n existe que localement.');
  } else if (v.aucune) {
    // R7 : ne JAMAIS laisser croire a une sauvegarde. Le commit local existe, c'est tout.
    lignes.push(`  ! AUCUNE des ${v.total} cibles n a recu : le commit n existe QUE localement.`);
  } else {
    lignes.push(`  Recu par : ${v.servies.join(', ')}${v.nonServies.length ? ` | non servi : ${v.nonServies.join(', ')}` : ''}`);
  }
  return lignes;
}

// =================================================================================================
// MESURE (0.c) — « les trois sont-ils d'accord ? » et « que faut-il rattraper ? »
// =================================================================================================
//
// GARDE D'HONNETETE, heritee de `range` (§ 9 de l'instruction) : un etat MESURE EN DIRECT et un
// etat DATE DU DERNIER FETCH ne se confondent JAMAIS. Ici, tout ce qui est rendu sous `etat` sort
// d'un `git ls-remote` fait a l'instant ; ce qui vient d'une ref locale est range a part, sous
// `dernierConnu`, avec sa propre date (ou l'aveu qu'elle est inconnue). `range` reste zero-reseau
// par choix assume ; CE chemin-ci est le chemin reseau, assume et declare.

// Etats possibles d'un canal. `inconnu` existe a dessein : on prefere avouer qu'on ne sait pas
// plutot que de fabriquer un ecart (defaut A2 : c'est le silence, pas l'ecart, qui a coute).
export const ETATS = ['a-jour', 'en-retard', 'en-avance', 'divergent', 'branche-absente', 'injoignable', 'inconnu'];

// Sha local de la branche ('' si la branche n'existe pas).
export function shaLocal(cwd, branche) {
  const r = gitBorne(cwd, ['rev-parse', '--verify', `refs/heads/${branche}`], { timeoutMs: 5000 });
  return r.ok ? r.out : '';
}

const aLObjet = (cwd, sha) => gitBorne(cwd, ['cat-file', '-e', `${sha}^{commit}`], { timeoutMs: 5000 }).ok;
const compte = (cwd, a, b) => {
  const r = gitBorne(cwd, ['rev-list', '--count', `${a}..${b}`], { timeoutMs: 15000 });
  return r.ok ? Number(r.out) : null;
};
const estAncetre = (cwd, a, b) => gitBorne(cwd, ['merge-base', '--is-ancestor', a, b], { timeoutMs: 15000 }).ok;

// Dernier etat CONNU d'un canal, lu dans les refs LOCALES. Ce n'est PAS une mesure : c'est un
// souvenir, date du dernier fetch. Rendu a part, et jamais melange a `etat`.
export function dernierConnu(cwd, remote, branche) {
  const r = gitBorne(cwd, ['rev-parse', '--verify', `refs/remotes/${remote}/${branche}`], { timeoutMs: 5000 });
  if (!r.ok) return null;
  let date = null;
  try {
    // Seule une ref LACHE porte une date de fichier ; une ref empaquetee n'en a pas. On avoue
    // `null` plutot que de dater le souvenir avec la date du paquet, qui ne veut rien dire.
    const f = path.join(cwd, '.git', 'refs', 'remotes', remote, branche);
    date = fs.statSync(f).mtime.toISOString();
  } catch { date = null; }
  return { sha: r.out, date };
}

// Mesure UN canal, en direct. Ne leve jamais.
export function mesurerCanal(cwd, remote, branche, { timeoutMs } = {}) {
  const local = shaLocal(cwd, branche);
  const base = { remote, branche, local, distant: null, etat: 'inconnu', retard: null, avance: null, motif: '', detail: '', dernierConnu: null };

  const ls = gitBorne(cwd, ['ls-remote', '--heads', remote, branche], { timeoutMs });
  if (!ls.ok) {
    return { ...base, etat: 'injoignable', motif: classerEchec(ls), detail: premiereLigne(ls.err),
             dernierConnu: dernierConnu(cwd, remote, branche) };
  }
  const m = ls.out.match(/^([0-9a-f]{40})\s/m);
  if (!m) return { ...base, etat: 'branche-absente', motif: `la branche ${branche} n existe pas sur ${remote}` };

  const distant = m[1];
  if (!local) return { ...base, distant, etat: 'inconnu', motif: `branche ${branche} absente en local` };
  if (distant === local) return { ...base, distant, etat: 'a-jour', retard: 0, avance: 0 };

  // Comparer exige d'AVOIR l'objet distant. On le recupere si besoin (fetch : ecrit des objets et
  // FETCH_HEAD, ne deplace aucune de nos branches). Si on ne l'obtient pas, on dit `inconnu` —
  // on ne devine pas un sens d'ecart.
  if (!aLObjet(cwd, distant)) gitBorne(cwd, ['fetch', '--quiet', remote, branche], { timeoutMs });
  if (!aLObjet(cwd, distant)) {
    return { ...base, distant, etat: 'inconnu', motif: 'objet distant indisponible localement (fetch impossible)' };
  }

  const distantEstAncetre = estAncetre(cwd, distant, local);
  const localEstAncetre = estAncetre(cwd, local, distant);
  if (distantEstAncetre) return { ...base, distant, etat: 'en-retard', retard: compte(cwd, distant, local), avance: 0 };
  if (localEstAncetre) return { ...base, distant, etat: 'en-avance', retard: 0, avance: compte(cwd, local, distant) };
  return { ...base, distant, etat: 'divergent', retard: compte(cwd, distant, local), avance: compte(cwd, local, distant) };
}

export function mesurerCanaux(cwd, remotes, branche, opts = {}) {
  const mesureLe = new Date().toISOString();
  const canaux = remotes.map(r => mesurerCanal(cwd, r, branche, opts));
  return { mesureLe, branche, local: shaLocal(cwd, branche), canaux };
}

// D'accord = tous les canaux MESURES sont a jour. Un canal injoignable interdit de conclure a
// l'accord : on ne sait pas, donc on ne dit pas oui (c'est exactement la confusion qui a produit
// A2 — trois remotes configures pris pour trois sauvegardes, R7).
export function accord(canaux) {
  if (!canaux.length) return false;
  return canaux.every(c => c.etat === 'a-jour');
}

// 🛑 RATTRAPAGE — CA-13 / R8. Ne pousse QUE ce qui est une AVANCE RAPIDE stricte, et REFUSE le
// reste EN LE DISANT. Aucun `--force`, aucun `+refs`, jamais : pousser sur un depot qui porte des
// commits qu'on n'a pas ecraserait le travail d'une autre machine.
export function rattraper(cwd, mesure, { timeoutMs } = {}) {
  const actions = [];
  for (const c of mesure.canaux) {
    if (c.etat === 'a-jour') { actions.push({ remote: c.remote, action: 'inutile', motif: 'deja a jour' }); continue; }
    if (c.etat === 'en-retard' || c.etat === 'branche-absente') {
      const r = gitBorne(cwd, ['push', c.remote, mesure.branche], { timeoutMs });
      actions.push(r.ok
        ? { remote: c.remote, action: 'pousse', motif: c.etat === 'branche-absente' ? `branche ${mesure.branche} creee` : `avance rapide de ${c.retard} commit(s)` }
        : { remote: c.remote, action: 'echec', motif: classerEchec(r), detail: premiereLigne(r.err) });
      continue;
    }
    if (c.etat === 'en-avance') {
      actions.push({ remote: c.remote, action: 'refuse',
        motif: `le distant porte ${c.avance} commit(s) absent(s) en local : ce n est pas une avance rapide. Recuperer d abord (git pull --ff-only ${c.remote} ${mesure.branche}). Jamais de --force.` });
      continue;
    }
    if (c.etat === 'divergent') {
      actions.push({ remote: c.remote, action: 'refuse',
        motif: `divergence : ${c.avance} commit(s) cote ${c.remote} contre ${c.retard} en local. Ce n est pas une avance rapide ; a reconcilier a la main. Jamais de --force.` });
      continue;
    }
    actions.push({ remote: c.remote, action: 'impossible', motif: c.motif || c.etat });
  }
  return actions;
}
