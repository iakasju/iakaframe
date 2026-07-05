# Instruction — Alignement de la méthode source sur l'état cible v0.4.0

> **Phase** : P1 — Cadrage · **Cadreur** : l'architecte-cadreur (Gandalf) · **Exécutant** : le développeur-devops (Gimli).
> **Statut** : à valider par le décideur (jalon humain) avant exécution.
> **Date de cadrage** : 2026-07-05.

---

## 1. Objectif

Nettoyer le **palimpseste** de la méthode source : des strates conceptuelles se sont empilées sans
jamais être réconciliées. L'objectif est d'**aligner le modèle conceptuel et le vocabulaire** de la
méthode source sur l'**état cible acté par la doc chapeau v0.4.0** (validée par le décideur le
2026-07-05), à savoir :

- **un décideur** (= l'utilisateur humain) **+ une équipe d'experts** (rôles spécialisés, périmètres
  étanches, **sans nombre figé**) — et **non plus** « trois acteurs / décideur-réflexion-exécution »
  comme modèle conceptuel ;
- **rôles + personas** : le **rôle** est la fonction (cadrage, développement, qualité, coordination…),
  le **persona** en est l'**incarnation jouable**, portable d'un runner à l'autre ;
- **agnosticisme** : la méthode est une **discipline, pas une technologie** ; « Cowork / Claude Code »
  cessent d'être **LE** modèle — Claude Code devient **UNE implémentation parmi d'autres**.

**Ce n'est PAS** une refonte des procédures. C'est un alignement de **modèle** et de **vocabulaire**.
Les commandes, gestes, gardes-fous et le canal d'identité restent **intacts** (cf. §6 et §7).

---

## 2. Contexte & diagnostic (déjà établi, sourcé — ne pas re-dériver)

La méthode source contient trois modèles superposés jamais nettoyés :

1. **`methode-de-travail.md:94`** affirme encore que « les **trois acteurs** sont le **modèle
   conceptuel** (décideur / réflexion / exécution) » — à côté de l'équipe de rôles décrite plus bas
   (`:104-113`). Deux modèles coexistent sans réconciliation.
2. Le cœur « **workflow en pratique** » (`methode-de-travail.md:368-406`, `:418-421`, `:468`,
   `:498-525`, `:570`) est rédigé avec « **Cowork** » (réflexion) et « **Claude Code** » (exécution) :
   c'est le **vieux modèle à 2 acteurs nommés par leur runner**, non migré vers les rôles/phases et
   anti-agnostique.
3. Le **CLAUDE.md global** est bloqué sur la **strate la plus ancienne** (« trois acteurs… Stéphane =
   décideur, Cowork = réflexion, Claude Code = exécution ») — **lu dans TOUTES les sessions**.
   - **Image source (à éditer)** : `kit-claude/global/CLAUDE.md:8-14`.
   - **Copie déployée (ne PAS éditer à la main)** : `~/.claude/CLAUDE.md:8-14` — contenu **identique**
     à la source sur ces lignes. Règle d'or de la méthode : on édite la **source**, puis on
     **redéploie** (cf. §7, gate humain).
4. **Incarnation** décrite seulement pour Claude Code : `methode-de-travail.md:332-340`
   (« Chaque agent = un **subagent Claude Code** »), à généraliser en **persona** (le subagent n'est
   qu'une **forme d'implémentation** Claude Code).

**Référence d'état cible** : `iakaframe-chapeau.html` v0.4.0 — en particulier l'onglet « L'idée »
(décideur + équipe d'experts, rôle vs persona), « L'agnosticisme » (discipline > technologie,
runners hétérogènes) et « L'emboîtement » (persona = contrat, subagent = impl. Claude Code).
**Libellés canoniques de rôle** : `specs/glossaire-iakaframe.md:8-21`.

---

## 3. Périmètre

### 3.1 Dans le périmètre — MVP, phase 1

| Fichier | Portée de la modification |
|---|---|
| `methode-de-travail.md` | Le **modèle conceptuel** (l. 94) + le cœur « workflow en pratique » écrit en Cowork/Claude Code (l. 368-406, 418-421, 468, 498-525, 570) + l'**incarnation** (l. 332-340). |
| `kit-claude/global/CLAUDE.md` | **Uniquement** le bloc « modèle conceptuel » (l. 8-14). Rien d'autre. |
| `~/.claude/CLAUDE.md` | **Copie déployée** — mise à jour **seulement par redéploiement** après relecture humaine (cf. §7). Jamais éditée à la main. |

### 3.2 Hors périmètre — phase 2 (à cadrer séparément, ne PAS traiter ici)

- `kit-claude/CLAUDE.md` (gabarit de **contrat projet**, section « Rôles (rappel) » en Cowork/Claude Code).
- `specs/equipe-agents.md`, `agents/*.md` (contrats de rôle) — vocabulaire « agent/subagent ».
- Autres `specs/instructions/*`, `skills/*`, kits (`kit-codex`, `kit-ollama`, `kit-openwebui`,
  `kit-anythingllm`), `README.md`.
- **Balayage lexical complet** « agent → persona » sur les artefacts internes.

**Justification du découpage** : le palimpseste porte sur ~28 fichiers (87 occurrences de
Cowork/Claude Code). Le MVP traite **les deux fichiers porteurs du modèle conceptuel** — la source
de la contradiction et le fichier lu partout. Le reste est du **vocabulaire d'annexes** : churn
important, faible risque, sans contradiction de modèle → phase 2. On ne gonfle pas le périmètre.

### 3.3 Interdits absolus (ne PAS toucher, sous aucune forme)

- Le **canal d'identité** : badges/pastilles, rituel d'ouverture/clôture, position de la pastille,
  restitution verbatim / anti-ventriloquie (`methode-de-travail.md:194-330`). Le mot « agent » y est
  **conservé tel quel** (« tout agent qui s'adresse à l'utilisateur… »).
- Les **commandes & procédures** : `init iakaframe`, `update iakaframe`, auto-détection init↔update,
  défaut **Forgejo**, cycle d'état des lieux, `iakastart` / bootstrap team.
- Les **gardes-fous par hooks** (identité, gestes, périmètre).
- Toutes les **conventions permanentes** du CLAUDE.md global (l. 92-129).

---

## 4. Règle de substitution de vocabulaire

Appliquer **selon le sens porté par la position**, jamais par remplacement mécanique aveugle :

| Formulation ancienne (à retirer) | Cible | Nuance / condition |
|---|---|---|
| « les **trois acteurs** » / « 3 acteurs » comme **modèle conceptuel** | « **un décideur (l'utilisateur) + une équipe d'experts** » | Supprimer l'idée que 3 acteurs = LE modèle. Garder « le décideur = l'utilisateur ». |
| « deux acteurs Cowork / Claude Code » | idem — réflexion & exécution **distribuées sur l'équipe de rôles** | Déjà amorcé en `:30-31` (garder comme modèle de la direction). |
| « **Cowork** » (le rôle réflexion) | « **le cadrage** » / « **l'architecte-cadreur** » (le rôle) | Selon le contexte : réflexion/cadrage. |
| « **Claude Code** » comme **exécutant / rôle** | « **le développeur** » (le rôle) — ou « **le runner / l'implémentation** » | Quand le texte désigne *qui code*. |
| « **Claude Code** » comme **outil / solution** | conserver, **qualifié** : « Claude Code (**une implémentation parmi d'autres** ; `AGENTS.md` ailleurs) » | Claude Code survit **uniquement** comme exemple d'implémentation. |
| « **agent** / **subagent** » comme **concept** | « **persona** » (l'incarnation d'un rôle) | **Exception** : « subagent » subsiste comme **forme d'implémentation Claude Code** (ex. `:334`). |
| « le **développeur** » quand il désigne **l'humain** | « **le décideur** » | Lever l'ambiguïté avec le rôle « développeur » (= Gimli). *Voir question d'arbitrage §9.* |

> **Attention** : le mot « agent » dans le **canal d'identité** (`:194-330`) et « agent » comme terme
> générique des sections déjà correctes ne sont **pas** dans le périmètre phase 1. Ne pas les balayer.

---

## 5. Changements précis, fichier par fichier

> **Méthode d'exécution** : traiter les ancres **de bas en haut** dans chaque fichier (les numéros de
> ligne ci-dessous sont donnés à l'**état actuel** ; procéder du bas vers le haut évite de décaler les
> ancres au fil des éditions). Employer les **libellés canoniques** du glossaire.

### 5.1 `methode-de-travail.md`

| Ancre (état actuel) | Ce qui est là | Ce qu'il faut y mettre |
|---|---|---|
| `:94-97` | « Les **trois acteurs** sont le **modèle conceptuel** (décideur / réflexion / exécution). Pour industrialiser… la couche réflexion+exécution se spécialise en une équipe d'agents… » | Poser le **bon modèle** : « Le modèle, c'est **un décideur (l'utilisateur) + une équipe d'experts** aux périmètres étanches, **sans nombre figé**. La réflexion et l'exécution sont **distribuées sur les rôles** de cette équipe ; chaque rôle est incarné par un **persona**. » Supprimer « les trois acteurs = modèle conceptuel ». |
| `:332-340` | « ### Incarnation technique : subagents + skills — Chaque **agent = un subagent Claude Code**… Le **subagent** = le contrat… » | Généraliser : « Chaque rôle est incarné par un **persona** = son **contrat**. Sur **Claude Code**, un persona s'implémente en **subagent** (`agents/<rôle>.md`) ; sur d'autres runners, en profil/Model (`AGENTS.md`). Le **persona = le contrat** ; la **skill = la méthode**. » (subagent conservé **comme exemple d'implémentation**). |
| `:372-388` | Cycle standard : « 2. **Cowork** analyse… 3. Discussion développeur ↔ **Cowork**… 4. **Cowork** rédige… 6. **Claude Code** lit… implémente… 8. retour à l'étape 2 (en **Cowork**) » | Réécrire par **rôles** : réflexion/rédaction d'instruction → **le cadrage (l'architecte-cadreur)** ; implémentation → **le développeur** ; « développeur ↔ Cowork » → « **décideur ↔ cadrage** ». |
| `:390-406` | Cycle de correction : « Quand **Claude Code** prend une mauvaise direction… (en **Cowork**)… **Cowork** diagnostique/rédige… **Claude Code** applique » | Idem : mauvaise direction de **l'exécution** → on remonte au **cadrage** ; l'instruction corrective redescend vers **le développeur**. |
| `:418-421` | Exemple IAKA Vod : « **Claude Code** voulait ajouter FFmpeg… C'est en **Cowork** que la décision… **Claude Code** seul aurait implémenté… » | Reformuler en rôles : « **l'exécution seule** aurait embarqué FFmpeg… c'est au **cadrage** que la décision a été prise… ». (Garder l'exemple, il est bon ; retirer les noms de runner.) |
| `:447-448` | « L'IA génère… Les outils vérifient… **Le développeur** juge… Aucun des trois… » | Léger : « **le décideur** juge le résultat » (cohérence décideur=utilisateur). Le « trois » ici = génère/vérifie/juge — **conceptuellement correct, à conserver**. |
| `:468` | Préférence mémorisée : « « **Cowork** = réflexion, **Claude Code** = exécution » → jamais de code depuis Cowork. » | Réénoncer en principe **agnostique** : « **séparer réflexion et exécution** → le rôle de cadrage ne touche jamais au code de production. » |
| `:502-517` | Structure : « Contrat de travail pour **Claude Code** », « Espace **Cowork** (JAMAIS de code) », « Code source (**Claude Code** écrit ici) », « Permissions de **Claude Code** ». | « Contrat de rôle (**CLAUDE.md** pour Claude Code, `AGENTS.md` ailleurs) » ; « Espace **cadrage / réflexion** (JAMAIS de code) » ; « Code source (**le développeur** écrit ici) » ; « Permissions du **runner** (Claude Code par défaut) ». |
| `:525-526` | Note : « sur IAKA Vod, ce dossier s'appelle `claudecowork/`… c'est le rôle (espace réflexion, jamais de code) qui compte. » | Conserver la note historique (fait réel du projet) ; s'assurer que « rôle = espace **cadrage/réflexion** » est la formulation. |
| `:570` | « les faits sont automatiques ; **Cowork** complète le récit de reprise » | « … le **rôle de cadrage/réflexion** complète le récit de reprise ». |
| `:3` *(optionnel, léger)* | « une **équipe d'agents IA** » | Aligner : « une **équipe d'experts** (des **personas** incarnant des rôles) ». |

### 5.2 `kit-claude/global/CLAUDE.md` (image source du CLAUDE.md global)

**Chirurgical — uniquement le bloc l. 8-14.** Remplacer :

```
Stéphane travaille selon la méthode iakaframe : trois acteurs, zéro chevauchement.
- Stéphane = décideur (vision, arbitrages, validation, test réel).
- Cowork (Claude réflexion) = analyse en lecture seule + rédige les instructions…
- Claude Code (Claude exécution) = lit l'instruction AVANT chaque tâche, code, build, teste, commite.
```

par un énoncé **décideur + équipe d'experts / personas**, agnostique, p. ex. :

- **Le décideur** = l'utilisateur (vision, arbitrages, validation, test réel) — au-dessus de l'équipe.
- **Une équipe d'experts** (rôles à périmètres étanches, sans nombre figé) porte réflexion et
  exécution ; chaque rôle est joué par un **persona**, portable d'un runner à l'autre.
- La **réflexion / le cadrage** produit l'instruction écrite dans `specs/instructions/` (jamais de
  code) ; **l'exécution** lit l'instruction avant chaque tâche, code, build, teste, commite.
- **Claude Code est une implémentation** de la méthode (`CLAUDE.md`) parmi d'autres (`AGENTS.md`…) —
  pas le modèle.

> Le reste du fichier (l. 16 → fin : commandes init/update, Forgejo, iakastart, conventions
> permanentes, rituel d'identité) reste **rigoureusement inchangé**.

---

## 6. Ce qu'on garde tel quel (non-régression)

- Tout le **canal d'identité** `methode-de-travail.md:194-330` (badges, pastilles, position,
  verbatim, anti-ventriloquie) — y compris le mot « agent » qui y figure.
- Les sections **déjà migrées** : `:3` (équipe), `:30-32` (« plus de deux acteurs Cowork/Claude
  Code »), le **roster** `:104-113`, les **phases/gates** `:154-180`, les **jalons** `:283-320`.
- La note « Aucun des trois » `:448` (génère/vérifie/juge) — modèle correct.
- Toute la partie **procédures** : `init/update iakaframe`, Forgejo, cycle d'état des lieux,
  `iakastart`.
- Le **CLAUDE.md global** hors bloc l. 8-14.

---

## 7. Risque & gate humain — CLAUDE.md global (obligatoire)

Le CLAUDE.md global est **lu dans TOUTES les sessions** du décideur : une régression y a un rayon
de blast maximal. Précautions **non négociables** :

1. Gimli édite **la source** `kit-claude/global/CLAUDE.md` — **jamais** la copie déployée
   `~/.claude/CLAUDE.md` à la main.
2. Le changement porte **exclusivement** sur les l. 8-14 (bloc modèle conceptuel). **Diff isolé,
   présenté ligne par ligne.**
3. **Relecture humaine du décideur AVANT redéploiement** : le diff source est soumis au décideur.
   Aucun redéploiement vers `~/.claude/CLAUDE.md` sans **feu vert humain explicite** (jalon humain).
4. Le redéploiement se fait par le geste normal de déploiement (source → `~/.claude/`), pas par une
   copie manuelle divergente.

---

## 8. Critères d'acceptation (vérifiables)

Phase 1 est **PASS** si **tous** les points suivants sont vérifiés :

1. `grep -n "trois acteurs" methode-de-travail.md` → **0** occurrence (aucune mention du « modèle
   conceptuel = trois acteurs »).
2. `grep -ni "Cowork" methode-de-travail.md` → **0** occurrence (hors éventuelle note historique
   **explicitement balisée** « strate historique », si le décideur la souhaite — cf. §9).
3. `grep -ni "Claude Code" methode-de-travail.md` → chaque occurrence **restante** qualifie Claude
   Code comme **une implémentation** (jamais comme LE rôle exécutant ou LE modèle). Revue manuelle.
4. `methode-de-travail.md:94` (nouvelle position) énonce « **un décideur + une équipe d'experts** »
   et **ne contient plus** « les trois acteurs sont le modèle conceptuel ».
5. La section « incarnation » (`:332-340`) parle de **persona** ; « subagent » n'y apparaît **que**
   comme forme d'implémentation Claude Code.
6. `grep -ni "trois acteurs\|Cowork" kit-claude/global/CLAUDE.md` → **0**. Le bloc l. 8-14 énonce
   **décideur + équipe d'experts / personas** et cite Claude Code comme **implémentation**.
7. **Non-régression procédures** (inchangées mot pour mot) :
   - `grep -c "init iakaframe" kit-claude/global/CLAUDE.md` inchangé ;
   - `grep -c "update iakaframe" kit-claude/global/CLAUDE.md` inchangé ;
   - blocs Forgejo, `iakastart`, conventions permanentes (l. 92-129) **byte-identiques** avant/après.
8. **Non-régression identité** : le canal d'identité `methode-de-travail.md:194-330` est
   **byte-identique** avant/après.
9. **Gate humain honoré** : `~/.claude/CLAUDE.md` n'est mis à jour que **après** relecture et feu
   vert du décideur (cf. §7) — sinon la copie déployée reste inchangée.
10. Les **libellés** employés dans les passages modifiés correspondent au glossaire
    (`specs/glossaire-iakaframe.md:8-21`).

---

## 9. Dépendances & questions d'arbitrage

**Dépendances**
- Référence d'état cible : **`iakaframe-chapeau.html` v0.4.0** (validée le 2026-07-05).
- **`specs/glossaire-iakaframe.md`** (libellés canoniques de rôle).
- **Pas de fait externe à vérifier** : cet alignement est **interne** (modèle + vocabulaire), il ne
  dépend d'aucune version/compat d'outil tiers → `WebSearch`/`WebFetch` **non requis** ici (la règle
  « cadrage sur le web » s'applique quand une décision dépend d'un fait externe, ce qui n'est pas le
  cas).

**Questions d'arbitrage pour le décideur (à trancher avant/pendant validation)**
1. **Ampleur du rename** : on confirme le **phasage** (phase 1 = modèle conceptuel + Cowork/Claude
   Code des 2 fichiers porteurs ; phase 2 = annexes/contrats + balayage « agent→persona ») ? *(reco :
   oui, MVP)*
2. **Le mot « développeur »** dans le workflow historique désigne **l'humain** : on le migre vers
   « **décideur** » partout (pour lever l'ambiguïté avec le rôle « développeur » = Gimli), ou on garde ?
3. **Trace historique** : on **efface** toute mention de Cowork/Claude Code comme rôles, ou on garde
   une **note « strate historique »** balisée (mémoire du projet) ?
4. **Qui exécute le redéploiement** du CLAUDE.md global vers `~/.claude/` : Gimli après ton feu vert,
   ou toi-même à la main ?
5. **Phase 2** (`equipe-agents.md`, `agents/*.md`, `kit-claude/CLAUDE.md`, autres kits) : confirmée
   **hors MVP** ?
