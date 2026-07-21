// T3 - `open` : chargement du CANON a l'ouverture d'une session, QUEL QUE SOIT le scope (§ 5.1 de
// l'instruction boucle-apprentissage-incrementale.md). On lit les deux etats plafonnes du canon
// UNIQUE (PROFIL.md + REGISTRE.md) et on les rend PRETS A INJECTER dans le contexte de session, en
// PLUS de la memoire par scope du runner (jamais en remplacement). CŒUR AGNOSTIQUE : ce module ne
// connait AUCUN runner (ni Claude Code, ni codex, ni ollama) ; le seul endroit qui connait un runner
// est le binding mince et OPTIONNEL (cli/bindings/<runner>/), isole. LECTURE SEULE : `open` ne cree
// jamais le canon (c'est un chargement, pas un init) et ne mute rien. Canon absent/vide -> sortie
// GRACIEUSE (aucun crash ; contenu vide, message clair). Zero dependance runtime (Node core).
import fs from 'node:fs';
import { statePath, loadConfig } from './memory.js';
import { listProposals, STATUS } from './review.js';
import { loadProjectCanon, renderProjectCanon } from './projectCanon.js';

// Lit un etat plafonne (profil|registre) SANS le creer. Renvoie { path, content, chars, cap, empty }.
// `empty` = aucune entree (puce) reelle : fichier absent, ou reduit a son en-tete de commentaire.
function readState(home, target, cap) {
  const p = statePath(home, target);
  const content = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
  const hasEntries = /^\s*-\s/m.test(content);
  return { path: p, content, chars: content.length, cap, empty: !hasEntries };
}

// Charge le canon pour injection. LECTURE SEULE : n'ecrit ni ne cree rien. Tous les cas d'absence
// sont graciieux (loadConfig retombe sur les defauts si config.yaml manque ; listProposals renvoie []
// si proposals/ manque). `opts.pending === false` -> saute le rappel du reservoir (optionnel).
export function loadCanon(home, opts = {}) {
  const cfg = loadConfig(home); // gracieux : defauts si config.yaml absent
  const profil = readState(home, 'profil', cfg.caps.profil);
  const registre = readState(home, 'registre', cfg.caps.registre);

  let pending = [];
  if (opts.pending !== false) {
    try {
      pending = listProposals(home, { status: STATUS.PENDING })
        .map((p) => ({ id: p.id, type: p.type, target: p.target, slug: p.slug }));
    } catch { pending = []; } // rappel du reservoir best-effort : jamais bloquant pour l'ouverture
  }

  // CANON PROJET (lot A) : il S'AJOUTE, il ne REMPLACE JAMAIS. Le canon GLOBAL ci-dessus est charge
  // INCONDITIONNELLEMENT du repertoire courant et le reste — c'est ce qui garantit qu'entrer dans un
  // projet n'AVEUGLE jamais sur la connaissance portefeuille. Un canon projet est un SILO seulement
  // s'il remplace et aveugle ; ici les deux se SUPERPOSENT (§ 3.1, § 4.3-2). Lecture seule.
  let projet = null;
  if (opts.projectPath) {
    try { projet = loadProjectCanon(opts.projectPath); }
    catch { projet = null; } // jamais bloquant pour l'ouverture
  }

  return {
    ok: true,
    home,
    empty: profil.empty && registre.empty, // canon « vide » = aucun etat ne porte d'entree
    profil,
    registre,
    projet,
    pending,
  };
}

// Rend le canon en TEXTE lisible, pret a etre injecte au demarrage d'une session (scope-agnostique).
// Le canon reste NEUTRE : aucune mention de runner ici. Contenu vide -> section « (vide) » explicite.
export function renderCanon(canon) {
  const lines = [];
  lines.push('=== CANON PORTEFEUILLE (iakaframe) ===');
  lines.push('Charge quel que soit le repertoire courant, EN PLUS de la memoire par scope du runner.');
  lines.push(`Source : ${canon.home}`);
  lines.push('');

  const section = (title, state) => {
    lines.push(`--- ${title} (<= ${state.cap} car.) ---`);
    lines.push(state.empty ? '(vide)' : state.content.replace(/\n+$/, ''));
    lines.push('');
  };
  section('PROFIL — qui est le decideur', canon.profil);
  section('REGISTRE — ce que l\'agent a appris', canon.registre);

  // Le canon PROJET vient APRES le global, jamais a sa place : l'ordre de rendu porte la doctrine.
  if (canon.projet && canon.projet.exists) lines.push(renderProjectCanon(canon.projet));

  if (canon.pending && canon.pending.length) {
    lines.push(`--- Reservoir : ${canon.pending.length} proposition(s) en attente de revue ---`);
    for (const p of canon.pending) lines.push(`  - ${p.id} [${p.type}${p.target ? `/${p.target}` : ''}]`);
    lines.push('  -> revue : `iakaframe review list`');
    lines.push('');
  }

  if (canon.empty) {
    lines.push('(Canon vide : aucun PROFIL/REGISTRE encore consolide. `iakaframe memory init` pour amorcer.)');
  }
  return lines.join('\n').replace(/\n+$/, '') + '\n';
}
