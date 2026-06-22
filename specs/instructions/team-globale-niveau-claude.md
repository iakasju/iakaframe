# Instruction — Câbler le déclenchement de la team iakaframe (skill `iakastart` + convention globale)

> Émetteur : Gandalf (cadrage). Récepteur : Gimli (dev). Cible : `C:\work\iakaframe` (la méthode elle-même).
> Statut : à valider par Stéphane avant exécution.

## Contexte (décisions actées — ne pas rediscuter)

- La team iakaframe (8 agents + 13 skills) vit désormais **en global** dans `~/.claude`
  (`C:\Users\sjupi\.claude\agents\` + `C:\Users\sjupi\.claude\skills\`). Déjà déployée.
- Abandon du déploiement par projet. **L'étanchéité passe au niveau exécution (cwd)** : un agent
  cadre/exécute « ce projet » d'après le `CLAUDE.md` du répertoire courant.
- Objectif de **cette** instruction : câbler le **déclenchement** de la team par mot-clé.

## Problème

La team est déployée mais **dort**. Rien ne la « lève » de façon explicite : Stéphane n'a pas de
geste unique pour (1) marquer le démarrage d'une session iakaframe, (2) voir qui compose la team
et qui fait quoi, (3) rendre les agents prêts à être dispatchés. Aujourd'hui il faut invoquer un
agent au hasard ou décrire le besoin à froid, sans bootstrap commun. Il manque **un point d'entrée
nommé** et **une règle qui le déclenche au mot-clé**, sans hook (mécanisme natif Claude Code).

## Décision retenue

Deux livrables, MVP, réutilisant strictement l'existant :

1. **Une skill `iakastart`** (bootstrap team). Source dans le repo
   `C:\work\iakaframe\skills\iakastart\SKILL.md` (= l'image versionnée), déployée ensuite en global
   `C:\Users\sjupi\.claude\skills\iakastart\SKILL.md`. Quand elle est invoquée, elle :
   - affiche le titre ASCII `IAKAFRAME` via la commande **existante**
     `node C:\work\iakaframe\cli\src\index.js banner IAKAFRAME` (aucune réimplémentation) ;
   - affiche le **ROSTER** des 8 agents avec une ligne « qui fait quoi » (voir tableau ci-dessous) ;
   - **rend les agents prêts à dispatch** (rappelle qu'ils existent et comment les solliciter) —
     **surtout PAS** de spawn des 8 agents, aucun sous-agent lancé.
   - Les alias **`iakaframe`** et **`odin`** invoquent la **même** skill (`odin` conserve **en plus**
     sa posture portefeuille existante via la skill `iakaframe-odin` déjà déployée).

2. **Une convention dans le `CLAUDE.md` global** (`C:\Users\sjupi\.claude\CLAUDE.md`) :
   « Dès que Stéphane dit `iakastart`, `iakaframe` ou `odin` en début ou en cours de session →
   invoquer la skill `iakastart` (bootstrap team). » **Sans hook** : le déclenchement repose sur
   (a) le champ `description` de la skill (mécanisme natif de découverte/invocation de skill) et
   (b) la règle explicite ajoutée au `CLAUDE.md` global, lu dans toutes les sessions.

### Mécanisme « sans hook » (rationale vérifiée sur l'existant)

Toutes les skills du repo se déclenchent par leur **frontmatter `description`** riche en mots-clés
(ex. `iakaframe-cadrage` : « cadrer / spécifier / écrire un ticket… »). On applique le même
patron : la `description` d'`iakastart` liste explicitement `iakastart`, `iakaframe`, `odin`,
« lancer/démarrer la team », « bootstrap iakaframe ». Couplé à la règle du `CLAUDE.md` global, ça
suffit — **aucun script de hook, aucun watcher, aucune commande slash custom**.

### Roster de référence (8 agents — source : `C:\Users\sjupi\.claude\agents\`)

| Agent     | Rôle / phase                  | Pastille | Ce qu'il fait |
|-----------|-------------------------------|----------|---------------|
| odin      | Portefeuille (au-dessus)      | 🟡       | Oriente le portefeuille, switch/démarre/crée des équipes, commande les Aragorn |
| aragorn   | Coordination                  | 🛡️      | Répartit le besoin, suit les phases d'une feature, décide qui intervient |
| gandalf   | Cadrage (P1)                  | 🔵       | Transforme un besoin en instruction fermée et vérifiable |
| gimli     | Dev / DevOps                  | —        | Code, build, teste, commite d'après l'instruction |
| legolas   | Qualité                       | —        | Revue, typecheck/lint/tests, garde les critères d'acceptation |
| helm      | Production                    | —        | Gate de prod, déploiement, feu vert humain requis |
| loki      | Design                        | —        | Conception visuelle / UX |
| nathalie  | Doc utilisateur               | —        | Documentation destinée à l'utilisateur final |

> Note exécution : reprendre les pastilles/postures **réelles** des fichiers `agents/*.md` ;
> ne pas inventer de pastille manquante (laisser « — » si l'agent n'en définit pas).

## Périmètre

### Inclus
- Création du fichier source `C:\work\iakaframe\skills\iakastart\SKILL.md`.
- Déploiement (copie) en global `C:\Users\sjupi\.claude\skills\iakastart\SKILL.md`.
- Ajout d'une section « Commande iakastart / bootstrap team » dans `C:\Users\sjupi\.claude\CLAUDE.md`.
- Câblage des alias `iakaframe` et `odin` vers la skill `iakastart` (via `description` + règle).
- Commit + push du repo `iakaframe` (méthode : `update iakaframe` ou commit conventionnel).

### Exclu
- Aucune modification du CLI (`cli/src/**`) : la commande `banner` est réutilisée telle quelle.
- Aucun hook, watcher, daemon, commande slash custom.
- Aucun spawn automatique des sous-agents.
- Aucune modification des 8 fichiers `agents/*.md` ni des 13 autres skills.
- Aucun changement de la posture portefeuille d'`odin` (skill `iakaframe-odin` inchangée).

## Fichiers touchés (chemins précis)

| Fichier | Action |
|---------|--------|
| `C:\work\iakaframe\skills\iakastart\SKILL.md` | **Créer** (source versionnée) |
| `C:\Users\sjupi\.claude\skills\iakastart\SKILL.md` | **Créer** (déploiement global, copie de la source) |
| `C:\Users\sjupi\.claude\CLAUDE.md` | **Éditer** (ajouter la section convention, sans rien écraser) |

> En lecture / réutilisation seule (ne pas modifier) : `C:\work\iakaframe\cli\src\index.js`,
> `C:\work\iakaframe\cli\src\commands\banner.js`, `C:\Users\sjupi\.claude\agents\*.md`.

## Contenu attendu de `iakastart\SKILL.md` (gabarit)

- **Frontmatter** :
  - `name: iakastart`
  - `description:` en français, listant les déclencheurs `iakastart`, `iakaframe`, `odin`,
    « lancer la team », « démarrer la team iakaframe », « bootstrap équipe », et précisant que la
    skill affiche le banner + le roster et rend les agents prêts à dispatch **sans les spawner**.
- **Corps** :
  1. Lancer `node C:\work\iakaframe\cli\src\index.js banner IAKAFRAME` et afficher la sortie.
  2. Afficher le roster (tableau ci-dessus : agent / rôle / une ligne « qui fait quoi »).
  3. Rappeler comment dispatcher (citer l'agent par son nom selon le besoin) — **ne pas** lancer
     les agents.
  4. Note alias : `iakaframe` et `odin` mènent ici ; `odin` garde sa posture portefeuille.
  5. Garde-fou explicite : « ne jamais spawner les 8 agents ; ce n'est qu'un bootstrap d'affichage
     + mise à disposition. »
- Doc en français, identifiants/commandes en anglais.

## Critères d'acceptation

- [ ] Le fichier `C:\work\iakaframe\skills\iakastart\SKILL.md` existe avec un frontmatter valide
      (`name: iakastart` + `description` non vide).
- [ ] La `description` du frontmatter contient explicitement les mots-clés `iakastart`,
      `iakaframe` et `odin` comme déclencheurs.
- [ ] Le corps de la skill invoque **exactement** `node C:\work\iakaframe\cli\src\index.js banner IAKAFRAME`
      (réutilisation, pas de FIGlet réimplémenté).
- [ ] Le corps affiche le **roster des 8 agents** (odin, aragorn, gandalf, gimli, legolas, helm,
      loki, nathalie) avec une ligne « qui fait quoi » par agent.
- [ ] La skill indique explicitement qu'elle **ne spawne pas** les agents (bootstrap d'affichage +
      mise à disposition uniquement).
- [ ] Le fichier global `C:\Users\sjupi\.claude\skills\iakastart\SKILL.md` existe et est identique
      à la source du repo (copie déployée).
- [ ] `C:\Users\sjupi\.claude\CLAUDE.md` contient une nouvelle section qui mappe `iakastart`,
      `iakaframe` et `odin` vers l'invocation de la skill `iakastart`, en précisant « sans hook ».
- [ ] Cette section du `CLAUDE.md` ne supprime ni n'altère aucune section existante (ajout pur).
- [ ] Aucun fichier sous `C:\work\iakaframe\cli\src\**` n'a été modifié.
- [ ] Aucun des 8 fichiers `C:\Users\sjupi\.claude\agents\*.md` ni des 13 skills existantes n'a été
      modifié (posture portefeuille d'`odin` intacte).
- [ ] Vérification manuelle Stéphane : en disant `iakaframe` (ou `iakastart` / `odin`) dans une
      session, le banner `IAKAFRAME` s'affiche, le roster apparaît, et aucun sous-agent n'est lancé.
- [ ] Le repo `C:\work\iakaframe` est commité (conventional commit) et poussé sur Forgejo.

## Sources (faits vérifiés en lecture seule)

- Commande `banner` disponible : `C:\work\iakaframe\cli\src\index.js:43` et
  `C:\work\iakaframe\cli\src\commands\banner.js` (FIGlet embarqué, zéro dépendance).
- Patron de déclenchement par `description` : `C:\work\iakaframe\skills\iakaframe-cadrage\SKILL.md:3`.
- Posture portefeuille d'`odin` à préserver : `C:\work\iakaframe\skills\iakaframe-odin\SKILL.md`.
- Roster réel (8 agents) : `C:\Users\sjupi\.claude\agents\{odin,aragorn,gandalf,gimli,legolas,helm,loki,nathalie}.md`.
- Absence d'`iakastart` aujourd'hui : aucun dossier `skills\iakastart\` dans le repo ni en global.
