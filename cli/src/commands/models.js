// iakaframe models - suggestions de modeles d'IA par roleKey + mise a disposition interactive.
//
// Instruction : specs/instructions/models-par-rolekey.md.
// « model » signifie ici MODELE D'IA (LLM, vision, embedding) - arbitrage du decideur 2026-08-03.
// Le meme mot designe ailleurs un MODELE DE FRAME (galerie GUI) : dette de vocabulaire consignee,
// non traitee dans ce lot.
//
// Deux etages, jamais confondus (D3) :
//   - SUGGERER par `roleKey` (portable d'une methode a l'autre)   -> models/suggestions.json
//   - AFFECTER par `personaId` dans le BINDING (I3 non rouvert)   -> bindings/<id>.md
//
// Deroule interactif impose : (1) etat des lieux par roleKey, (2) « voir les suggestions ? »,
// (3) diff, (4) installer / remplacer / retirer sur GATE HUMAIN. Aucune ecriture, aucun
// telechargement avant le gate.
//
// Neutralite des hotes (doctrine du depot, cf. services.js) : AUCUNE IP ni port prive en dur.
// Hotes via `--hosts` > IAKAFRAME_HOSTS > localhost. Ports via IAKAFRAME_OLLAMA_PORT /
// IAKAFRAME_LITELLM_PORT, defauts PUBLICS (11434 / 4000).
import { parseArgs } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline/promises';
import { getJson, sendJson } from '../lib/http.js';
import { emit, ok, fail } from '../lib/output.js';
import { libraryRoot, readEntry, scan } from '../lib/library.js';
import { activeFrameId, activeTeamId } from '../lib/frame-active.js';
import { hasCmd } from '../lib/which.js';

const FALLBACK_HOSTS = ['localhost', '127.0.0.1'];
const OLLAMA_PORT = Number(process.env.IAKAFRAME_OLLAMA_PORT) || 11434;
const LITELLM_PORT = Number(process.env.IAKAFRAME_LITELLM_PORT) || 4000;
// Peremption des suggestions : au-dela, l'etat des lieux le DIT (R1 : une table se perime en
// silence ; trois ancetres l'ont prouve). 90 jours = un trimestre, pas une science.
const STALE_DAYS = 90;

function envHosts() {
  const raw = process.env.IAKAFRAME_HOSTS;
  if (!raw) return null;
  const list = raw.split(',').map(s => s.trim()).filter(Boolean);
  return list.length ? list : null;
}

// Les CINQ cibles du besoin, alignees sur le vocabulaire DEJA canonique (lib/vocab.js) :
// RUNNER_KINDS = [claude, chatgpt, ollama-local, ollama-distant, litellm]. Rien a inventer.
// `codex` est un HOST dans le modele persona (pas un runner canonique) : conserve ici comme
// cible d'execution locale, sans le promouvoir dans l'enum.
export const TARGETS = [
  { id: 'ollama-local',   label: 'Ollama local',  kind: 'ollama',  action: 'pull',    scope: 'local' },
  { id: 'ollama-distant', label: 'Ollama LAN',    kind: 'ollama',  action: 'pull',    scope: 'lan'   },
  { id: 'litellm',        label: 'LiteLLM LAN',   kind: 'litellm', action: 'declare', scope: 'lan'   },
  { id: 'claude',         label: 'Claude local',  kind: 'cli',     action: 'verify',  scope: 'local', bin: 'claude' },
  { id: 'codex',          label: 'Codex local',   kind: 'cli',     action: 'verify',  scope: 'local', bin: 'codex'  },
];

const HELP = `iakaframe models - modeles d'IA suggeres par roleKey, et leur mise a disposition

Usage : iakaframe models [options]

  Sans option : process INTERACTIF en 4 temps
    1. etat des lieux par roleKey (suggere / affecte / disponible)
    2. « voulez-vous voir les suggestions ? »
    3. diff suggestion <-> affectation
    4. installer / remplacer / retirer, sur validation explicite

Options :
  --json            etat des lieux en JSON sur stdout (NON interactif, aucune ecriture)
  --hosts <csv>     hotes a sonder (defaut : IAKAFRAME_HOSTS, sinon localhost)
  --timeout <s>     timeout de sonde en secondes (defaut 3)
  --path <dir>      projet dont on lit la frame active (defaut : cwd)
  --root <dir>      racine de la bibliotheque iakaframe
  --binding <id>    binding a lire/ecrire (defaut : celui de la team active marque forge-default)
                    ex. --binding iakaframe-ollama-default pour la cible modeles locaux
  --help            cette aide

Cibles de mise a disposition (--json les mesure toutes) :
  ollama-local, ollama-distant, litellm, claude, codex
  Pour claude/codex, « installer » = VERIFIER la disponibilite : il n'y a rien a telecharger.

Aucun telechargement ni aucune ecriture n'a lieu sans validation explicite.`;

// --- Source unique des suggestions (D2) ------------------------------------------------------
export function suggestionsPath(root) {
  return path.join(root, 'models', 'suggestions.json');
}

export function loadSuggestions(root) {
  const file = suggestionsPath(root);
  if (!fs.existsSync(file)) return null;
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

// Age en jours d'une date ISO courte (YYYY-MM-DD). `null` si illisible.
export function ageInDays(updatedAt, now = new Date()) {
  if (!updatedAt) return null;
  const t = Date.parse(updatedAt);
  if (Number.isNaN(t)) return null;
  return Math.floor((now.getTime() - t) / 86400000);
}

// --- Lecture du canon : roleKey -> personas -> modele affecte (D3) ----------------------------
// Ne DECIDE rien : projette la frame active sur des lignes lisibles.
export function roleRows(root, projectDir, bindingId = null) {
  const teamId = activeTeamId(projectDir, root);
  const frameId = activeFrameId(projectDir);
  const frame = readEntry('frames', frameId, root);
  const methodId = frame?.data?.methodId || null;
  const method = methodId ? readEntry('methods', methodId, root) : null;
  const team = teamId ? readEntry('teams', teamId, root) : null;

  const personaIds = toList(team?.data?.personas);
  const personas = personaIds
    .map(id => readEntry('personas', id, root))
    .filter(Boolean)
    .map(e => ({ id: e.id, name: e.data?.name || e.id, roleKey: e.data?.roleKey || null }));

  // roleKeys de la METHODE si elle les declare (source d'autorite), sinon deduits du casting.
  const declared = toList(method?.data?.roleKeys);
  const fromCasting = [...new Set(personas.map(p => p.roleKey).filter(Boolean))];
  const roleKeys = declared.length ? declared : fromCasting;

  const binding = bindingId ? pickBindingById(root, teamId, bindingId) : pickBinding(root, teamId);
  const assignments = new Map();
  for (const a of toRows(binding?.data?.assignments)) {
    if (a && a.personaId) assignments.set(String(a.personaId), a);
  }

  const rows = roleKeys.map(roleKey => {
    const cast = personas.filter(p => p.roleKey === roleKey).map(p => {
      const a = assignments.get(p.id) || {};
      return { ...p, runner: a.runner || null, model: a.model || null };
    });
    return { roleKey, personas: cast, covered: cast.length > 0 };
  });

  return { frameId, methodId, teamId, bindingId: binding?.id || null,
           bindingPath: binding?.path || null,
           bindingError: binding === undefined ? bindingId : null,
           roles: rows };
}

// Binding EXPLICITE (`--binding <id>`). Le canon peut porter plusieurs bindings pour une meme
// team (un par cible d'execution : claude, ollama...) ; sans mecanisme d'activation, le choix
// doit rester EXPLICITE plutot que devine. Un binding qui ne concerne pas la team active est
// REFUSE (`undefined`) et non silencieusement ignore : ecrire dans le binding d'une autre team
// serait exactement le defaut que le recapitulatif d'avant-gate cherche a empecher.
function pickBindingById(root, teamId, bindingId) {
  const e = readEntry('bindings', bindingId, root);
  if (!e) return undefined;
  if (teamId && String(e.data?.teamId) !== String(teamId)) return undefined;
  return e;
}

// Binding de la team active. Priorite au binding `forge-default` s'il y en a plusieurs : un choix
// implicite entre deux bindings ecrirait un jour dans le mauvais fichier (R5).
function pickBinding(root, teamId) {
  if (!teamId) return null;
  const all = scan('bindings', root)
    .map(e => readEntry('bindings', e.id, root))
    .filter(b => b && b.data && String(b.data.teamId) === String(teamId));
  if (!all.length) return null;
  return all.find(b => b.data.origin === 'forge-default') || all[0];
}

function toList(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean);
  return String(v).split(',').map(s => s.trim()).filter(Boolean);
}

function toRows(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

// --- Inventaire des cibles (C6 : on reutilise la sonde, on ne la reecrit pas) ------------------
// Hotes propres a une cible : `ollama-local` est TOUJOURS la machine locale, `ollama-distant`
// est TOUJOURS ce qui n'est pas elle. Sonder la meme liste pour les deux les rendrait
// indistinguables — c'est precisement l'ambiguite que le canon a levee en separant les deux
// nœuds (valeur legacy `ollama`, indistincte, resolue vers localhost par defaut).
export function hostsForTarget(target, hosts) {
  const isLocal = h => h === 'localhost' || h === '127.0.0.1' || h === '::1';
  if (target.scope === 'local') return FALLBACK_HOSTS;
  return hosts.filter(h => !isLocal(h));
}

export async function probeTargets(hosts, timeoutMs) {
  const out = [];
  for (const t of TARGETS) {
    if (t.kind === 'cli') {
      const available = hasCmd(t.bin);
      out.push({ target: t.id, label: t.label, kind: t.kind, available, url: '',
                 models: [], detail: available ? 'CLI present' : 'CLI absent du PATH',
                 installMeans: 'verification (rien a telecharger)' });
      continue;
    }
    const port = t.kind === 'ollama' ? OLLAMA_PORT : LITELLM_PORT;
    const scoped = hostsForTarget(t, hosts);
    let found = null;
    // Ollama : on sonde TOUS les hotes du scope et on retient le mieux fourni.
    // Mesure du 2026-08-03 : sur un meme poste, `localhost` et `127.0.0.1` peuvent servir DEUX
    // instances distinctes (0 modele contre 1) — s'arreter au premier qui repond ferait declarer
    // « aucun modele » a une machine qui en a. Le premier-repondant est un faux ami.
    if (t.kind === 'ollama') {
      const answered = [];
      for (const h of scoped) {
        const base = `http://${h}:${port}`;
        const r = await getJson(`${base}/api/tags`, timeoutMs);
        if (r.ok) answered.push({ url: base, models: (r.body?.models || []).map(m => m.name).filter(Boolean) });
      }
      if (answered.length) {
        const best = answered.reduce((a, b) => (b.models.length > a.models.length ? b : a));
        const extra = answered.length > 1 ? ` (${answered.length} hotes ont repondu)` : '';
        found = { url: best.url, models: best.models, detail: `${best.models.length} modeles${extra}` };
      }
    }
    // LiteLLM : la vivacite se lit sans authentification (`/health/liveliness`), le catalogue
    // exige la cle. Une passerelle vivante dont le catalogue est illisible reste `available`
    // — la distinction compte : le service marche, c'est NOTRE acces qui manque.
    if (t.kind === 'litellm') {
      for (const h of scoped) {
        const base = `http://${h}:${port}`;
        const live = await getJson(`${base}/health/liveliness`, timeoutMs);
        if (!live.ok) continue;
        const key = process.env.IAKAFRAME_LITELLM_KEY;
        const headers = key ? { Authorization: `Bearer ${key}` } : undefined;
        const r = await getJson(`${base}/v1/models`, timeoutMs, headers);
        const models = (r.body?.data || []).map(m => m.id).filter(Boolean);
        found = { url: base, models,
                  detail: r.ok ? `${models.length} entrees au catalogue`
                               : 'passerelle vivante, catalogue illisible (cle absente ?)' };
        break;
      }
    }
    out.push(found
      ? { target: t.id, label: t.label, kind: t.kind, available: true, ...found,
          installMeans: t.kind === 'ollama' ? 'telechargement (pull)' : 'declaration au catalogue' }
      : { target: t.id, label: t.label, kind: t.kind, available: false, url: '', models: [],
          detail: scoped.length ? `injoignable (port ${port})` : 'aucun hote LAN fourni (--hosts / IAKAFRAME_HOSTS)',
          installMeans: t.kind === 'ollama' ? 'telechargement (pull)' : 'declaration au catalogue' });
  }
  return out;
}

// Un modele est « disponible » sur une cible si la cible l'expose (comparaison sur le nom expose).
function availableOn(model, probes) {
  if (!model) return [];
  return probes.filter(p => p.available && p.models.some(m => m === model)).map(p => p.target);
}

// --- Etat des lieux (etape 1) ----------------------------------------------------------------
export function buildState({ canon, suggestions, probes }) {
  // Une cible « mesurable » = joignable et capable de porter un modele (les CLI claude/codex ne
  // portent pas de parc). Sans AUCUNE cible mesurable, on ne SAIT PAS ce qui est disponible :
  // le dire est plus honnete que de trancher (statut `indetermine`).
  const measurable = probes.some(p => p.available && p.kind !== 'cli');

  const roles = canon.roles.map(r => {
    const sug = suggestions?.roles?.[r.roleKey] || null;
    const recommended = sug?.recommended || null;
    const where = availableOn(recommended, probes);
    const assigned = [...new Set(r.personas.map(p => p.model).filter(Boolean))];
    const aligned = assigned.length > 0 && assigned.every(m => m === recommended);
    let status;
    // GATE QUALITE 2026-08-03, defaut bloquant #1 : le statut ne regardait QUE l'egalite
    // affectation <-> suggestion. Un modele affecte et present NULLE PART etait declare
    // `en-place` ; l'etape 3 filtrant sur `!== 'en-place'`, le binding `ollama` livre par ce
    // meme lot n'offrait AUCUNE action — le verbe cense mettre des modeles a disposition ne
    // pouvait pas les mettre a disposition. `en-place` exige desormais une PRESENCE MESUREE.
    if (!r.covered) status = 'non-couvert';
    else if (!recommended) status = 'sans-suggestion';
    else if (!measurable) status = 'indetermine';
    else if (aligned && where.length) status = 'en-place';
    else if (!aligned && where.length) status = 'disponible';
    else status = 'a-installer';
    return {
      roleKey: r.roleKey,
      covered: r.covered,
      personas: r.personas,
      assigned,
      recommended,
      alternatives: sug?.alternatives || [],
      requires: sug?.requires || [],
      sizeGb: sug?.sizeGb ?? null,
      why: sug?.why || '',
      availableOn: where,
      aligned,
      status,
    };
  });
  return roles;
}

// Resume d'un motif pour l'affichage : premiere phrase, coupee net a `max` caracteres.
// Coupe sur un espace pour ne pas trancher un mot, et signale la troncature par une ellipse
// (un texte coupe sans marque se lit comme un texte complet — donc comme un motif incomplet).
export function summarize(text, max = 150) {
  const one = String(text).replace(/\s+/g, ' ').trim();
  if (one.length <= max) return one;
  const cut = one.slice(0, max);
  const at = cut.lastIndexOf(' ');
  return (at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[ ,;:.]+$/, '') + ' […]';
}

// --- Rendu humain ----------------------------------------------------------------------------
// Marqueur ET libelle de legende par statut, dans UNE seule table : le gate qualite (2e passe,
// defaut A) a trouve `undefined` imprime sur les 9 lignes parce que le statut `indetermine`,
// ajoute par le correctif precedent, n'avait pas d'entree ici — et la legende, ecrite a la main
// ailleurs, ne le mentionnait pas davantage. Deux sources pour la meme information, donc deux
// occasions de diverger. Desormais la legende SE DERIVE de cette table : ajouter un statut sans
// marqueur devient impossible a rater (un test le verifie sur la sortie reelle).
export const STATUS_MARKS = {
  'en-place':        { mark: '[OK]', legend: 'en place' },
  'disponible':      { mark: '[..]', legend: 'disponible non affecte' },
  'a-installer':     { mark: '[!!]', legend: 'a installer' },
  'indetermine':     { mark: '[??]', legend: 'aucune cible joignable : disponibilite inconnue' },
  'sans-suggestion': { mark: '[  ]', legend: 'aucune suggestion pour ce role' },
  'non-couvert':     { mark: '[--]', legend: 'role sans persona' },
};

export function markFor(status) {
  return STATUS_MARKS[status]?.mark || '[??]';
}

export function legendLine(statuses) {
  const seen = statuses ? [...new Set(statuses)] : Object.keys(STATUS_MARKS);
  return seen
    .filter(s => STATUS_MARKS[s])
    .map(s => `${STATUS_MARKS[s].mark} ${STATUS_MARKS[s].legend}`)
    .join('  ');
}

function printState(canon, suggestions, probes, roles) {
  console.log('\n=== iakaframe - modeles d\'IA par roleKey ===');
  console.log(`  frame ${canon.frameId || '(aucune)'} · methode ${canon.methodId || '(aucune)'} · team ${canon.teamId || '(aucune)'}`);
  console.log(`  binding cible : ${canon.bindingId || '(aucun)'}`);

  const age = ageInDays(suggestions?.updatedAt);
  const fresh = age === null ? 'date illisible'
    : age > STALE_DAYS ? `${age} j — A RAFRAICHIR` : `${age} j`;
  console.log(`  suggestions   : ${suggestions ? `v${suggestions.version} du ${suggestions.updatedAt} (${fresh})` : 'ABSENTES'}`);

  console.log('\n  Cibles de mise a disposition :');
  for (const p of probes) {
    const mark = p.available ? '[OK]' : '[--]';
    console.log(`    ${mark} ${p.label.padEnd(14)} ${(p.url || '').padEnd(28)} ${p.detail}`);
  }

  console.log('\n  roleKey        persona(s)          affecte                suggere                statut');
  console.log('  ' + '-'.repeat(94));
  for (const r of roles) {
    const cast = r.personas.map(p => p.name).join(', ') || '(non couvert)';
    const assigned = r.assigned.join(', ') || '-';
    console.log(`  ${markFor(r.status)} ${r.roleKey.padEnd(13)} ${cast.slice(0, 18).padEnd(19)} ${assigned.slice(0, 21).padEnd(22)} ${(r.recommended || '-').slice(0, 21).padEnd(22)} ${r.status}`);
  }
  console.log('');
  console.log(`  ${legendLine(roles.map(r => r.status))}`);
  for (const n of suggestions?.notes || []) console.log(`  · ${n}`);
  console.log('');
}

// --- Le process interactif -------------------------------------------------------------------
async function interactive({ canon, suggestions, probes, roles, root, hosts, timeoutMs }) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = async (q) => (await rl.question(q)).trim();
  const yes = (s) => /^(o|oui|y|yes)$/i.test(s);

  try {
    // Etape 2 - proposition.
    const want = await ask('Voulez-vous voir les suggestions par roleKey ? [o/N] ');
    if (!yes(want)) { console.log('\nRien n\'a ete modifie.\n'); return; }

    // Etape 3 - diff suggestion <-> affectation.
    // GATE QUALITE 2026-08-03, defaut #2 : la liste ne contenait QUE les divergences, si bien
    // qu'un role aligne sortait definitivement du champ d'action — le modele qu'on venait
    // d'installer ne pouvait plus etre retire (AC-7 faux). La liste des divergences reste
    // l'ecran par defaut (c'est ce qu'on vient voir), mais TOUS les roles restent atteignables.
    const actionable = roles.filter(r => r.covered && r.recommended);
    const diverging = actionable.filter(r => r.status !== 'en-place');
    let diff = diverging;
    console.log('\n=== Suggestions qui different de l\'affectation en place ===');
    if (!diverging.length) {
      console.log('  (aucune : tout ce qui est suggere est deja affecte ET disponible)');
      if (!actionable.length) { console.log(''); return; }
      const tout = await ask('\nAfficher quand meme tous les roles (pour retirer un modele) ? [o/N] ');
      if (!yes(tout)) { console.log('\nRien n\'a ete modifie.\n'); return; }
      diff = actionable;
      console.log('\n=== Tous les roles couverts ===');
    }
    diff.forEach((r, i) => {
      const size = r.sizeGb ? ` ~${r.sizeGb} Go` : '';
      console.log(`  ${String(i + 1).padStart(2)}. ${r.roleKey.padEnd(14)} ${(r.assigned.join(', ') || '-')} -> ${r.recommended}${size}`);
      // Le motif est TRONQUE a l'ecran : dans la source, il porte l'historique des mesures qui
      // fondent la suggestion (parfois plusieurs phrases). Recette du 2026-08-03 : ces motifs
      // longs noyaient la liste, qui devenait illisible — un ecran de choix doit tenir d'un coup
      // d'oeil. Le detail complet reste dans models/suggestions.json, jamais perdu.
      if (r.why) console.log(`      ${summarize(r.why)}`);
      console.log(`      dispo sur : ${r.availableOn.join(', ') || 'aucune cible'}${r.alternatives.length ? ` · alternatives : ${r.alternatives.join(', ')}` : ''} [${r.status}]`);
    });
    if (diff === diverging && diverging.length < actionable.length) {
      console.log(`\n  (${actionable.length - diverging.length} role(s) deja en place, non listes — tapez « t » pour tout afficher)`);
    }

    // Etape 4 - choix, recapitulatif, GATE, execution.
    const pick = await ask('\nNumero du roleKey a traiter (« t » = tout afficher, vide = quitter) : ');
    if (/^t$/i.test(pick)) {
      diff = actionable;
      console.log('\n=== Tous les roles couverts ===');
      diff.forEach((r, i) => console.log(
        `  ${String(i + 1).padStart(2)}. ${r.roleKey.padEnd(14)} ${(r.assigned.join(', ') || '-')} -> ${r.recommended}  [${r.status}]`));
      const again = await ask('\nNumero du roleKey a traiter (vide = quitter) : ');
      await pickAndAct({ ask, yes, pick: again, diff, probes, canon });
      return;
    }
    await pickAndAct({ ask, yes, pick, diff, probes, canon });
  } finally {
    rl.close();
  }
}

// Etape 4 : choix de la cible et de l'action, recapitulatif, GATE, puis execution par adaptateur.
// `ask`/`yes` sont INJECTES : la fonction ne connait pas readline, ce qui la rend jouable dans un
// test en lui passant des reponses scriptees (gate qualite, defaut #3 : ce chemin n'avait aucun test).
export async function pickAndAct({ ask, yes, pick, diff, probes, canon, env = process.env, now = null }) {
  const idx = parseInt(pick, 10);
  if (!pick || Number.isNaN(idx) || idx < 1 || idx > diff.length) {
    console.log('\nRien n\'a ete modifie.\n');
    return { action: null, executed: false };
  }
  const row = diff[idx - 1];

  const usable = probes.filter(p => p.available && p.kind !== 'cli');
  if (!usable.length) {
    console.log('\nAucune cible joignable : rien a faire.\n');
    return { action: null, executed: false };
  }
  console.log('\n  Cibles disponibles :');
  usable.forEach((p, i) => console.log(`    ${i + 1}. ${p.label} (${p.url}) — ${p.installMeans}`));
  const tpick = await ask('  Cible [1] : ');
  const target = usable[(parseInt(tpick, 10) || 1) - 1];
  if (!target) { console.log('\nRien n\'a ete modifie.\n'); return { action: null, executed: false }; }

  const act = await ask('  Action : (i)nstaller  (r)emplacer l\'affectation  (x) retirer le modele  [i] : ');
  const action = /^r/i.test(act) ? 'replace' : /^x/i.test(act) ? 'remove' : 'install';

  // Recapitulatif AVANT gate : dit tout, y compris le fichier qui sera ecrit (R5) et le filet.
  const stamp = now || new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  console.log('\n  --- Recapitulatif ---');
  console.log(`  roleKey    : ${row.roleKey} (${row.personas.map(p => p.name).join(', ')})`);
  // Le poids ne se lit pas pareil selon le geste : « a telecharger » n'a aucun sens quand on RETIRE.
  const poids = row.sizeGb
    ? (action === 'remove' ? ` (~${row.sizeGb} Go liberes)` : ` (~${row.sizeGb} Go a telecharger si absent)`)
    : '';
  console.log(`  modele     : ${row.recommended}${poids}`);
  console.log(`  cible      : ${target.label} — ${target.url}`);
  console.log(`  action     : ${action === 'install' ? 'mettre a disposition' : action === 'replace' ? 'mettre a disposition PUIS ecrire l\'affectation' : 'RETIRER le modele de la cible'}`);
  if (action === 'replace') console.log(`  fichier    : ${canon.bindingPath || '(binding introuvable — ecriture impossible)'}`);
  const keyPresent = !!(env.IAKAFRAME_LITELLM_KEY || '');
  if (target.kind === 'litellm') {
    console.log('  note       : effet de bord sur un service PARTAGE (catalogue de la passerelle).');
    // AC-8 : le filet est ANNONCE avant le gate — mais SEULEMENT s'il sera reellement pris.
    // Gate qualite 2e passe, defaut B : la ligne s'affichait sans regarder la cle, alors que sans
    // cle le CLI sort avant tout appel : aucune sauvegarde, aucun fichier. L'utilisateur
    // confirmait en croyant a un retour arriere inexistant. Un recapitulatif qui promet ce qui
    // n'arrivera pas est pire qu'un recapitulatif muet : il fait decider sur du faux.
    if (keyPresent) {
      console.log(`  filet      : sauvegarde datee du catalogue -> ${backupDir()}/litellm-catalog-${stamp}.json`);
    } else {
      console.log('  filet      : AUCUN — cle d\'administration absente (IAKAFRAME_LITELLM_KEY).');
      // Gate qualite 3e passe, defaut I : la suite de la phrase promettait « un bloc a coller »
      // QUELLE QUE SOIT l'action — or seul le chemin « mettre a disposition » en produit un ;
      // un retrait sans cle s'arrete net. Le recapitulatif annonce desormais ce qui va vraiment
      // se passer POUR CETTE ACTION, jamais une consolation generique.
      console.log(action === 'remove'
        ? '               Le retrait au catalogue est IMPOSSIBLE sans cle : rien ne sera fait.'
        : '               La passerelle ne sera PAS modifiee : un bloc a coller sera affiche.');
    }
  }
  if (action === 'remove') console.log('  rappel     : la politique de retention conserve 1 a 2 versions anterieures — retirer n\'est pas obligatoire.');

  const go = await ask('\n  Confirmer ? [o/N] ');
  if (!yes(go)) {
    console.log('\nAbandonne. Rien n\'a ete modifie.\n');
    return { action, executed: false, target: target.target };
  }

  // --- Execution : APRES le gate uniquement ---
  const key = env.IAKAFRAME_LITELLM_KEY || '';
  let res;
  if (action === 'remove') {
    res = await applyRemove({ target, model: row.recommended, key, stamp });
  } else {
    if (target.kind === 'ollama') console.log(`\n  Telechargement de ${row.recommended} — cela peut prendre plusieurs minutes...`);
    res = await applyMakeAvailable({ target, model: row.recommended, key, stamp });
  }
  console.log('');
  res.lines.forEach(l => console.log(l));

  if (action === 'replace' && res.ok) {
    // D3 : « si un roleKey porte plusieurs personas, l'ecriture est proposee POUR CHACUNE,
    // individuellement (jamais un lot silencieux) ». Le gate qualite (defaut E) a releve que le
    // code ecrivait en lot — latent aujourd'hui (une persona par role) mais en contradiction avec
    // l'instruction. On ne requalifie pas l'instruction : on la respecte. Cas a une persona
    // inchange (aucune question de plus), le surcout n'existe que quand le lot serait reel.
    const cibles = [];
    for (const p of row.personas) {
      if (row.personas.length === 1) { cibles.push(p.id); continue; }
      const okP = await ask(`  Ecrire l'affectation pour ${p.name} (${p.id}) ? [o/N] `);
      if (yes(okP)) cibles.push(p.id);
      else console.log(`  ${p.name} : ignore.`);
    }
    if (!cibles.length) {
      console.log('  Aucune persona retenue : rien n\'a ete ecrit.');
    } else {
      const w = writeAssignments(canon, cibles, row.recommended);
      console.log(w.ok
        ? `  Affectation ecrite pour : ${w.written.join(', ')} (${canon.bindingPath})`
        : `  Affectation NON ecrite : ${w.error}`);
    }
  } else if (action === 'replace') {
    console.log('  Affectation NON ecrite : la mise a disposition a echoue.');
  }
  console.log('');
  return { action, executed: true, ok: res.ok, target: target.target };
}

// --- Adaptateurs (D4) -------------------------------------------------------------------------
// EXTRAITS de la boucle `readline` : le gate qualite du 2026-08-03 a montre que tout le chemin
// qui telecharge, ecrit et touche la passerelle etait INTESTABLE tant qu'il vivait dans une
// fonction exigeant un TTY (lignes non couvertes). Des fonctions pures et exportees se testent
// contre un serveur local, sans terminal et sans reseau externe.

// Repertoire des sauvegardes : HORS du depot (une sauvegarde versionnee n'en est pas une) et
// persistant (un /tmp qui disparait au reboot non plus). Surchargeable pour les tests.
export function backupDir() {
  return process.env.IAKAFRAME_BACKUP_DIR
    || path.join(os.homedir() || '.', '.iakaframe', 'backups');
}

// AC-8 : sauvegarde DATEE du catalogue AVANT toute ecriture sur la passerelle — seule cible a
// effet de bord sur un service partage (trois consommateurs vivants). Sans filet, une erreur sur
// ce service n'a aucun retour arriere. Rend { ok, file } ou { ok:false, error }.
export async function backupCatalog(target, key, stamp, timeoutMs = 15000) {
  const headers = key ? { Authorization: `Bearer ${key}` } : undefined;
  const r = await getJson(`${target.url}/model/info`, timeoutMs, headers);
  if (!r.ok) return { ok: false, error: `catalogue illisible (HTTP ${r.status})` };
  const dir = backupDir();
  try {
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `litellm-catalog-${stamp}.json`);
    fs.writeFileSync(file, JSON.stringify(r.body, null, 2), 'utf8');
    return { ok: true, file };
  } catch (e) {
    return { ok: false, error: `ecriture impossible : ${e.message}` };
  }
}

// Mettre a disposition : `pull` sur Ollama, declaration au catalogue sur LiteLLM.
// Rend { ok, lines:[...] } — les lignes sont RENDUES, jamais imprimees ici : une fonction qui
// ecrit sur stdout ne se teste pas, une fonction qui rend du texte se teste.
export async function applyMakeAvailable({ target, model, key, stamp }) {
  if (target.kind === 'ollama') {
    const r = await sendJson(`${target.url}/api/pull`,
      { method: 'POST', body: { name: model, stream: false }, timeoutMs: 3600000 });
    return r.ok
      ? { ok: true, lines: ['  Modele disponible.'] }
      : { ok: false, lines: [`  ECHEC du telechargement (HTTP ${r.status}).`, ...motifLines(r)] };
  }
  if (target.kind === 'litellm') {
    if (!key) {
      return { ok: false, lines: [
        '  Cle d\'administration absente (IAKAFRAME_LITELLM_KEY) : la passerelle ne peut pas etre',
        '  modifiee automatiquement. Bloc a ajouter au catalogue, puis redemarrer le service :',
        '', ...catalogBlock(model)] };
    }
    // AC-8 : le filet AVANT le geste. Si la sauvegarde echoue, on N'ECRIT PAS — un service
    // partage ne se modifie pas sans retour arriere.
    const bak = await backupCatalog(target, key, stamp);
    if (!bak.ok) {
      return { ok: false, lines: [
        `  Sauvegarde du catalogue impossible (${bak.error}) : ecriture ANNULEE.`,
        '  Un service partage ne se modifie pas sans filet.'] };
    }
    const r = await sendJson(`${target.url}/model/new`, {
      method: 'POST', headers: { Authorization: `Bearer ${key}` },
      body: { model_name: model,
              litellm_params: { model: `ollama_chat/${model}`, api_base: 'http://ollama:11434' } },
      timeoutMs: 60000,
    });
    if (r.ok) return { ok: true, lines: [`  Declare au catalogue : ${model}`, `  Sauvegarde : ${bak.file}`] };
    return { ok: false, lines: [
      `  La declaration automatique a echoue (HTTP ${r.status}).`, ...motifLines(r),
      `  Catalogue sauvegarde avant tentative : ${bak.file}`,
      '', '  Repli — bloc a ajouter au catalogue, puis redemarrer le service :', '',
      ...catalogBlock(model)] };
  }
  return { ok: false, lines: [`  Cible ${target.kind} : rien a mettre a disposition.`] };
}

// Retirer : ROUTE PAR TYPE DE CIBLE (gate qualite, defaut #4 — `/api/delete` etait emis sur la
// passerelle, ou cet endpoint n'existe pas : l'utilisateur confirmait un retrait impossible).
export async function applyRemove({ target, model, key, stamp }) {
  if (target.kind === 'ollama') {
    const r = await sendJson(`${target.url}/api/delete`,
      { method: 'DELETE', body: { name: model }, timeoutMs: 60000 });
    return r.ok ? { ok: true, lines: [`  Retire : ${model}`] }
                : { ok: false, lines: [`  ECHEC du retrait (HTTP ${r.status}).`, ...motifLines(r)] };
  }
  if (target.kind === 'litellm') {
    if (!key) return { ok: false, lines: ['  Cle d\'administration absente : retrait impossible au catalogue.'] };
    const bak = await backupCatalog(target, key, stamp);
    if (!bak.ok) return { ok: false, lines: [`  Sauvegarde impossible (${bak.error}) : retrait ANNULE.`] };
    // Le retrait au catalogue se fait par ID interne, pas par nom : il faut le resoudre.
    const info = await getJson(`${target.url}/model/info`, 15000, { Authorization: `Bearer ${key}` });
    const entry = (info.body?.data || []).find(m => m.model_name === model);
    const id = entry?.model_info?.id;
    if (!id) return { ok: false, lines: [`  ${model} est absent du catalogue : rien a retirer.`] };
    const r = await sendJson(`${target.url}/model/delete`, {
      method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: { id }, timeoutMs: 60000 });
    return r.ok
      ? { ok: true, lines: [`  Retire du catalogue : ${model}`, `  Sauvegarde : ${bak.file}`] }
      : { ok: false, lines: [`  ECHEC du retrait au catalogue (HTTP ${r.status}).`, ...motifLines(r),
                             `  Sauvegarde : ${bak.file}`] };
  }
  return { ok: false, lines: [`  Cible ${target.kind} : rien a retirer.`] };
}

function motifLines(res) {
  const m = serverMessage(res);
  return m ? [`  Motif renvoye par le service : ${m}`] : [];
}

export function catalogBlock(model) {
  return [`    - model_name: ${model}`,
          '      litellm_params:',
          `        model: ollama_chat/${model}`,
          '        api_base: http://ollama:11434'];
}

// Extrait le motif lisible d'une reponse d'erreur de la passerelle. Le corps est parfois un objet
// { error: { message } } dont le `message` est LUI-MEME du JSON echappe : on deballe une fois de
// plus quand c'est le cas, sinon l'utilisateur lit une chaine pleine de contre-obliques.
export function serverMessage(res) {
  const raw = res?.body?.error?.message ?? res?.body?.detail ?? res?.body?.error ?? null;
  let msg = typeof raw === 'string' ? raw : (raw ? JSON.stringify(raw) : '');
  if (!msg && res?.text) msg = String(res.text).slice(0, 300);
  // Un corps vide, `{}` ou `[]` n'est PAS un motif : l'imprimer produit « Motif renvoye par le
  // service : {} », qui occupe une ligne pour ne rien dire (gate qualite, defaut G).
  if (!msg || /^[\s{}\[\]"']*$/.test(msg)) return '';
  const inner = msg.match(/'error':\s*"([^"]+)"/) || msg.match(/"error":\s*"([^"]+)"/);
  if (inner) msg = inner[1];
  return msg.replace(/\s+/g, ' ').trim().slice(0, 240);
}

// --- Ecriture de l'affectation dans le binding (D3) -------------------------------------------
// Remplacement CIBLE, ligne a ligne : on ne reserialise pas le frontmatter (on detruirait les
// commentaires et l'ordre). Une ligne d'assignment porte `personaId: <id>` et `model: "<x>"`.
export function replaceModelInLine(line, model) {
  if (!/\bmodel\s*:/.test(line)) return null;
  return line.replace(/(\bmodel\s*:\s*)("[^"]*"|'[^']*'|[^,}\s]+)/, `$1"${model}"`);
}

export function writeAssignments(canon, personaIds, model) {
  if (!canon.bindingPath || !fs.existsSync(canon.bindingPath)) {
    return { ok: false, error: 'binding introuvable', written: [] };
  }
  const src = fs.readFileSync(canon.bindingPath, 'utf8');
  // Fin de ligne PRESERVEE (gate qualite, defaut F) : `split(/\r?\n/)` + `join('\n')` convertissait
  // TOUT un fichier CRLF en LF pour une ecriture d'une seule ligne — sur Windows, plateforme
  // supportee par ce CLI, cela produit un diff de fichier entier au lieu d'une ligne.
  const eol = src.includes('\r\n') ? '\r\n' : '\n';
  const lines = src.split(/\r?\n/);
  const written = [];
  for (const id of personaIds) {
    const i = lines.findIndex(l => new RegExp(`personaId\\s*:\\s*${id}\\b`).test(l));
    if (i < 0) continue;
    const next = replaceModelInLine(lines[i], model);
    if (next && next !== lines[i]) { lines[i] = next; written.push(id); }
  }
  if (!written.length) return { ok: false, error: 'aucune ligne d\'assignment reconnue', written: [] };
  fs.writeFileSync(canon.bindingPath, lines.join(eol), 'utf8');
  return { ok: true, written };
}

// --- Entree ----------------------------------------------------------------------------------
export async function runModels(argv) {
  let values;
  try {
    ({ values } = parseArgs({
      args: argv,
      options: {
        json: { type: 'boolean', default: false },
        hosts: { type: 'string' },
        timeout: { type: 'string', default: '3' },
        path: { type: 'string' },
        root: { type: 'string' },
        binding: { type: 'string' },
        help: { type: 'boolean', default: false },
      },
    }));
  } catch {
    console.log(HELP);
    return;
  }
  if (values.help) { console.log(HELP); return; }

  const root = libraryRoot(values.root);
  const projectDir = values.path ? path.resolve(values.path) : process.cwd();
  const hosts = values.hosts ? values.hosts.split(',').map(s => s.trim()).filter(Boolean)
                             : (envHosts() || FALLBACK_HOSTS);
  const timeoutMs = Math.max(800, (parseInt(values.timeout, 10) || 3) * 1000);

  const suggestions = loadSuggestions(root);
  if (!suggestions) {
    fail(values.json, 'suggestions introuvables', { expected: suggestionsPath(root) }, () => {
      console.error(`\nSource unique des suggestions introuvable : ${suggestionsPath(root)}`);
      console.error('Elle est attendue a la racine de la bibliotheque iakaframe.\n');
    });
    return;
  }

  const canon = roleRows(root, projectDir, values.binding || null);
  if (canon.bindingError) {
    fail(values.json, 'binding inconnu ou etranger a la team active',
         { binding: canon.bindingError, teamId: canon.teamId }, () => {
      console.error(`\nBinding « ${canon.bindingError} » introuvable, ou rattache a une autre team que ${canon.teamId}.`);
      console.error('Lister les bindings disponibles : iakaframe list bindings\n');
    });
    return;
  }
  const probes = await probeTargets(hosts, timeoutMs);
  const roles = buildState({ canon, suggestions, probes });

  const age = ageInDays(suggestions.updatedAt);
  const payload = ok({
    frameId: canon.frameId, methodId: canon.methodId, teamId: canon.teamId,
    bindingId: canon.bindingId,
    suggestions: { version: suggestions.version, updatedAt: suggestions.updatedAt,
                   ageDays: age, stale: age !== null && age > STALE_DAYS },
    count: roles.length,
    targets: probes,
    roles,
  });

  if (values.json) { emit(true, payload); return payload; }

  printState(canon, suggestions, probes, roles);

  // Le process interactif exige un terminal : sans TTY (CI, pipe, test), on s'arrete a l'etat
  // des lieux plutot que de bloquer sur une question que personne ne lira.
  if (!process.stdin.isTTY) {
    console.log('  (pas de terminal interactif : etat des lieux seul, aucune ecriture)\n');
    return payload;
  }
  await interactive({ canon, suggestions, probes, roles, root, hosts, timeoutMs });
  return payload;
}
