# Sources — corpus mondial de Fëanor

Point de départ = § 12 de `specs/instructions/role-frame-builder.md` (vérifié le **2026-07-23** au
cadrage). **A24 exige la re-vérification et l'horodatage live de CHAQUE source.** Re-vérification web
faite le **2026-07-25** (Aragorn/Fëanor, outils web sur la branche `feat/persona-feanor`) : chaque
URL ci-dessous a été re-visitée et horodatée `vérifié le 2026-07-25`. Les URL de « point de départ »
non-primaires (blogs comparatifs) ont été **remplacées par la source officielle** (doc/dépôt).

| # | Framework | Axe éclairé | URL (source retenue) | Vérifié |
|---|---|---|---|---|
| 1 | BMAD-METHOD | surface d'extension séparée = module **BMB** (« Create custom BMad agents and workflows », v6) | https://github.com/bmad-code-org/BMAD-METHOD | 2026-07-25 |
| 2 | BMAD-METHOD | architecture v6 (personas nommées + modules BMM/BMB/TEA/BMGD/CIS) | https://deepwiki.com/bmad-code-org/BMAD-METHOD/1.1-architecture-overview | 2026-07-25 |
| 3 | MetaGPT | rôles = agents matérialisés, slogan « Code = SOP(Team) » ; dépôt `FoundationAgents/MetaGPT` | https://github.com/FoundationAgents/MetaGPT | 2026-07-25 |
| 4 | CrewAI | `role` + `goal` + `backstory` + `tools` ; crew/tasks ; process séquentiel/hiérarchique | https://docs.crewai.com/concepts/agents | 2026-07-25 |
| 5 | Microsoft Agent Framework | successeur direct d'AutoGen + Semantic Kernel ; agents + workflows graphe | https://learn.microsoft.com/en-us/agent-framework/overview | 2026-07-25 |
| 6 | ChatDev | entreprise virtuelle (CEO/CPO/CTO/programmer/reviewer/tester/art designer), phases waterfall, chat chain + memory stream | https://github.com/OpenBMB/ChatDev | 2026-07-25 |

## Contrastes (sourcés le 2026-07-25)
| Framework | Axe | URL (source retenue) | Vérifié |
|---|---|---|---|
| LangGraph | `StateGraph` : nodes/edges/state, non orienté-rôle | https://docs.langchain.com/oss/python/langgraph/graph-api | 2026-07-25 |
| OpenAI Agents SDK | Agents + Handoffs + Guardrails ; délégation, pas référentiel de rôles | https://openai.github.io/openai-agents-python/ | 2026-07-25 |

## Corrections apportées au squelette (2026-07-25)
- **URL n°1 périmée** : `docs/expansion-packs.md` renvoie désormais **404** (la v6 a supprimé/renommé
  ce document). Remplacée par le README du dépôt, qui décrit l'architecture modules v6.
- **BMAD roster/extension** : le squelette décrivait le modèle v4/v5 (roster
  `analyst/pm/architect/sm/dev/qa/ux-expert`, agents `bmad-orchestrator`/`bmad-master`, *expansion
  packs*). **v6 (2026)** : personas nommées + **modules**, surface d'extension = **BMB** (les
  expansion packs généralisés). Invariant « extension = surface séparée » **maintenu**.
- **Sources 4, 5, 6 remplacées** : les URL de départ étaient des blogs/pages tierces
  (groovyweb, agent.nexus, ibm.com). Remplacées par les **sources primaires officielles** (doc
  CrewAI, Microsoft Learn, dépôt OpenBMB/ChatDev).
- **AutoGen** : nom exact du successeur confirmé = **Microsoft Agent Framework** (« direct successor,
  created by the same teams », « next generation of both Semantic Kernel and AutoGen »).

## Péremption implicite
Les frameworks évoluent (AutoGen en maintenance, absorbé par Microsoft Agent Framework ; versions de
BMAD/CrewAI/MetaGPT). Le corpus **porte sa date de péremption implicite** : au-delà de quelques mois
sans re-vérification, **le web live prime** sur ce document. C'est le sens du couple corpus + web
(D-H de l'instruction).
