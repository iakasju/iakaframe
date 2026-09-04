// iakaframe — regle UNIQUE de non-interactivite (Lot A, noyau, M3 unifiee).
// specs/instructions/cli-mode-guide-selections.md § LOT A / M3.
//
// AVANT ce lot, DEUX regles divergentes coexistaient (M3) :
//   - models.js:1019   ne regardait QUE `process.stdin.isTTY` (pas `CI`, pas `IAKA_NON_INTERACTIF`)
//   - onboard.js:105   regardait `process.stdout.isTTY && !CI && !IAKA_NON_INTERACTIF` (pas stdin)
// Deux definitions de « suis-je interactif ? » pour le MEME risque (R1 : un prompt qui s'ouvre en
// CI/agent fait pendre un job). Ce module est desormais la SOURCE UNIQUE ; les deux appelants
// existants ET les dix cibles guidees du Lot A y transitent tous.
//
// `peutDemander({ json, guide })` rend `true` SI ET SEULEMENT SI les SIX conditions tiennent :
//   1. process.stdin.isTTY
//   2. process.stdout.isTTY
//   3. CI absent/neutre
//   4. IAKA_NON_INTERACTIF absent/neutre
//   5. json !== true
//   6. guide === true
//
// `guide` n'est PAS reserve au drapeau `--guide` (Lot A) : les DEUX flux deja interactifs
// AVANT ce lot (le process `models` sans sous-verbe, la confirmation `onboard --from-update`)
// passent `guide: true` de facon INCONDITIONNELLE a l'appel — ce ne sont pas des flux opt-in par
// drapeau, ils l'ETAIENT DEJA par construction. Le Lot A leur ajoute seulement stdout/CI/
// IAKA_NON_INTERACTIF, qu'ils n'avaient pas (ou pas tous) avant unification — cf. `docs/commandes.md`
// et le rapport de remise pour la portee exacte de ce changement de comportement observable.
//
// Zero dependance runtime. `env`/`stdin`/`stdout` sont INJECTES (defaut = les objets `process.*`
// reels) — c'est ce qui rend la regle testable condition par condition sans TTY (G4).
import readline from 'node:readline';

// « absent/neutre » = non defini, chaine vide, '0' ou 'false' — certains runners exportent
// litteralement `CI=false` (une variable presente mais FAUSSE ne doit pas activer le refus).
function neutre(valeur) {
  return valeur === undefined || valeur === '' || valeur === '0' || valeur === 'false';
}

export function peutDemander({
  json = false,
  guide = false,
  env = process.env,
  stdin = process.stdin,
  stdout = process.stdout,
} = {}) {
  if (!stdin || !stdin.isTTY) return false;
  if (!stdout || !stdout.isTTY) return false;
  if (!neutre(env.CI)) return false;
  if (!neutre(env.IAKA_NON_INTERACTIF)) return false;
  if (json === true) return false;
  if (guide !== true) return false;
  return true;
}

// Confirmation o/N a lecture unique — SOURCE UNIQUE du prompt readline (G3b, cli/test/
// guard-guidage-autorite.test.js) : PRE-EXISTANT dans onboard.js (M2, prior art), EXTRAIT ici
// pour que toute commande qui a besoin d'une confirmation (ex. `install`, AR-4) le REUTILISE au
// lieu de recreer un second lecteur de readline/stdin — exactement ce que G3b interdit. DEFAUT =
// non (seul 'o'/'oui' vaut oui). A n'appeler QUE derriere `peutDemander()` : un appelant non
// interactif ne doit jamais atteindre ce prompt (le chemin sur reste le REFUS).
export function askYesNo(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (ans) => { rl.close(); resolve(/^o(ui)?$/i.test(String(ans).trim())); });
  });
}
