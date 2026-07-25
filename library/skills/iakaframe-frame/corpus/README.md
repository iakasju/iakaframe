# Corpus mondial — modèles de rôle/agent des frameworks multi-agents

Corpus de référence **écrit et versionné** de Fëanor (arbitrage 6, volet écrit ;
`specs/instructions/role-frame-builder.md` § 2.4). Socle **stable, daté, relu, citable** ; complété au
runtime par le **web live** (`WebSearch`/`WebFetch`) qui comble l'actualité.

## Index

| Fichier | Contenu |
|---|---|
| `modeles-de-role.md` | Comparatif des 6 frameworks du socle + 2 contrastes, structuré par l'axe de comparaison |
| `sources.md` | Sources horodatées (point de départ § 12) + état de re-vérification web |

## Axe de comparaison (unique, déclaré)

Chaque framework est décrit par **comment il modélise « un intervenant »** :
- **(a) forme du modèle** — déclaratif-rôle · conversationnel · classe de code · phase waterfall · graphe ;
- **(b) surface d'extension** — où vit la création/extension du framework (roster de livraison vs surface séparée) ;
- **(c) rapport à iakaframe** — ce que le modèle éclaire ou contraste avec le modèle méthode/team/binding.

> **Extensible, non figé.** Un 6ᵉ (7ᵉ…) framework se range en remplissant les trois axes — aucune refonte.

## ⚠️ État de sourçage — À COMPLÉTER PAR UN AGENT WEB

Ce corpus est livré par **Gimli (dev), qui n'a PAS d'outils web**. Il est **structurellement complet**
(les 6 frameworks + 2 contrastes, l'axe, la synthèse) et **alimenté par ce qui est déjà dans le dépôt**
(sources § 12 de l'instruction, findings du catalogue de 7 frames au `BACKLOG.md`). Les passages
**marqués `[WEB-À-VÉRIFIER]`** demandent une **re-vérification et un horodatage live** (A24 : chaque
affirmation renvoie à une source datée de sa date de vérification). Un agent web sur la branche
`feat/persona-feanor` complètera :
- la **re-vérification** de chaque URL de `sources.md` + horodatage `vérifié le AAAA-MM-JJ` ;
- l'**actualité** mouvante (ex. AutoGen → Microsoft Agent Framework, versions de BMAD/CrewAI) ;
- l'ajout éventuel d'un ou deux frameworks récents non couverts au socle.

**Ne pas lire ce corpus comme définitif tant que les marqueurs `[WEB-À-VÉRIFIER]` subsistent.**
