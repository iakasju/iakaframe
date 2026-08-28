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
