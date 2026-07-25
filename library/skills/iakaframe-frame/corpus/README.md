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

## État de sourçage — SOURCÉ ET HORODATÉ (2026-07-25)

Structure livrée par **Gimli (dev)** ; sourçage web complété par **Fëanor/Aragorn** sur la branche
`feat/persona-feanor` le **2026-07-25**. **Tous les marqueurs `[WEB-À-VÉRIFIER]` du squelette ont été
levés** : chaque framework a été re-vérifié contre sa **source primaire officielle** (doc ou dépôt) et
horodaté `vérifié le 2026-07-25` (A24 tenu). Voir `sources.md` pour la table des URL retenues et la
liste des corrections apportées au squelette.

Évolutions majeures repérées et intégrées :
- **BMAD** est passé en **v6** (architecture *modules* : BMM/BMB/TEA/BMGD/CIS ; personas nommées) —
  la surface d'extension est désormais le module **BMB**, non plus les *expansion packs* v4/v5 ;
- **AutoGen** est officiellement remplacé par **Microsoft Agent Framework** (« direct successor ») ;
- **ChatDev 2.0 (DevAll)** existe ; le modèle « entreprise virtuelle à phases » décrit reste celui de
  ChatDev 1.0 (référence du contraste par phases).

**Péremption implicite** (cf. `sources.md`) : les frameworks évoluent vite ; au-delà de quelques mois
sans re-vérification, **le web live prime** sur ce document daté.
