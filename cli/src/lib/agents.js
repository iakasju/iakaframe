// Equipe d'agents iakaframe : definitions canon (agents/*.md + skills/) -> copie scopee.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { frameworkRoot } from './kit.js';

export const SKILL_OF = {
  odin: 'iakaframe-odin',
  aragorn: 'iakaframe-aragorn',
  gandalf: 'iakaframe-cadrage',
  gimli: '',
  legolas: 'iakaframe-qualite',
  helm: 'iakaframe-deploiement',
  loki: 'iakaframe-naonedge',
  nathalie: 'iakaframe-nathalie',
};
export const PORTFOLIO_AGENTS = ['odin'];

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}

export function listAgents() {
  const root = frameworkRoot(); if (!root) return [];
  const dir = path.join(root, 'agents');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.md') && f !== '_TEMPLATE.md').map(f => f.replace(/\.md$/, '')).sort();
}

function targetDir({ project, global }) {
  return global ? path.join(os.homedir(), '.claude') : path.join(path.resolve(project), '.claude');
}

export function affectAgent(name, { project, global = false, force = false } = {}) {
  const root = frameworkRoot();
  if (!root) { console.error('Racine iakaframe introuvable.'); return false; }
  const srcAgent = path.join(root, 'agents', `${name}.md`);
  if (!fs.existsSync(srcAgent)) { console.log(`  ! agent inconnu : ${name}`); return false; }
  const target = targetDir({ project, global });
  const dstAgentDir = path.join(target, 'agents');
  fs.mkdirSync(dstAgentDir, { recursive: true });
  const dstAgent = path.join(dstAgentDir, `${name}.md`);
  if (fs.existsSync(dstAgent) && !force) console.log(`  = ${name} (deja present, --force pour ecraser)`);
  else { fs.copyFileSync(srcAgent, dstAgent); console.log(`  + agent  ${name}`); }

  const skill = SKILL_OF[name];
  if (skill) {
    const srcSkill = path.join(root, 'skills', skill);
    if (fs.existsSync(srcSkill)) { copyDir(srcSkill, path.join(target, 'skills', skill)); console.log(`  + skill  ${skill}`); }
  } else if (name === 'gimli') {
    console.log('  i gimli : pas de skill - porte par le CLAUDE.md du projet.');
  }
  // Loki : embarque les chartes design-* a la racine du projet.
  if (name === 'loki' && !global) {
    for (const c of fs.readdirSync(root, { withFileTypes: true })) {
      if (c.isDirectory() && c.name.startsWith('design-')) {
        copyDir(path.join(root, c.name), path.join(path.resolve(project), c.name));
        console.log(`  + charte ${c.name}`);
      }
    }
  }
  return true;
}

export function fullteam({ project, global = false, force = false } = {}) {
  for (const name of listAgents()) {
    if (PORTFOLIO_AGENTS.includes(name)) continue;
    affectAgent(name, { project, global, force });
  }
}
