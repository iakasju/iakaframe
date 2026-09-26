# Instruction : Durée estimée de toute délégation (lot méthode)

> Rédigé par le cadrage (P1, Gandalf) le 2026-09-26. Consommé par Gimli (P2) après validation.
> Statut : **PROPOSITION**, en attente d'arbitrage de Stéphane (Q1 à Q5).
> Origine : convention **validée par Stéphane le 26/09/2026** dans
> `~/work/IakaAgentsMonitor/specs/instructions/temps-restant.md` (Q1 à Q7 = A), section « Lot
> méthode ». Cette instruction **n'en change pas la grammaire** : elle l'écrit dans la méthode.
> Consommateurs : colonne « Reste » d'IakaAgentsMonitor (`temps-restant.md`), puis champ
> `estimate` de la fiche MQTT (`IakaAgentsMonitor/specs/instructions/agnostique-mqtt.md`, Q5-A :
> valeur brute extraite, validée par l'app).

---

## Problème

Aucun runner ne dit combien de temps un sous-agent doit durer : seul celui qui délègue le sait,
au moment où il délègue. La convention qui l'écrit (une ligne `Durée estimée : ~<valeur>` en tête
de consigne) est validée, mais elle n'existe encore dans **aucun** texte de la méthode : les
délégants (Odin, Aragorn, Claude principal) ne l'appliquent donc pas, et la barre « Reste »
affiche un tiret. Il faut l'écrire, en termes neutres, là où les délégants la lisent.

## Ce qui existe (vérifié en lecture le 2026-09-26)

| Fichier | Constat |
|---|---|
| `methode-de-travail.md` | § « Workflows de sous-agents — activés par défaut » l. 467-492 ; la section suivante « La rétrospective » commence l. 494. Aucune mention de durée de délégation. |
| `library/skills/iakaframe-aragorn/SKILL.md` | Procédure étape 2 (l. 40-41) : « un ordre de mission clair : quoi, sur quelle base, critère de fin » ; gabarit « Ordre de mission » l. 63-69. |
| `library/skills/iakaframe-odin/SKILL.md` | Procédure étape 3 (l. 63) : « **Délègue** la suite à l'Aragorn de l'équipe concernée. » |
| `library/skills/iakaframe-fabrication/SKILL.md` | Gimli **ne délègue pas** : le worktree isolé (l. 31-33) concerne des exécutions **lancées par le coordinateur**, pas des sous-agents lancés par Gimli. → **exclu**. |
| `library/personas/aragorn.md` | § « Dispatch à la demande de l'utilisateur », l. 97-100 : « un **ordre de mission** (quoi, sur quelle base, critère de fin) ». |
| `library/personas/odin.md` | § « Entrées → Sorties », l. 80-84 : Odin « passe la main à l'Aragorn ». Aucune règle de consigne. |
| `kits/iakaframe-claude/global/CLAUDE.md` | § « Conventions permanentes », dernière puce l. 140-150 « Workflows de sous-agents activés par défaut ». Déployé à la main dans `~/.claude/CLAUDE.md` (aucun verbe du CLI ne le copie). |
| `kits/iakaframe-codex/AGENTS.md` | l. 30-31 : « le roster n'est pas un ensemble de sous-agents dispatchables » ; délégation A→B des orchestrateurs l. 92-94. **Mais** Codex CLI sait désormais lancer de vrais sous-agents (`spawn_agent`, champ texte `message`, libellé `task_name` = segment de chemin), derrière un drapeau `multi_agent_v2` (sources en fin). |
| `kits/iakaframe-ollama/AGENTS.md` | l. 26 : « un rôle à la fois » ; délégation A→B l. 73-79 purement **narrative** (un seul modèle joue les rôles en série). → **exclu** (aucune consigne transmise, rien à lire). |
| `kits/iakaframe-openwebui/AGENTS.md` | l. 16-18 et 99-100 : « la chaîne de délégation est **narrative**, pas un routage ». → **exclu**. |
| `kits/iakaframe-anythingllm/AGENTS.md` | l. 15 et 99 : même constat. → **exclu**. |
| Régénérés à partir de ces sources | `methode-de-travail.html` (zone `CODE_BLOCKS` : SKILL.md du domaine + contrats rendus, `cli/scripts/gen-methode-vitrine.mjs`, garde `cli/test/vitrine-methode.test.js`) ; golden des skills (sha256 des SKILL.md, `cli/scripts/gen-skills-golden.mjs`, garde `parite-skills`) ; goldens des contrats (`cli/scripts/gen-agents-golden.mjs`). |
| Hors d'atteinte | `frames/releases/StefFrame2/**` (miroir figé de release) ; `.claude/worktrees/agent-ad0d5f08878d103e5/` (worktree d'un autre agent, vivant). |
| Version | Autorité `cli/package.json` = `0.41.0` ; les montées de version sont des lots `chore/bump-X` ordonnés à part ; taguer = publier = geste de Stéphane. |

## Décision retenue (sous réserve de Q1 à Q5, valeurs recommandées)

- **Règle neutre** dans `methode-de-travail.md`, nouvelle sous-section du § « Workflows de
  sous-agents » : forme exacte (grammaire de `temps-restant.md`, sans rien y changer) et **façon
  d'estimer**. Elle est la **seule définition** ; les autres fichiers y renvoient.
- **Délégants neutres** (skills et personas Aragorn et Odin) : une ligne qui applique la règle.
- **Runner Claude Code** (kit global) : la ligne en tête de consigne **et** le suffixe `(~…)` à la
  fin du champ `description`.
- **Runner Codex** : la ligne en tête du `message` de `spawn_agent` seulement (Q3-A).
- **Ollama, Open WebUI, AnythingLLM** : exclus (délégation narrative, aucune consigne transmise).
- **Pas de montée de version** dans ce lot (Q4-A).
- **`~/.claude/CLAUDE.md`, `~/.claude/skills/`, `~/.claude/agents/`** : jamais touchés par un agent ;
  mise à jour = geste de Stéphane (Q5-A).

### Décisions arbitraires (mineures, révisables en une phrase)

- **DA-D1** Échelle de valeurs rondes conseillée : 30 s, 1, 2, 3, 5, 10, 15, 20, 30, 45 min, 1 h,
  2 h, 3 h… — conseil, pas grammaire (`~7 min` reste valide).
- **DA-D2** Fourchette utile jusqu'à un **facteur 3** entre les bornes ; au-delà, prendre la borne
  haute plausible.
- **DA-D3** On estime le **temps d'horloge** du sous-agent (du lancement à la remise), sans
  l'attente d'une réponse humaine ; à distinguer de l'estimation en **jours-homme** du jalon
  P1→P2, qui reste inchangée.
- **DA-D4** Pas de réestimation en cours de route ; une relance porte sa propre ligne.
- **DA-D5** Titre de la sous-section : « Toute délégation annonce sa durée estimée » (sert
  d'ancre de renvoi dans tous les autres fichiers).

## Questions fermées (arbitrage de Stéphane)

**Q1 — Quand le délégant n'a aucune idée de la durée ?**
- **A (recommandé)** — **Omettre** la ligne (et le suffixe) plutôt qu'inventer : l'app affiche un
  tiret ; un chiffre inventé fabrique une fausse alerte rouge. Règle écrite : « obligatoire sauf
  ignorance réelle ».
- B — Toujours écrire une ligne, au pire une fourchette large : plus de barres, moins fiables.

**Q2 — Gimli (fabrication) porte-t-il la règle ?**
- **A (recommandé)** — Non : il ne délègue pas ; les worktrees parallèles sont lancés par le
  coordinateur, qui porte déjà la règle. Si un jour il délègue, la règle neutre de la méthode
  s'applique d'elle-même.
- B — Ajouter une ligne préventive dans `iakaframe-fabrication/SKILL.md`.

**Q3 — Kits des autres runners ?**
- **A (recommandé)** — **Codex seul** : une ligne conditionnelle (« si tu lances un vrai
  sous-agent par `spawn_agent`, son `message` commence par la ligne ») — Codex sait déléguer
  pour de vrai depuis 2026 ; `task_name` n'est pas touché (segment de chemin, pas de parenthèses).
  Ollama, Open WebUI, AnythingLLM exclus : délégation narrative, aucune consigne transmise.
- B — Aucun kit hors Claude Code (la méthode neutre suffit) : Codex n'aurait aucun rappel.
- C — Les quatre kits : du texte qui ne s'applique à rien chez trois d'entre eux.

**Q4 — Version ?**
- **A (recommandé)** — **Pas de montée de version** dans ce lot : changement de texte de méthode,
  aucun comportement du CLI ne bouge ; il part avec le prochain lot `chore/bump-X` (et donc la
  prochaine publication). Une mineure imposerait la revue complète (§ « Version mineure »),
  disproportionnée ici.
- B — Montée de correctif `0.41.1` dans ce lot (bump + état des lieux ; le tag reste à Stéphane).

**Q5 — Déploiement dans la configuration globale de Stéphane (`~/.claude/`) ?**
- **A (recommandé)** — **Tout est geste de Stéphane** : recopier la nouvelle puce dans
  `~/.claude/CLAUDE.md`, puis lancer `iakaframe skills deploy --global` et
  `iakaframe agents generate --global` (qui écrivent dans `~/.claude/skills/` et
  `~/.claude/agents/`). Aucun agent n'écrit dans `~/.claude/`.
- B — `~/.claude/CLAUDE.md` à Stéphane, mais Gimli lance les deux verbes `--global` sur « go »
  explicite de Stéphane dans la session.

## Périmètre

- **Inclus** : les textes des sections « Texte exact » ci-dessous dans les six fichiers source
  (méthode, deux skills, deux personas, kit Claude Code) + le kit Codex (Q3-A) ; régénération des
  artefacts dérivés dans le dépôt iakaframe (goldens de skills et de contrats, vitrine
  `methode-de-travail.html`) ; suite de tests CLI verte ; relevé `iakaframe vendor-check`.
- **Exclu** : toute modification de la grammaire (elle appartient à `temps-restant.md`) ;
  `iakaframe-fabrication/SKILL.md` (Q2-A) ; kits Ollama, Open WebUI, AnythingLLM (Q3-A) ;
  `frames/releases/StefFrame2/**` ; le worktree `.claude/worktrees/agent-ad0d5f08878d103e5/` ;
  **tout fichier sous `~/.claude/`** (Q5) ; le re-vendorage du dépôt iakaFrameGUI (lot séparé si
  `vendor-check` signale une dérive) ; montée de version et tag (Q4-A) ; tout code
  d'IakaAgentsMonitor ; tout contrôle automatique de la présence de la ligne (hook, lint).

## Texte exact à insérer

> Les numéros de ligne sont ceux relevés le 26/09 : **se repérer à l'ancre citée**, pas au numéro.

### T1 — `methode-de-travail.md`

**Où** : dans § « Workflows de sous-agents — activés par défaut », **après** le paragraphe qui se
termine par « reprise dans `~/.claude/CLAUDE.md` § Conventions permanentes. » (l. 491-492) et
**avant** `### La rétrospective — inspecter & adapter` (l. 494). Une ligne vide avant et après.

```markdown
#### Toute délégation annonce sa durée estimée

Quand un agent en fait travailler un autre (sous-agent, agent d'un workflow), la **première ligne
de la consigne** qu'il lui transmet annonce la durée prévue du travail :

    Durée estimée : ~10 min

Cette ligne sert trois lecteurs : le décideur, qui voit si un agent est à mi-course ou en retard ;
les outils d'observation (la barre « Reste » d'IakaAgentsMonitor, puis la fiche publiée sur le
bus) ; et le sous-agent lui-même, qui connaît son budget. Elle est **neutre** : tout runner
transmet une consigne texte, la règle ne dépend d'aucun champ propre à un outil. Un runner qui
offre en plus un libellé court de délégation peut y reprendre la valeur : c'est son kit qui le dit.

**Forme exacte** (grammaire fermée ; tout écart rend la ligne illisible pour les outils) :

- l'étiquette `Durée estimée :` ouvre la consigne, suivie de la valeur, **rien après** ;
- valeur : `~`, un entier de 1 à 3 chiffres, une unité `s`, `min` ou `h` en minuscules —
  `~45 s`, `~10 min`, `~2 h`. Pas de décimale (`~90 min`, pas `~1.5 h`), pas d'autre unité
  (`mn`, `mins`, `heure` sont refusés) ;
- fourchette : `~10-15 min` — deux entiers, le premier plus petit, **une seule unité**, à la fin ;
- bornes : de 10 s à 12 h (borne haute de la fourchette).

**Comment estimer.**

- On estime le **temps d'horloge** du sous-agent, du lancement à la remise, sans l'attente d'une
  réponse humaine. Ce n'est pas la charge en jours-homme, qui reste l'affaire de l'estimation du
  jalon de cadrage.
- **Ordre de grandeur honnête**, arrondi à une valeur ronde (30 s, 1, 2, 3, 5, 10, 15, 20, 30,
  45 min, 1 h, 2 h…) : `~7 min 30 s` serait une précision fictive — et hors grammaire.
- Hésitation bornée → **fourchette** plutôt qu'une valeur au milieu (`~10-20 min`). Au-delà d'un
  facteur 3 entre les bornes, elle n'informe plus : prendre la borne haute plausible.
- **Aucune idée** → **omettre la ligne** plutôt qu'inventer. Les outils affichent alors un tiret ;
  un chiffre inventé fabrique une fausse alerte. Jamais de texte à la place de la valeur
  (`Durée estimée : inconnue` est hors grammaire).
- Un dépassement n'est pas une faute : la barre le rend visible, c'est son rôle. On ne corrige pas
  l'estimation en cours de route ; une relance porte sa propre ligne.
```

*(Si Q1 = B : remplacer la puce « Aucune idée » par « Toujours estimer, au pire par une fourchette
large ; ne jamais omettre la ligne. ») (Si les quatre espaces du bloc d'exemple posent problème au
rendu, un bloc délimité par trois accents graves est équivalent.)*

### T2 — `library/skills/iakaframe-aragorn/SKILL.md`

**T2a — Procédure, étape 2** (l. 40-41). Remplacer :
`(un ordre de mission clair :` ⏎ `   quoi, sur quelle base, critère de fin).`
par :
`(un ordre de mission clair :` ⏎ `   quoi, sur quelle base, critère de fin, durée estimée).`

**T2b — Gabarit « Ordre de mission »** (l. 63-69). Le bloc devient (nouvelle **première** ligne) :

```markdown
Durée estimée : ~{valeur}
# Ordre de mission — {agent} — {date}
## Tâche : {quoi, en une phrase}
## Base : {instruction / branche / version sur laquelle travailler}
## Critère de fin : {ce qui définit "terminé"}
## Pré-requis vérifiés : {gate amont OK / manquant}
```

**T2c — Juste après la clôture du bloc** (après l. 69, avant `## Communication via iakaHub`),
une ligne vide puis :

```markdown
La première ligne annonce la durée du travail délégué (`~10 min`, `~10-15 min`) ; forme et façon
d'estimer : `methode-de-travail.md` § « Toute délégation annonce sa durée estimée ». Sans aucune
idée de la durée, on omet la ligne plutôt que d'inventer.
```

### T3 — `library/skills/iakaframe-odin/SKILL.md`

**Où** : Procédure, étape 3 (l. 63). Remplacer :
`3. **Délègue** la suite à l'Aragorn de l'équipe concernée.`
par :

```markdown
3. **Délègue** la suite à l'Aragorn de l'équipe concernée. Toute consigne transmise à un
   sous-agent commence par la ligne `Durée estimée : ~<valeur>` (`methode-de-travail.md`
   § « Toute délégation annonce sa durée estimée »).
```

### T4 — `library/personas/aragorn.md`

**Où** : § « Dispatch à la demande de l'utilisateur », l. 97. Remplacer :
`Aragorn produit alors un **ordre de mission** (quoi, sur quelle base, critère de fin) et`
par :
`Aragorn produit alors un **ordre de mission** (quoi, sur quelle base, critère de fin, et en`
`première ligne la **durée estimée** — `methode-de-travail.md` § « Toute délégation annonce sa`
`durée estimée ») et`
(la suite du paragraphe, « **dispatche le subagent cible** — … », est inchangée ; recoller les
lignes à ~100 colonnes).

### T5 — `library/personas/odin.md`

**Où** : § « Entrées → Sorties », à la fin de la puce **Produit** (après « passe la main à
l'**Aragorn** de l'équipe concernée. », l. 83-84), ajouter une nouvelle puce :

```markdown
- **Délègue** : toute consigne qu'il transmet à un sous-agent commence par la ligne
  `Durée estimée : ~<valeur>` (`methode-de-travail.md` § « Toute délégation annonce sa durée
  estimée »).
```

### T6 — `kits/iakaframe-claude/global/CLAUDE.md`

**Où** : § « Conventions permanentes (tous projets) », nouvelle **dernière** puce, après la puce
« Workflows de sous-agents activés par défaut » (se termine l. 150 par « sous-agents — activés par
défaut ». »).

```markdown
- **Durée estimée de toute délégation.** Toute consigne passée à un sous-agent (outil Agent,
  agents d'un workflow) commence par la ligne `Durée estimée : ~<valeur>` — `~10 min`,
  fourchette `~10-15 min` ; entiers, unités `s`/`min`/`h`, de 10 s à 12 h, rien après la
  valeur. Quand l'outil offre le champ `description`, il se termine par le même suffixe entre
  parenthèses, tilde compris : `Cadrer barre de temps (~10 min)`. Ordre de grandeur honnête,
  arrondi ; sans aucune idée, omettre les deux plutôt qu'inventer. Réf. :
  `methode-de-travail.md` § « Toute délégation annonce sa durée estimée ».
```

### T7 — `kits/iakaframe-codex/AGENTS.md` (si Q3 = A)

**Où** : bloc « **Orchestrateurs uniquement** (🦅 Odin / 🛡️ Aragorn) — délégation A→B », nouvelle
puce après la puce « **Restitution VERBATIM** … » (l. 94), avant la note « Les kits n'ont pas de
hook garde ».

```markdown
- **Durée estimée** : si tu lances un **vrai sous-agent** (multi-agents Codex activé,
  `spawn_agent`), son `message` commence par la ligne `Durée estimée : ~<valeur>` (`~10 min`,
  `~10-15 min` ; entiers, `s`/`min`/`h`). Ne touche pas `task_name`. Sans aucune idée de la durée,
  omets la ligne. Réf. : `methode-de-travail.md` § « Toute délégation annonce sa durée estimée ».
```

## Étapes d'implémentation

1. Relire cette instruction et `temps-restant.md` § « Grammaire fermée ». Vérifier que l'arbre est
   propre et qu'aucun autre agent ne travaille sur les mêmes fichiers (le worktree
   `agent-ad0d5f08878d103e5` existe : ne pas y toucher, signaler s'il porte des modifications de
   ces fichiers).
2. Appliquer **T1** (méthode). Relire le fichier sur disque. Commit
   `docs(methode): toute delegation annonce sa duree estimee`.
3. Appliquer **T2 à T5** (skills et personas). Relire. Commit
   `docs(library): duree estimee dans les ordres de mission d'Aragorn et d'Odin`.
4. Appliquer **T6** et, selon Q3, **T7**. Relire. Commit
   `docs(kits): duree estimee de delegation (Claude Code, Codex)`.
5. Régénérer les dérivés, dans cet ordre : `node cli/scripts/gen-skills-golden.mjs`,
   `node cli/scripts/gen-agents-golden.mjs`, `node cli/scripts/gen-methode-vitrine.mjs` (deux
   fois : le second passage doit laisser un diff vide). Commit
   `chore(golden): regeneration apres duree estimee`.
6. `npm test` dans `cli/` : 100 % vert. En cas de rouge sur un test de prose, **ne pas** modifier
   l'assertion : remonter au cadrage.
7. `iakaframe vendor-check` : noter le résultat. Dérive vers iakaFrameGUI ⇒ **signaler** dans la
   remise (lot de re-vendorage séparé), ne rien écrire hors du dépôt iakaframe.
8. Remettre au gate qualité (Legolas) par jalon ; la liste « Ce qui appartient à Stéphane »
   figure dans la remise.

## Fichiers concernés

- `methode-de-travail.md` — nouvelle sous-section (T1).
- `library/skills/iakaframe-aragorn/SKILL.md` — étape 2 + gabarit + renvoi (T2).
- `library/skills/iakaframe-odin/SKILL.md` — étape 3 (T3).
- `library/personas/aragorn.md` — § Dispatch (T4).
- `library/personas/odin.md` — § Entrées → Sorties (T5).
- `kits/iakaframe-claude/global/CLAUDE.md` — nouvelle puce (T6).
- `kits/iakaframe-codex/AGENTS.md` — nouvelle puce (T7, si Q3 = A).
- Régénérés : `methode-de-travail.html`, golden des skills et goldens des contrats (sous
  `cli/test/fixtures/`, chemins donnés par les scripts).

## Risques

- **R1 — Tests de prose ou de parité rouges** au-delà des goldens attendus (textes cités en dur
  dans une garde). *Mitigation* : étape 6, remonter plutôt que toucher une assertion.
- **R2 — Exemples hors grammaire** glissés dans les textes (`~1,5 h`, `~10 mins`) : les délégants
  recopieraient une forme que l'app refuse. *Mitigation* : critère CA-8.
- **R3 — Fuite de Claude Code dans les textes neutres** (`description`, « outil Agent »).
  *Mitigation* : critère CA-7.
- **R4 — Déploiement oublié** : tant que Stéphane n'a pas recopié la puce dans `~/.claude/CLAUDE.md`
  et relancé les deux verbes `--global`, ses sessions n'appliquent pas la règle. *Mitigation* :
  la remise liste les trois gestes, avec les commandes exactes.
- **R5 — Worktree concurrent** `agent-ad0d5f08878d103e5` qui modifierait les mêmes fichiers :
  conflit à la fusion. *Mitigation* : étape 1.
- **R6 — Estimations ignorées ou fantaisistes** : la règle est comportementale, aucun hook ne la
  garantit. Accepté : c'est précisément ce que la barre rend visible (R2 de `temps-restant.md`).

## Critères d'acceptation

Commandes lancées depuis `~/work/iakaframe`.

- [ ] **CA-1** `grep -n '^#### Toute délégation annonce sa durée estimée$' methode-de-travail.md`
      rend **une** ligne, dont le numéro est compris entre celui de
      `### Workflows de sous-agents` et celui de `### La rétrospective`.
- [ ] **CA-2** `grep -n -A1 '^Durée estimée : ~{valeur}$' library/skills/iakaframe-aragorn/SKILL.md`
      rend une ligne immédiatement suivie de `# Ordre de mission — {agent} — {date}` ; et
      `grep -c 'critère de fin, durée estimée' library/skills/iakaframe-aragorn/SKILL.md` = 1.
- [ ] **CA-3** `grep -c 'Durée estimée : ~<valeur>' library/skills/iakaframe-odin/SKILL.md
      library/personas/odin.md` rend 1 pour chacun ; `grep -c 'durée estimée'
      library/personas/aragorn.md` ≥ 1.
- [ ] **CA-4** Chaque fichier modifié hors méthode renvoie à l'ancre :
      `grep -l 'Toute délégation annonce sa durée estimée'` liste les 5 fichiers de T2 à T6
      (6 avec T7).
- [ ] **CA-5** Kit Claude Code : `grep -c 'Durée estimée de toute délégation'
      kits/iakaframe-claude/global/CLAUDE.md` = 1, et la même puce contient `description` et
      `(~10 min)`.
- [ ] **CA-6** Kits exclus intacts : `grep -c 'Durée estimée' kits/iakaframe-ollama/AGENTS.md
      kits/iakaframe-openwebui/AGENTS.md kits/iakaframe-anythingllm/AGENTS.md` = 0 partout ;
      Codex = 1 si Q3 = A, 0 sinon ; `grep -c 'Durée estimée'
      library/skills/iakaframe-fabrication/SKILL.md` = 0 (si Q2 = A).
- [ ] **CA-7** Neutralité : `git diff main -U0 -- methode-de-travail.md library/ | grep '^+' |
      grep -ciE 'description|claude|outil agent'` = 0.
- [ ] **CA-8** Exemples conformes : toute occurrence ajoutée de `Durée estimée : ~X` ou `(~X)` où
      X n'est pas `<valeur>` / `{valeur}` respecte
      `~[0-9]{1,3}( ?- ?[0-9]{1,3})? ?(s|min|h)` (vérification par
      `git diff main -U0 | grep '^+' | grep -oE '~[^ )`]*( ?[a-z]+)?'`, relue une à une) ; aucune
      virgule ni point décimal, aucune unité hors `s`/`min`/`h`.
- [ ] **CA-9** `node cli/scripts/gen-methode-vitrine.mjs` relancé une seconde fois : `git status`
      propre (idempotence) ; `grep -c 'Durée estimée' methode-de-travail.html` ≥ 1.
- [ ] **CA-10** `npm test` dans `cli/` : 100 % vert, aucune assertion existante modifiée
      (`git diff main -- cli/test/*.js` vide ; seuls les fichiers de `cli/test/fixtures/`
      régénérés par les scripts changent).
- [ ] **CA-11** Hors d'atteinte : `git diff --stat main -- frames/ .claude/` vide ; aucun fichier
      sous `~/.claude/` modifié par le lot ; `cli/package.json` inchangé (si Q4 = A).
- [ ] **CA-12** Le résultat de `iakaframe vendor-check` figure dans la remise.

## Estimation (ordre de grandeur, révisable)

- **Charge : ~0,3 jour-homme** (fourchette 0,25 à 0,5) — textes 0,1 ; régénérations et tests
  0,1 ; gate qualité 0,1.
- **Complexité / risque : faible.** Du texte, une grammaire déjà tranchée ; le seul point délicat
  est la chaîne des dérivés (goldens, vitrine).
- **Inconnues qui peuvent faire glisser** : une garde de prose inattendue (R1) ; une dérive
  `vendor-check` qui ouvrirait un lot de re-vendorage iakaFrameGUI (hors de cette estimation) ;
  le worktree concurrent (R5).
- Rappel : la même estimation figurait dans `temps-restant.md` (« lot méthode ~0,4 j », cadrage
  compris).

## Ce qui appartient à Stéphane

- Trancher **Q1 à Q5** (ou « go » pour les recommandations).
- **Déployer dans sa configuration globale** — jamais fait par un agent :
  1. recopier la puce **T6** dans `~/.claude/CLAUDE.md`, § « Conventions permanentes (tous
     projets) », après la puce « Workflows de sous-agents activés par défaut » ;
  2. lancer `iakaframe skills deploy --global` puis `iakaframe skills deploy --global --check`
     (met à jour `~/.claude/skills/iakaframe-aragorn` et `iakaframe-odin`) ;
  3. lancer `iakaframe agents generate --global` puis `--check` (met à jour les contrats Aragorn
     et Odin dans `~/.claude/agents/`) ;
  *(si Q5 = B, les points 2 et 3 passent à Gimli sur « go » explicite).*
- Décider, le moment venu, de la montée de version et du tag (publication) qui embarqueront ce
  changement.
- Observer, en usage réel, si les estimations annoncées sont utiles, et ajuster l'échelle (DA-D1)
  ou le facteur 3 (DA-D2).

## Sources

- Fichiers lus le 2026-09-26 : `IakaAgentsMonitor/specs/instructions/temps-restant.md`
  (grammaire fermée, § Lot méthode), `IakaAgentsMonitor/specs/instructions/agnostique-mqtt.md`
  (champ `estimate`, Q5-A), `methode-de-travail.md`, les skills `iakaframe-aragorn`,
  `iakaframe-odin`, `iakaframe-fabrication`, les personas `aragorn`, `odin`, les cinq kits cités,
  `cli/scripts/gen-methode-vitrine.mjs`, `specs/instructions/deploiement-skills-runtime.md`
  (§ 5.4, 5.8), `specs/instructions/dette-version-source-unique.md`, `cli/package.json`,
  `specs/etat-des-lieux.md` (journal des versions).
- Sous-agents de Codex CLI (`spawn_agent`, champs `message` et `task_name`, drapeau
  `multi_agent_v2`) :
  [Codex CLI Multi-Agent Orchestration v2 — Codex Knowledge Base](https://codex.danielvaughan.com/2026/04/11/codex-cli-multi-agent-orchestration-v2-complete-guide/),
  [Codex CLI Subagents — Codex Knowledge Base](https://codex.danielvaughan.com/2026/03/26/codex-cli-subagents-toml-parallelism/),
  [Subagents — ChatGPT Learn](https://learn.chatgpt.com/docs/agent-configuration/subagents).
