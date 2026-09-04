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

// --- Port de feu vert NON-TTY (AR-M1(a), contrat-machine-du-verbe-install.md § 5 etape 3) -------
// SEUL endroit legitime pour ce second lecteur de `stdin` (G3b : `readline`/`process.stdin` ne se
// lisent que dans ce fichier et lib/guidage.js) — jamais recree dans `commands/install.js`.
// `askYesNo` (ci-dessus) N'EST PAS TOUCHE : c'est un chemin distinct, pour un protocole distinct.
//
// Lit UNE SEULE ligne sur `input` (non-TTY : l'option `terminal` de readline vaut `false` par
// defaut hors TTY, § 0.5 de l'instruction — explicitement force ici pour ne JAMAIS dependre de
// l'ambiant). Deux formes de reponse tolerees : un objet `{"etape":n,"reponse":"oui"|"non"}`, ou
// une ligne nue `oui`/`non` (suppose repondre a `etape`, l'etape demandee). Rend TOUJOURS
// `{ accorde, motif }` — jamais une exception : le defaut est le REFUS (CA-M5), sur cinq chemins
// distincts, chacun motive :
//   1. EOF avant toute ligne (stdin ferme/vide)         -> refus, motif "EOF sans reponse"
//   2. ligne vide                                        -> refus, motif "ligne vide"
//   3. JSON illisible ET ligne nue non reconnue          -> refus, motif "reponse non reconnue"
//   4. `etape` de la reponse != `etape` demandee (CA-M6) -> refus, motif "reponse hors sequence"
//   5. reponse "non" (explicite)                         -> refus, motif "feu vert refuse"
// Jamais de timeout (§ 2 du lot : le client est une UI ou un humain clique — un delai
// transformerait une hesitation en refus silencieux ; EOF est le signal de fin, pas l'horloge).
export function lireLigneFeuVert({ etape, input = process.stdin } = {}) {
  return new Promise((resolve) => {
    let settled = false;
    const rl = readline.createInterface({ input, terminal: false });
    function conclure(accorde, motif) {
      if (settled) return;
      settled = true;
      rl.close();
      resolve({ accorde, motif });
    }
    rl.once('line', (ligneBrute) => {
      const ligne = String(ligneBrute).trim();
      if (ligne === '') { conclure(false, 'ligne vide'); return; }
      let obj = null;
      try { obj = JSON.parse(ligne); } catch { /* forme nue, traitee ci-dessous */ }
      let etapeRepondue = etape;
      let reponse = ligne;
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        etapeRepondue = obj.etape;
        reponse = obj.reponse;
      }
      if (etapeRepondue !== etape) {
        conclure(false, `reponse hors sequence (etape ${JSON.stringify(etapeRepondue)} recue, ${etape} attendue) — CA-M6`);
        return;
      }
      if (reponse === 'oui') { conclure(true, 'feu vert accorde sur stdin'); return; }
      if (reponse === 'non') { conclure(false, 'feu vert refuse sur stdin'); return; }
      conclure(false, `reponse non reconnue : ${JSON.stringify(reponse)}`);
    });
    rl.once('close', () => conclure(false, 'EOF sans reponse'));
  });
}
