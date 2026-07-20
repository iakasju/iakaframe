// A-3 : une persona resout RÔLE puis SKILL (fin de la conflation code-nom = rôle = skill).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as agentsModule from '../src/lib/agents.js';
import { ROLE_OF, SKILL_OF, skillOfPersona, PORTFOLIO_PERSONAS, PORTFOLIO_AGENTS, listAgents, listPersonas } from '../src/lib/agents.js';

test('ROLE_OF mappe chaque persona vers un rôle canonique', () => {
  assert.equal(ROLE_OF.aragorn, 'coordination');
  assert.equal(ROLE_OF.gandalf, 'architecture');
  assert.equal(ROLE_OF.gimli, 'fabrication');
  assert.equal(ROLE_OF.legolas, 'tests');
  assert.equal(ROLE_OF.loki, 'graphisme');
  assert.equal(ROLE_OF.nathalie, 'doc');
  assert.equal(ROLE_OF.odin, 'portefeuille');
  assert.equal(ROLE_OF.helm, 'deploiement'); // rôle canonique de plein droit (CH-A)
});

test('SKILL_OF est keye par RÔLE (pas par code-nom)', () => {
  assert.equal(SKILL_OF.coordination, 'iakaframe-aragorn');
  assert.equal(SKILL_OF.architecture, 'iakaframe-cadrage');
  assert.equal(SKILL_OF.fabrication, ''); // gimli : porte par le CLAUDE.md
  assert.equal(SKILL_OF.deploiement, 'iakaframe-deploiement');
});

test('skillOfPersona resout persona -> rôle -> skill, sans regression de deploiement', () => {
  // Valeurs IDENTIQUES a l'ancienne table SKILL_OF (non-regression du kit deploye).
  assert.equal(skillOfPersona('odin'), 'iakaframe-odin');
  assert.equal(skillOfPersona('aragorn'), 'iakaframe-aragorn');
  assert.equal(skillOfPersona('gandalf'), 'iakaframe-cadrage');
  assert.equal(skillOfPersona('gimli'), '');
  assert.equal(skillOfPersona('legolas'), 'iakaframe-qualite');
  assert.equal(skillOfPersona('loki'), 'iakaframe-naonedge');
  assert.equal(skillOfPersona('nathalie'), 'iakaframe-nathalie');
});

// CH-A : `deploiement` est promu rôle canonique. Helm ne partage plus le rôle d'Aragorn et
// resout sa skill par la chaine normale persona -> rôle -> skill. L'exception codee
// SKILL_OVERRIDE_OF est SUPPRIMEE (critere C3) : sa disparition est elle-meme testee, sinon
// une reintroduction silencieuse passerait inapercue.
test('C3 : helm resout iakaframe-deploiement par son rôle, sans exception codee', () => {
  assert.equal(ROLE_OF.helm, 'deploiement');
  assert.equal(skillOfPersona('helm'), 'iakaframe-deploiement');
  assert.equal(SKILL_OF[ROLE_OF.helm], 'iakaframe-deploiement'); // resolu par le rôle, pas par la persona
  assert.equal(agentsModule.SKILL_OVERRIDE_OF, undefined, 'SKILL_OVERRIDE_OF doit rester supprimee');
});

test('aliases retro-compat conserves (PORTFOLIO_AGENTS, listAgents)', () => {
  assert.deepEqual(PORTFOLIO_PERSONAS, ['odin']);
  assert.equal(PORTFOLIO_AGENTS, PORTFOLIO_PERSONAS);
  assert.equal(listAgents, listPersonas);
});
