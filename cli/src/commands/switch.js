// iakaframe switch|use <method> <team> - bascule un PROJET (execution/run). Assemble en interne
// (refuse si incompatible), sauvegarde .claude/ -> .claude.bak-<ts> (non destructif, Q-6), deploie
// les personas de la team + leurs skills depuis la bibliotheque, ecrit le marqueur d'etat
// .claude/iakaframe-kit.json. --rollback restaure la derniere sauvegarde. MVP-2 : node claude (Q-4).
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { assemble, libraryRoot, readEntry, scan, toArray } from '../lib/library.js';
import { frameCoherence } from '../lib/frame-active.js';
import { generateAgent, loadDefaultBinding } from '../lib/generate-agents.js';
import { resolveSkills } from '../lib/resolve-skills.js';
import { peutDemander } from '../lib/interactif.js';
import { selectionner, assemblerArgv, ligneEquivalente } from '../lib/guidage.js';
import { emit, fail, ok } from '../lib/output.js';

const USAGE = `Usage : iakaframe use <methodId> <teamId> [options]
        iakaframe switch <methodId> <teamId> [options]

Bascule un PROJET (execution) vers une methode/team : assemble (refuse si incompatible),
sauvegarde .claude/ existant, deploie les personas de la team + leurs skills.

Arguments :
  <methodId> <teamId> Methode et team a materialiser dans le projet

Options :
  --path <dir>       Projet cible (defaut : dossier courant)
  --binding <id>     Binding de generation des contrats d'agent
  --node <n>         Nœud runner (defaut : claude)
  --rollback         Restaure la derniere sauvegarde .claude.bak-* (aucune bascule)
  --root <dir>       Racine de bibliotheque
  --force            Force l'ecriture
  --guide            Mode guide (Lot A) : propose methode puis team, imprime la commande equivalente
                     (echo non desactivable), execute par le chemin normal. Ne propose JAMAIS
                     --rollback/--force (A4.3) — sans effet si --rollback est demande.
  --json             Sortie machine`;

// --- Guidage (Lot A, --guide) : methode PUIS team (scan('methods')/scan('teams'), A5).
async function runSwitchGuide({ root, values }) {
  const selMethode = await selectionner({
    items: scan('methods', root).map((e) => ({ id: e.id, label: e.id })),
    titre: 'Methode :', permettreLibre: true, libelleLibre: 'saisir un id de methode',
  });
  if (selMethode.type === 'vide' || selMethode.type === 'annule') { console.log('\nRien n\'a ete bascule.\n'); return; }
  const methodId = selMethode.type === 'libre' ? selMethode.valeur : selMethode.item.id;
  if (!methodId) { console.log('\nRien n\'a ete bascule.\n'); return; }

  const selTeam = await selectionner({
    items: scan('teams', root).map((e) => ({ id: e.id, label: e.id })),
    titre: 'Team :', permettreLibre: true, libelleLibre: 'saisir un id de team',
  });
  if (selTeam.type === 'vide' || selTeam.type === 'annule') { console.log('\nRien n\'a ete bascule.\n'); return; }
  const teamId = selTeam.type === 'libre' ? selTeam.valeur : selTeam.item.id;
  if (!teamId) { console.log('\nRien n\'a ete bascule.\n'); return; }

  const suite = [methodId, teamId];
  if (values.path) suite.push('--path', values.path);
  if (values.root) suite.push('--root', values.root);
  if (values.binding) suite.push('--binding', values.binding);
  if (values.node) suite.push('--node', values.node);
  const argvNormal = assemblerArgv(suite);
  console.log(ligneEquivalente(['switch', ...argvNormal]));
  await runSwitch(argvNormal);
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
}

export async function runSwitch(argv) {
  const { values, positionals } = parseArgs({
    args: argv, allowPositionals: true,
    options: {
      root: { type: 'string' }, binding: { type: 'string' }, path: { type: 'string' },
      node: { type: 'string' }, rollback: { type: 'boolean', default: false },
      force: { type: 'boolean', default: false }, json: { type: 'boolean', default: false },
      guide: { type: 'boolean', default: false }, help: { type: 'boolean', default: false },
    },
  });
  if (values.help) { console.log(USAGE); return; }
  const projectDir = path.resolve(values.path || process.cwd());
  const root = libraryRoot(values.root);

  // --guide (A2/A5) : SANS EFFET si --rollback est demande (A4.3 : jamais propose comme entree de
  // menu, et --rollback reste un geste EXPLICITE, jamais devine).
  if (values.guide && !values.rollback && peutDemander({ json: values.json, guide: true })) {
    await runSwitchGuide({ root, values });
    return;
  }

  // --rollback : restaure la derniere .claude.bak-* (aucune bascule).
  if (values.rollback) {
    const backups = listBackups(projectDir);
    if (!backups.length) return fail(values.json, 'Aucune sauvegarde .claude.bak-* à restaurer.');
    const last = backups[backups.length - 1];
    const claudeDir = path.join(projectDir, '.claude');
    if (fs.existsSync(claudeDir)) fs.rmSync(claudeDir, { recursive: true, force: true });
    copyDir(path.join(projectDir, last), claudeDir);
    emit(values.json, ok({ rollback: last, path: claudeDir }), () => console.log(`Restauré : ${last} → .claude/`));
    return;
  }

  const [methodId, teamId] = positionals;
  if (!methodId || !teamId) {
    return fail(values.json, 'Usage : iakaframe use <methodId> <teamId> [--binding <id>] [--path <projet>] [--rollback]');
  }
  if (!fs.existsSync(projectDir)) return fail(values.json, `Projet introuvable : ${projectDir}`);

  // Palier 0 (Lot A, refus loquace) : pre-controle AVANT assemble() — ids DERIVES de scan(),
  // jamais recopies. Meme refus (exit 1) qu'avant, message enrichi seulement.
  const methodIds = scan('methods', root).map((e) => e.id);
  if (!methodIds.includes(methodId)) {
    return fail(values.json, `methode introuvable : ${methodId} — ids valides : ${methodIds.join(', ')}.`,
      { methodId, idsValides: methodIds });
  }
  const teamIds = scan('teams', root).map((e) => e.id);
  if (!teamIds.includes(teamId)) {
    return fail(values.json, `team introuvable : ${teamId} — ids valides : ${teamIds.join(', ')}.`,
      { teamId, idsValides: teamIds });
  }

  const node = values.node || 'claude';
  const res = assemble(methodId, teamId, values.binding || null, root, { node });
  if (res.error || !res.ok) {
    return fail(values.json, res.error || 'casting incompatible', { orphans: res.orphans || [] }, () => {
      console.error(`Aucune écriture : ${res.error || 'casting incompatible'}`);
      for (const r of res.orphans || []) console.error(`  - rôle orphelin : ${r}`);
    });
  }

  // Sauvegarde non destructive si un .claude/ preexiste.
  const claudeDir = path.join(projectDir, '.claude');
  let backup = null;
  if (fs.existsSync(claudeDir)) {
    backup = `.claude.bak-${timestamp()}`;
    copyDir(claudeDir, path.join(projectDir, backup));
  }

  // Deploiement pilote par le binding/team : personas de la team + skills de chaque persona.
  const agentsDir = path.join(claudeDir, 'agents');
  const skillsDir = path.join(claudeDir, 'skills');
  fs.mkdirSync(agentsDir, { recursive: true });
  const deployed = [];
  const skillsDeployed = new Set();
  // Anomalie C corrigee (R8 D6) : on deploie le CONTRAT GENERE (generateAgent : frontmatter Claude
  // Code valide + skills: resolues), JAMAIS la persona brute (frontmatter persona invalide au
  // runtime). Les skills sont la liste RESOLUE transitive (resolveSkills), jamais le seul niveau
  // declare. `switch` et `fullteam` empruntent desormais la meme resolution (parite C17).
  const binding = res.binding || loadDefaultBinding(root);
  for (const pid of toArray(res.team.data.personas)) {
    const persona = readEntry('personas', pid, root);
    if (!persona) continue;
    let contract;
    try { contract = generateAgent(pid, { root, binding }); }
    catch { continue; }
    fs.writeFileSync(path.join(agentsDir, `${pid}.md`), contract);
    deployed.push(pid);
    for (const skill of resolveSkills(pid, { root })) {
      const src = path.join(root, 'library', 'skills', skill);
      if (fs.existsSync(src)) { copyDir(src, path.join(skillsDir, skill)); skillsDeployed.add(skill); }
    }
  }

  // Marqueur d'etat (Q-6).
  const marker = {
    methodId: res.method.id, teamId: res.team.id,
    bindingId: res.binding ? res.binding.id : null, node,
    assembledAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(claudeDir, 'iakaframe-kit.json'), JSON.stringify(marker, null, 2) + '\n');

  // Garde de COHERENCE (A-cohérence, reservoir-de-frames.md § 7) : cette bascule (backlog) n'ecrit
  // PAS encore .iakaframe.frame (§ 9). Si un pointeur de frame active existe, on CONSTATE et SIGNALE
  // une divergence entre l'INTENTION (.iakaframe.frame) et la MATERIALISATION qu'on vient d'ecrire
  // (iakaframe-kit.json). Non bloquant : un simple avertissement (le geste user reste souverain).
  const coherence = frameCoherence(projectDir, root);

  const out = { ...marker, path: claudeDir, personas: deployed, skills: [...skillsDeployed], backup, coherence };
  emit(values.json, ok(out), () => {
    console.log(`bascule ${projectDir} → méthode ${res.method.id} / team ${res.team.id} (node ${node})`);
    console.log(`  personas déployées : ${deployed.join(', ')}`);
    console.log(`  skills déployées   : ${[...skillsDeployed].join(', ') || '(aucune)'}`);
    if (backup) console.log(`  sauvegarde : ${backup}  (rollback : iakaframe use --rollback --path ${projectDir})`);
    console.log(`  marqueur : .claude/iakaframe-kit.json`);
    if (coherence.status === 'divergent') console.log(`  ⚠ cohérence : ${coherence.reason}`);
  });
}

function listBackups(projectDir) {
  if (!fs.existsSync(projectDir)) return [];
  return fs.readdirSync(projectDir).filter(n => n.startsWith('.claude.bak-')).sort();
}
