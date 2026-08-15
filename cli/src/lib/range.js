// Sauvegarde du portefeuille — mecanique du verbe `iakaframe range` (alias `iaka range`).
// Instruction : specs/instructions/sauvegarde-portefeuille.md (lot 1).
//
// CE QUE CE MODULE FAIT : composer et lancer UN `restic backup`, soit sur tout le dossier
// chapeau (`all`), soit sur UN projet nomme. Rien d'autre. Il n'ecrit aucun calendrier, ne
// supprime rien, et n'appelle JAMAIS `forget`/`prune` — la destruction n'appartient pas a ce
// verbe (lot 1 : « on cree un depot, on ne supprime rien »).
//
// 🛑 LE SECRET NE TRANSITE PAS PAR CE FICHIER. Le mot de passe du depot ne vit ni ici, ni sur
// le poste : il est LU A LA VOLEE sur une machine tierce par une COMMANDE (`--password-command`),
// dont restic prend la SORTIE STANDARD. Consequence directe et voulue : le secret n'apparait
// dans aucun `argv`, donc dans aucun `ps`, dans aucun log, dans aucun fichier du depot git.
// Ce qui est ecrit ici est un CHEMIN et un HOTE — pas une valeur sensible.
//
// 🛑 POURQUOI LA CLE N'EST PAS SUR LA MACHINE QUI PORTE LE DEPOT. Decision `D5`, avec sa garde
// de conception : le depot vit sur `bigserver`, la cle vit sur `iakabox-apps`. Les poser au meme
// endroit donnerait, a qui compromet cette machine, ET les donnees chiffrees ET la cle — le
// chiffrement ne protegerait alors plus de rien.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolveRoot } from './root.js';
import { hasCmd } from './which.js';

// Cible par defaut : le depot COURT, sur le systeme de fichiers LOCAL de `bigserver` (`D3`).
// SFTP et non un depot local sur montage NFS : les verrous restic sur NFS sont documentes comme
// problematiques (`F16`). Ce ne sont pas des donnees en clair qui transitent — restic chiffre
// COTE CLIENT, avant tout envoi.
export const DEFAULT_REPOSITORY = 'sftp:bigserver:/fast/backups/portefeuille';

// Lecture de la cle sur une TROISIEME machine (`D5`). `BatchMode=yes` : on echoue franchement
// plutot que d'attendre une saisie interactive qui ne viendra jamais sous automatisation.
export const DEFAULT_PASSWORD_COMMAND =
  'ssh -o BatchMode=yes iakabox-apps cat /root/.config/iakaframe/restic-portefeuille.pass';

// Etiquette commune a tous les instantanes produits par ce verbe : elle permet de les retrouver
// (`restic snapshots --tag iaka-range`) sans dependre du chemin ni de la date.
export const TAG_RANGE = 'iaka-range';

// Le fichier d'exclusion VIDE de `D4` — point de debrayage, versionne dans ce depot.
// Resolution depuis ce module : cli/src/lib/ -> cli/src/ -> cli/ -> racine du depot.
export function defaultExcludeFile() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..', '..', '..', 'config', 'sauvegarde-exclusions.txt');
}

// Un nom de projet est un SEGMENT, jamais un chemin. Tout ce qui pourrait sortir du dossier
// chapeau est refuse AVANT le moindre acces disque : `..`, un separateur, un absolu, un nom qui
// commence par `-` (il serait lu comme une option par restic).
export function validerNomProjet(nom) {
  if (typeof nom !== 'string' || nom.trim() === '') return 'nom de projet vide';
  if (nom !== nom.trim()) return `nom de projet avec espaces en bordure : "${nom}"`;
  if (nom === '.' || nom === '..') return `nom de projet interdit : "${nom}"`;
  if (nom.startsWith('-')) return `nom de projet interdit (lu comme une option) : "${nom}"`;
  if (nom.includes('/') || nom.includes('\\')) return `nom de projet interdit (chemin, pas un nom) : "${nom}"`;
  if (path.isAbsolute(nom)) return `nom de projet interdit (chemin absolu) : "${nom}"`;
  return null;
}

// Liste des candidats du dossier chapeau : les REPERTOIRES de premier niveau. Sert a l'aide et,
// surtout, au message de REFUS — un refus qui ne dit pas quoi taper a la place est un mur.
export function listerProjets(root) {
  let entries = [];
  try { entries = fs.readdirSync(root, { withFileTypes: true }); } catch { return []; }
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));
}

// Resout le PERIMETRE demande en un chemin absolu + les etiquettes qui l'identifient.
// `cible` vaut 'all' (tout le chapeau) ou un nom de projet.
// 🛑 Un nom inconnu est REFUSE EXPLICITEMENT : il ne retombe jamais sur `all`, et ne produit
// jamais un instantane vide qui aurait l'air d'avoir marche. (Famille `CTRL-1` : un argument non
// reconnu ne retombe pas sur le defaut.)
export function resoudrePerimetre(cible, root) {
  if (cible === 'all') {
    if (!fs.existsSync(root)) throw new Error(`dossier chapeau introuvable : ${root}`);
    return { portee: 'all', projet: null, chemin: root, tags: [TAG_RANGE, 'perimetre:all'] };
  }

  const faute = validerNomProjet(cible);
  if (faute) throw new Error(`${faute}\nAttendu : "all" ou le nom d'un projet du chapeau (${root}).`);

  const chemin = path.join(root, cible);
  let st = null;
  try { st = fs.statSync(chemin); } catch { st = null; }
  if (!st || !st.isDirectory()) {
    const connus = listerProjets(root);
    throw new Error(
      `projet inconnu : "${cible}" (aucun repertoire ${chemin})\n` +
      `${connus.length} projet(s) connu(s) sous ${root}. Les lister : iakaframe range --list`
    );
  }
  return { portee: 'projet', projet: cible, chemin, tags: [TAG_RANGE, `projet:${cible}`] };
}

// Compose l'argv de `restic`. Fonction PURE : c'est elle que les tests interrogent, pour que le
// contrat (etiquettes, fichier d'exclusion, chemin) soit verifiable SANS depot ni reseau.
export function buildBackupArgs(perimetre, { excludeFile, dryRun = false, json = false } = {}) {
  const args = ['backup', perimetre.chemin];
  if (excludeFile) args.push('--exclude-file', excludeFile);
  for (const t of perimetre.tags) args.push('--tag', t);
  if (dryRun) args.push('--dry-run');
  if (json) args.push('--json');
  return args;
}

// Environnement du processus fils. Le mot de passe n'y figure PAS : seulement la COMMANDE qui
// sait aller le chercher.
export function buildEnv({ repository, passwordCommand }, base = process.env) {
  return { ...base, RESTIC_REPOSITORY: repository, RESTIC_PASSWORD_COMMAND: passwordCommand };
}

// Extrait le resume final du flux nd-json de `restic backup --json` (une ligne = un message ;
// la derniere de type `summary` porte les compteurs). Rendu null si absent : on ne fabrique
// jamais un chiffre qu'on n'a pas lu.
export function extraireResume(stdout) {
  let resume = null;
  for (const ligne of String(stdout || '').split('\n')) {
    const t = ligne.trim();
    if (!t.startsWith('{')) continue;
    try { const o = JSON.parse(t); if (o.message_type === 'summary') resume = o; } catch { /* ligne partielle */ }
  }
  return resume;
}

// Lance la sauvegarde. En mode humain, la sortie de restic est HERITEE (progression visible en
// direct sur une premiere passe de plusieurs minutes) ; en `--json`, elle est capturee et reduite
// au resume.
export function lancerSauvegarde(perimetre, opts) {
  if (!hasCmd('restic')) {
    throw new Error(
      'restic est introuvable dans le PATH.\n' +
      "Le verbe `range` ne sait pas sauvegarder sans lui — il ne fait pas semblant.\n" +
      'Installation : binaire officiel restic >= 0.14 (format de depot v2, compression).'
    );
  }
  const excludeFile = opts.excludeFile ?? defaultExcludeFile();
  if (!fs.existsSync(excludeFile)) {
    throw new Error(
      `fichier d'exclusion introuvable : ${excludeFile}\n` +
      "C'est le POINT DE DEBRAYAGE de `D4` : on ne sauvegarde pas sans lui, sinon personne ne peut\n" +
      "dire si une exclusion s'est appliquee. Le retablir, ou passer --exclude-file <fichier>."
    );
  }

  const args = buildBackupArgs(perimetre, { excludeFile, dryRun: opts.dryRun, json: opts.json });
  const env = buildEnv(opts);
  const debut = Date.now();
  const r = spawnSync('restic', args, {
    env,
    encoding: 'utf8',
    stdio: opts.json ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    maxBuffer: 64 * 1024 * 1024,
  });
  const dureeMs = Date.now() - debut;
  if (r.error) throw r.error;

  return {
    code: r.status,
    dureeMs,
    args,
    resume: opts.json ? extraireResume(r.stdout) : null,
    stderr: opts.json ? String(r.stderr || '').trim() : null,
  };
}

export { resolveRoot };
