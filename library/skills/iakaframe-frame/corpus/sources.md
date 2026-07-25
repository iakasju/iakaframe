# Sources — corpus mondial de Fëanor

Point de départ = § 12 de `specs/instructions/role-frame-builder.md` (vérifié le **2026-07-23** au
cadrage). **A24 exige la re-vérification et l'horodatage live de CHAQUE source** — geste réservé à un
agent web (Gimli, dev, n'a pas d'outils web). État ci-dessous : `[POINT DE DÉPART]` = repris du cadrage,
`[WEB-À-VÉRIFIER]` = à re-visiter + horodater `vérifié le AAAA-MM-JJ`.

| # | Framework | Axe éclairé | URL | État |
|---|---|---|---|---|
| 1 | BMAD-METHOD | expansion packs (surface d'extension séparée) | https://github.com/bmad-code-org/BMAD-METHOD/blob/main/docs/expansion-packs.md | [POINT DE DÉPART] [WEB-À-VÉRIFIER] |
| 2 | BMAD-METHOD | architecture (`bmad-orchestrator`, `bmad-master` hors roster) | https://deepwiki.com/bmad-code-org/BMAD-METHOD/1.1-architecture-overview | [POINT DE DÉPART] [WEB-À-VÉRIFIER] |
| 3 | MetaGPT | rôles = classes, « Code = SOP(Team) » | https://github.com/FoundationAgents/MetaGPT | [POINT DE DÉPART] [WEB-À-VÉRIFIER] |
| 4 | CrewAI | role + goal + backstory + tools ; crew/tasks | https://www.groovyweb.co/blog/crewai-vs-langgraph-vs-autogen-framework-comparison-2026 | [POINT DE DÉPART] [WEB-À-VÉRIFIER] |
| 5 | AutoGen | ConversableAgent/GroupChat ; maintenance/absorption MS Agent Framework | https://agent.nexus/blog/autogen-vs-crewai | [POINT DE DÉPART] [WEB-À-VÉRIFIER] |
| 6 | ChatDev | entreprise virtuelle, rôles par phases waterfall, chat-chain | https://www.ibm.com/think/topics/chatdev | [POINT DE DÉPART] [WEB-À-VÉRIFIER] |

## Contrastes (à sourcer par l'agent web)
| Framework | Axe | État |
|---|---|---|
| LangGraph | graphe d'états, non orienté-rôle | [WEB-À-VÉRIFIER : URL + horodatage] |
| OpenAI Agents SDK | handoffs, non référentiel de rôles | [WEB-À-VÉRIFIER : URL + horodatage] |

## Péremption implicite
Les frameworks évoluent (AutoGen en maintenance, absorbé par Microsoft Agent Framework ; versions de
BMAD/CrewAI/MetaGPT). Le corpus **porte sa date de péremption implicite** : au-delà de quelques mois
sans re-vérification, **le web live prime** sur ce document. C'est le sens du couple corpus + web
(D-H de l'instruction).
