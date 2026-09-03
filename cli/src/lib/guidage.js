// iakaframe — moteur de selection du mode guide terminal (Lot A, paliers 1 ET 2, specs/
// instructions/cli-mode-guide-selections.md § LOT A).
//
// ZERO DEPENDANCE (CA-1) : `node:readline`/`node:readline/promises` uniquement, aucun
// `inquirer`/`prompts`/`enquirer`/`@clack/prompts`. `readline` et `process.stdin` ne sont lus QUE
// dans ce fichier et dans `lib/interactif.js` (G3b) — toute commande qui recreerait son propre
// prompt reproduirait M3, exactement ce que ce module existe pour eviter.
//
// AUCUNE VALEUR METIER EN DUR (G3a) : ce fichier ne contient aucun tableau de personas, modeles,
// collections, `kind`. Les `items` proposes sont TOUJOURS fournis par l'appelant, qui les a lus
// depuis l'AUTORITE reelle (personasForTarget, ACCEPTED_VOCABULARY, scan(), etc. — cf. M7). Ce
// module ne sait rendre QU'une liste qu'on lui donne.
//
// Deux paliers, DERRIERE LA MEME INTERFACE (A1 : « le palier 1 n'est pas un brouillon du palier 2,
// il en est le filet ») :
//   - `choisirDansListe({ ask, ... })` — palier 1 (liste numerotee), CORE testable, `ask` INJECTE
//     EXACTEMENT sur le modele deja eprouve de `pickAndAct` (models.js:519-521) : « ask/yes sont
//     injectes […] ce qui la rend jouable dans un test en lui passant des reponses scriptees ».
//     C'est la couture du controle POSITIF G2 (§ Preuve) — sans elle G1 (« rien ne change en
//     non-TTY ») serait un temoin vide.
//   - `choisirAuClavier(...)` — palier 2 (fleches + surbrillance + filtre a la frappe, mode brut).
//     NON TESTABLE de bout en bout — Node n'embarque pas de pty, et `node-pty` serait une
//     DEPENDANCE (CA-1, interdite). Sa recette est MANUELLE, sur DEUX OS (CA-13) : « cochee par
//     l'humain, ou le palier n'est pas livre ».
// `selectionner(...)` — entree de PRODUCTION unique : tente le palier 2 et REPLIE
// AUTOMATIQUEMENT sur le palier 1 des que le mode brut n'est pas disponible (terminal exotique,
// Windows ancien, ou tout simplement pas de TTY).
import readline from 'node:readline';
import readlinePromises from 'node:readline/promises';

// --- Interdiction A4.3 (NON NEGOCIABLE) ---------------------------------------------------------
// Le guidage n'AJOUTE JAMAIS ces echappatoires — ni dans un argv assemble, ni comme entree de
// menu. Un guidage qui les proposerait annulerait la garde posee par l'Amendement A (`models set`
// refuse desormais une valeur hors grammaire). Filet RUNTIME : `assemblerArgv` refuse de rendre un
// argv qui en contient une — mutation-eprouvable (retirer ce controle fait rougir son propre test).
export const ECHAPPATOIRES_INTERDITES = ['--force', '--yes', '--cascade', '--autoriser-creation-depot'];

export function assemblerArgv(argv) {
  for (const tok of argv) {
    if (ECHAPPATOIRES_INTERDITES.includes(tok)) {
      throw new Error(`guidage : echappatoire interdite dans un argv assemble (A4.3) : ${tok}`);
    }
  }
  return argv;
}

// --- A3 : commande equivalente, imprimee, non desactivable --------------------------------------
// `argvComplet` INCLUT le nom du verbe (ex. ['models','set','gandalf','opus[1m]','--path', p]).
function echapperArg(arg) {
  return /\s/.test(arg) ? `"${arg}"` : arg;
}

export function ligneEquivalente(argvComplet) {
  return `  → iakaframe ${argvComplet.map(echapperArg).join(' ')}`;
}

// --- Palier 1 : liste numerotee (CORE testable, ask injecte) ------------------------------------
// `items` = [{ id, label }]. Rend :
//   { type: 'item', item }   — un item choisi
//   { type: 'libre', valeur }— l'utilisateur a choisi de saisir une valeur libre (A4.1)
//   { type: 'vide' }         — aucun item ET pas d'entree libre : rien a proposer (R7)
//   { type: 'annule' }       — reponse vide ou hors bornes : rien n'a ete choisi
export async function choisirDansListe({
  ask, items, titre, permettreLibre = false, libelleLibre = 'saisir une valeur libre', log = console.log,
}) {
  if (!items.length && !permettreLibre) return { type: 'vide' };

  log(`\n${titre}`);
  items.forEach((it, i) => log(`  ${i + 1}. ${it.label ?? it.id}`));
  const idxLibre = items.length + 1;
  if (permettreLibre) log(`  ${idxLibre}. ${libelleLibre}`);

  const reponse = (await ask(`Numero (vide = annuler) : `)).trim();
  if (!reponse) return { type: 'annule' };

  const idx = parseInt(reponse, 10);
  if (permettreLibre && idx === idxLibre) {
    const valeur = (await ask('Valeur libre : ')).trim();
    return { type: 'libre', valeur };
  }
  if (Number.isNaN(idx) || idx < 1 || idx > items.length) return { type: 'annule' };
  return { type: 'item', item: items[idx - 1] };
}

// --- Palier 2 : mode brut (fleches/surbrillance/filtre) ------------------------------------------
// Piege nomme par la doc Node (tty) : « Ctrl+C will no longer cause a SIGINT when in this mode » —
// intercepte EXPLICITEMENT ici (`surTouche`), jamais laisse pendre. Le terminal est RESTAURE dans
// TOUS les chemins de sortie (choix, annulation, Ctrl-C, erreur) : `finir()` est le SEUL point de
// resolution, et il restaure AVANT de resoudre.
const CTRL_C = String.fromCharCode(3);
const ANSI_REVERSE = '\x1b[7m';
const ANSI_RESET = '\x1b[0m';
const ansiMoveUp = (n) => `\x1b[${n}A`;
const ANSI_CLEAR_DOWN = '\x1b[0J';

// Rend { type: 'item', item } | { type: 'demande-libre' } | { type: 'annule', motif }.
// `demande-libre` est traduit par `selectionner()` en une question texte CLASSIQUE (mode cuit) :
// saisir un id lettre par lettre EN mode brut ajouterait un moteur de saisie de texte complet pour
// un gain nul — l'entree libre n'a, par definition, AUCUN vocabulaire ferme a naviguer aux fleches.
export function choisirAuClavier({
  items, titre, permettreLibre = false, libelleLibre = 'saisir une valeur libre',
  input = process.stdin, output = process.stdout,
}) {
  return new Promise((resolve) => {
    let curseur = 0;
    let filtre = '';
    let lignesPrecedentes = 0;
    let termine = false;

    const entreeLibre = permettreLibre ? [{ id: '__libre__', label: libelleLibre, libre: true }] : [];
    const tous = [...items, ...entreeLibre];

    function visibles() {
      if (!filtre) return tous;
      const f = filtre.toLowerCase();
      return tous.filter((it) => String(it.label ?? it.id).toLowerCase().includes(f));
    }

    function effacer() {
      if (lignesPrecedentes > 0) output.write(ansiMoveUp(lignesPrecedentes) + ANSI_CLEAR_DOWN);
    }

    function dessiner() {
      effacer();
      const liste = visibles();
      if (curseur >= liste.length) curseur = Math.max(0, liste.length - 1);
      const lignes = [`${titre}${filtre ? `  (filtre : ${filtre})` : ''}`];
      if (!liste.length) lignes.push('  (aucune correspondance)');
      liste.forEach((it, i) => {
        const label = String(it.label ?? it.id);
        lignes.push(i === curseur ? `> ${ANSI_REVERSE}${label}${ANSI_RESET}` : `  ${label}`);
      });
      lignes.push('  (fleches : deplacer · entree : choisir · frappe : filtrer · echap : effacer · ctrl-c : annuler)');
      output.write(lignes.join('\n') + '\n');
      lignesPrecedentes = lignes.length;
    }

    // Point UNIQUE de resolution : restaure le terminal AVANT de resoudre, dans TOUS les cas
    // (choix, annulation, Ctrl-C, erreur) — R8, « restaure le terminal dans tous les chemins de
    // sortie ».
    function finir(resultat) {
      if (termine) return;
      termine = true;
      input.removeListener('keypress', surTouche);
      try { if (typeof input.setRawMode === 'function') input.setRawMode(false); } catch { /* deja restaure */ }
      resolve(resultat);
    }

    function surTouche(str, key) {
      try {
        if (!key) return;
        // Interception EXPLICITE de Ctrl-C (doc Node tty : il n'emet plus SIGINT en mode brut) —
        // traite comme une annulation PROPRE, jamais un blocage muet du terminal.
        if (key.sequence === CTRL_C || (key.ctrl && key.name === 'c')) {
          finir({ type: 'annule', motif: 'interrompu (ctrl-c)' }); return;
        }
        if (key.name === 'return' || key.name === 'enter') {
          const it = visibles()[curseur];
          if (!it) { finir({ type: 'annule' }); return; }
          finir(it.libre ? { type: 'demande-libre' } : { type: 'item', item: it });
          return;
        }
        if (key.name === 'up') { curseur = Math.max(0, curseur - 1); dessiner(); return; }
        if (key.name === 'down') { curseur = Math.min(visibles().length - 1, curseur + 1); dessiner(); return; }
        if (key.name === 'escape') { filtre = ''; curseur = 0; dessiner(); return; }
        if (key.name === 'backspace') { filtre = filtre.slice(0, -1); curseur = 0; dessiner(); return; }
        if (str && !key.ctrl && !key.meta && str.length === 1 && str >= ' ') {
          filtre += str; curseur = 0; dessiner(); return;
        }
      } catch {
        finir({ type: 'annule', motif: 'erreur mode brut' });
      }
    }

    if (typeof input.setRawMode !== 'function') { finir({ type: 'annule', motif: 'mode brut indisponible' }); return; }
    try {
      readline.emitKeypressEvents(input);
      input.setRawMode(true);
      input.on('keypress', surTouche);
      dessiner();
    } catch {
      finir({ type: 'annule', motif: "erreur d'initialisation du mode brut" });
    }
  });
}

// --- Capacite : le mode brut est-il seulement ENVISAGEABLE ? -------------------------------------
export function peutModeBrut(input = process.stdin, output = process.stdout) {
  return Boolean(input && input.isTTY && typeof input.setRawMode === 'function' && output && output.isTTY);
}

// --- Entree de PRODUCTION : tente le palier 2, REPLI AUTOMATIQUE sur le palier 1. Pas de `ask`
//     injecte ici (c'est la couche production, pas la couture de test — cf. choisirDansListe). ---
export async function selectionner({
  items, titre, permettreLibre = false, libelleLibre = 'saisir une valeur libre',
  input = process.stdin, output = process.stdout,
}) {
  // R7 (autorite vide) : ni item ni entree libre -> rien a proposer, AVANT d'ouvrir quoi que ce
  // soit (jamais un menu vide, ni en mode brut ni en liste).
  if (!items.length && !permettreLibre) return { type: 'vide' };

  if (peutModeBrut(input, output)) {
    try {
      const res = await choisirAuClavier({ items, titre, permettreLibre, libelleLibre, input, output });
      // `demande-libre` : le mode brut a rendu la main (raw off) sur l'entree « saisir une valeur
      // libre » — la saisie elle-meme repasse par une question CLASSIQUE (mode cuit).
      if (res.type === 'demande-libre') {
        const rl = readlinePromises.createInterface({ input, output });
        try {
          const valeur = (await rl.question('Valeur libre : ')).trim();
          return { type: 'libre', valeur };
        } finally {
          rl.close();
        }
      }
      return res;
    } catch {
      // Repli automatique (A1) : toute anomalie du mode brut (terminal exotique) retombe sur le
      // palier 1, jamais une exception qui remonterait jusqu'a l'appelant.
    }
  }

  const rl = readlinePromises.createInterface({ input, output });
  try {
    const ask = (q) => rl.question(q);
    return await choisirDansListe({ ask, items, titre, permettreLibre, libelleLibre });
  } finally {
    rl.close();
  }
}
