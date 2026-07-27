// iakaframe skills <action> — domaine SKILLS (distinct du domaine agents/contrats). MVP : `deploy`.
// Calque byte-pour-byte la semantique de `agents generate [--check]` (statut par element, exit
// non-zero sur derive), mais pour les dossiers `<target>/.claude/skills/<id>/` (R8 § 5.4).
//
// Sortie machine C-JSON : { ok, count, skills:[{skill,status}], orphans:[{skill,status}], target,
// drift }. `count` = TAILLE DE L'UNION (jamais gonfle par les orphelines, qui vivent a part).
import { parseArgs } from 'node:util';
import { libraryRoot } from '../lib/library.js';
import { deploySkills } from '../lib/skills-deploy.js';
import { collection, fail } from '../lib/output.js';

export function runSkills(argv) {
  const { values, positionals } = parseArgs({
    args: argv, allowPositionals: true,
    options: {
      action: { type: 'string' },
      project: { type: 'string' }, global: { type: 'boolean', default: false },
      json: { type: 'boolean', default: false }, check: { type: 'boolean', default: false },
    },
  });
  const action = values.action || positionals[0] || 'deploy';
  const project = values.project || process.cwd();
  const json = values.json;

  if (action !== 'deploy') {
    fail(json, `action inconnue : ${action} (deploy)`);
    return;
  }

  const root = libraryRoot();
  const rep = deploySkills({ root, project: values.global ? null : project, global: values.global, check: values.check });
  const payload = collection('skills', rep.skills, {
    count: rep.count, orphans: rep.orphans, target: rep.target, drift: rep.drift, ok: rep.ok,
  });

  if (json) {
    console.log(JSON.stringify(payload, null, 2));
  } else if (values.check) {
    console.log(`Verification des skills deployees (${rep.target}/skills) :`);
    for (const r of rep.skills) console.log(`  ${r.status === 'ok' ? '=' : '!'} ${r.skill.padEnd(30)} ${r.status}`);
    for (const o of rep.orphans) console.log(`  ~ ${o.skill.padEnd(30)} orphan (hors union, conservee)`);
    console.log(rep.drift === 0
      ? `OK : ${rep.count} skill(s) a jour (aucune derive).`
      : `DERIVE : ${rep.drift} skill(s) divergente(s)/absente(s). Regenerer via 'skills deploy'.`);
  } else {
    console.log(`Deploiement des skills -> ${rep.target}/skills :`);
    for (const r of rep.skills) console.log(`  ${r.status === 'unchanged' ? '=' : '+'} ${r.skill.padEnd(30)} ${r.status}`);
    for (const o of rep.orphans) console.log(`  ~ ${o.skill.padEnd(30)} orphan (hors union, conservee)`);
    console.log(`${rep.count} skill(s) dans l'union deployee.`);
  }

  // Exit non-zero UNIQUEMENT sur derive (drift/absent), jamais sur orphan seul (D4).
  if (values.check && rep.drift !== 0) process.exitCode = 1;
}
